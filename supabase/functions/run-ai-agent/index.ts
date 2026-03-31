import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LOVABLE_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function tokenizeForMatch(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .slice(0, 20)
}

function scoreOverlap(content: string, tokens: string[]): number {
  const lower = content.toLowerCase()
  let score = 0
  for (const token of tokens) {
    if (lower.includes(token)) {
      score += 1
    }
  }
  return score
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // GET or ping = health check (no OpenAI call)
  if (req.method === 'GET') {
    const hasKey = !!(Deno.env.get('LOVABLE_API_KEY') || Deno.env.get('OPENAI_API_KEY'))
    return new Response(
      JSON.stringify({ ok: true, configured: hasKey, message: hasKey ? 'AI provider configured' : 'No AI provider key set' }),
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
      const hasKey = !!(Deno.env.get('LOVABLE_API_KEY') || Deno.env.get('OPENAI_API_KEY'))
      return new Response(
        JSON.stringify({ ok: true, configured: hasKey, message: hasKey ? 'AI provider configured' : 'No AI provider key set' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
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

    // Build RAG context via semantic search when agent has RAG enabled.
    let ragContext = ''
    if (agent.rag_enabled === true) {
      try {
        const baseUrl = Deno.env.get('SUPABASE_URL')
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (baseUrl && serviceKey) {
          const semRes = await fetch(`${baseUrl}/functions/v1/semantic-search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              query: userMessage,
              match_threshold: 0.65,
              match_count: 8,
              entity_type: null, // search ALL entity types
              user_id: typeof user_id === 'string' && user_id.length > 0 ? user_id : null,
            }),
          })
          if (semRes.ok) {
            const semBody = await semRes.json()
            const results = semBody.results ?? []
            if (results.length > 0) {
              const contextChunks = results.map((doc: { content?: string; entity_type?: string; similarity?: number; metadata?: Record<string, unknown> }, idx: number) => {
                const source = doc.metadata?.source ?? doc.entity_type ?? 'unknown'
                return `[${idx + 1}] (${source}, relevance: ${(doc.similarity ?? 0).toFixed(2)})\n${doc.content ?? ''}`
              })
              ragContext = contextChunks.join('\n\n')
            }
          } else {
            console.warn('Semantic search returned non-OK:', semRes.status)
          }
        }
      } catch (ragError) {
        console.warn('RAG semantic search failed, falling back to keyword match:', ragError)
        // Fallback: simple keyword search on embeddings
        try {
          const { data: embeddingRows } = await supabaseClient
            .from('embeddings')
            .select('entity_id, entity_type, content, metadata')
            .limit(200)

          if (Array.isArray(embeddingRows) && embeddingRows.length > 0) {
            const tokens = tokenizeForMatch(userMessage)
            const ranked = embeddingRows
              .filter((row) => typeof row.content === 'string' && row.content.length > 0)
              .map((row) => ({ ...row, score: scoreOverlap(row.content, tokens) }))
              .filter((row) => row.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 8)

            if (ranked.length > 0) {
              ragContext = ranked.map((row, idx) => {
                const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {}
                const source = typeof metadata.source === 'string' ? metadata.source : (row.entity_type ?? 'unknown')
                return `[${idx + 1}] (${source})\n${row.content}`
              }).join('\n\n')
            }
          }
        } catch (fallbackErr) {
          console.warn('Keyword fallback also failed:', fallbackErr)
        }
      }
    }

    // Build system prompt with RAG context
    const systemPrompt = [
      agent.system_prompt,
      additionalPrompt ? additionalPrompt : null,
      ragContext
        ? `\n\nRELEVANT CONTEXT (from knowledge base):\nUse the following retrieved context to answer the user's query. If the context doesn't contain relevant information, say so clearly and answer based on your general knowledge.\n\n${ragContext}`
        : null,
    ].filter(Boolean).join('\n\n')

    // Determine AI provider: prefer Lovable AI gateway, fallback to OpenAI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    let aiUrl: string
    let aiHeaders: Record<string, string>
    let modelName: string

    if (LOVABLE_API_KEY) {
      aiUrl = LOVABLE_GATEWAY
      aiHeaders = { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' }
      modelName = 'google/gemini-2.5-flash'
    } else if (OPENAI_API_KEY) {
      aiUrl = 'https://api.openai.com/v1/chat/completions'
      aiHeaders = { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
      modelName = 'gpt-4o-mini'
    } else {
      throw new Error('No AI provider configured (LOVABLE_API_KEY or OPENAI_API_KEY required)')
    }

    // Execute agent
    const openaiResponse = await fetch(aiUrl, {
      method: 'POST',
      headers: aiHeaders,
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
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
