import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[]
  }>
}

interface MatchEmbeddingRow {
  id: string
  entity_type: string
  entity_id: string
  content: string
  metadata: unknown
  similarity: number
  unified_document_id?: string | null
}

async function embedQuery(openAiApiKey: string, input: string): Promise<number[]> {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input,
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Failed to embed query: ${resp.status} - ${text}`)
  }

  const json = (await resp.json()) as OpenAIEmbeddingResponse
  const embedding = json.data?.[0]?.embedding
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding response missing embedding vector')
  }
  return embedding
}

function formatRagContext(chunks: MatchEmbeddingRow[]): string {
  return chunks
    .map((c, i) => {
      const sim = Number.isFinite(c.similarity) ? c.similarity.toFixed(3) : 'n/a'
      return `[${i + 1}] (similarity: ${sim})\n${c.content}`
    })
    .join('\n\n---\n\n')
}

function normalizeCountQuery(input: string): string {
  return input.toLowerCase().replace(/\s+/g, ' ').trim()
}

function inferStatusFilter(input: string): 'todo' | 'in_progress' | 'completed' | null {
  const q = normalizeCountQuery(input)
  if (q.includes('inprogress') || q.includes('in progress') || q.includes('in-progress')) return 'in_progress'
  if (q.includes('todo') || q.includes('to do') || q.includes('to-do')) return 'todo'
  if (q.includes('completed') || q.includes('done') || q.includes('complete')) return 'completed'
  return null
}

function inferProviderFilter(input: string): 'clickup' | 'workamajig' | null {
  const q = normalizeCountQuery(input)
  if (q.includes('clickup')) return 'clickup'
  if (q.includes('workamajig') || q.includes('wmj')) return 'workamajig'
  return null
}

function isCountQuestion(input: string): boolean {
  const q = normalizeCountQuery(input)
  return q.includes('how many') || q.includes('count') || q.includes('number of')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // GET or ping = health check (no OpenAI call)
  if (req.method === 'GET') {
    const hasKey = !!Deno.env.get('OPENAI_API_KEY')
    return new Response(
      JSON.stringify({ ok: true, configured: hasKey, message: hasKey ? 'OpenAI configured' : 'OPENAI_API_KEY not set' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }

  try {
    let body: Record<string, unknown> = {}
    try {
      const parsed = await req.json()
      body = parsed != null && typeof parsed === 'object' ? parsed : {}
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (body.ping === true) {
      const hasKey = !!Deno.env.get('OPENAI_API_KEY')
      return new Response(
        JSON.stringify({ ok: true, configured: hasKey, message: hasKey ? 'OpenAI configured' : 'OPENAI_API_KEY not set' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { agent_id, agent_slug, execution_context, input: bodyInput, user_id } = body

    if (!agent_id && !agent_slug) {
      return new Response(
        JSON.stringify({ error: 'agent_id or agent_slug is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get agent configuration
    let query = supabaseClient.from('ai_agents').select('*')
    if (agent_id) {
      query = query.eq('id', agent_id)
    } else {
      query = query.eq('slug', agent_slug)
    }

    const { data: agent } = await query.single()
    if (!agent) {
      throw new Error('Agent not found')
    }

    // Get user personalization if exists
    let additionalPrompt = ''
    if (user_id) {
      try {
        const { data: personalization } = await supabaseClient
          .from('user_agent_personalizations')
          .select('additional_prompt')
          .eq('user_id', user_id)
          .eq('agent_id', agent.id)
          .eq('is_enabled', true)
          .single()

        additionalPrompt = personalization?.additional_prompt || ''
      } catch {
        // Table may not exist yet, skip personalization
        console.warn('user_agent_personalizations query failed, skipping')
      }
    }

    const startTime = Date.now()

    // User message: prefer explicit input (Run Agent modal), then execution_context (programmatic calls)
    const userMessage =
      typeof bodyInput === 'string' && bodyInput.trim().length > 0
        ? bodyInput.trim()
        : execution_context != null
          ? (typeof execution_context === 'string' ? execution_context : JSON.stringify(execution_context))
          : 'No context provided. Please respond with a default helpful message.'

    // Optional RAG: if enabled, retrieve relevant synced task chunks
    let ragContext = ''
    let taskStatsContext = ''
    try {
      if (agent.rag_enabled === true) {
        // If user asks for counts, answer from synced DB (more reliable than chunk retrieval)
        if (isCountQuestion(userMessage)) {
          const status = inferStatusFilter(userMessage)
          const provider = inferProviderFilter(userMessage)

          if (status && provider) {
            const { count, error: countError } = await supabaseClient
              .from('tasks')
              .select('id', { count: 'exact', head: true })
              .eq('status', status)
              .eq('metadata->>source', provider)

            if (countError) {
              console.warn('Task count query failed:', countError.message)
            } else if (typeof count === 'number') {
              taskStatsContext =
                `TASK STATS (from synced DB)\n` +
                `- provider: ${provider}\n` +
                `- status: ${status}\n` +
                `- count: ${count}\n`
            }
          }
        }

        const queryEmbedding = await embedQuery(OPENAI_API_KEY, userMessage)
        const { data: matches, error: matchError } = await supabaseClient.rpc('match_embeddings', {
          query_embedding: queryEmbedding,
          match_threshold: 0.72,
          match_count: 8,
          filter_entity_type: 'task',
          filter_user_id: user_id || null,
        })

        if (matchError) {
          console.warn('RAG match_embeddings failed:', matchError.message)
        } else if (Array.isArray(matches) && matches.length > 0) {
          ragContext = formatRagContext(matches as MatchEmbeddingRow[])
        }
      }
    } catch (e: unknown) {
      console.warn('RAG retrieval failed, continuing without RAG:', e instanceof Error ? e.message : 'Unknown error')
    }

    // Execute agent with OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              agent.system_prompt +
              (additionalPrompt ? `\n\n${additionalPrompt}` : '') +
              (agent.rag_enabled === true
                ? `\n\nRAG ENABLED: You have access to the application's synced task data (ClickUp/Workamajig) and any retrieved task context below. Do NOT say you lack access to ClickUp; answer based on provided task context/stats. If context is insufficient, say what is missing.`
                : '') +
              (taskStatsContext ? `\n\n${taskStatsContext}` : '') +
              (ragContext
                ? `\n\nTASK CONTEXT (synced tasks; use when relevant, cite chunk numbers like [1]):\n${ragContext}`
                : '')
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`AI agent execution failed: ${openaiResponse.status} - ${errorText}`)
    }

    const data = await openaiResponse.json()
    const output = data.choices[0].message.content
    const latency = Date.now() - startTime

    // Log agent run (context stores what was sent as user message for audit)
    const { data: run, error: runError } = await supabaseClient
      .from('ai_agent_runs')
      .insert([{
        agent_id: agent.id,
        user_id: user_id || null,
        status: 'completed',
        context: typeof bodyInput === 'string' && bodyInput.trim().length > 0 ? bodyInput : execution_context,
        output: output,
        token_metrics: data.usage,
        latency_ms: latency,
        provider_used: 'openai',
        model_used: 'gpt-4o-mini',
      }])
      .select()
      .single()

    if (runError) {
      console.error('Failed to log agent run:', runError)
    }

    return new Response(
      JSON.stringify({
        run_id: run?.id || null,
        status: 'completed',
        output,
        token_usage: data.usage,
        latency_ms: latency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Run AI agent error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
