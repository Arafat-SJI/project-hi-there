/**
 * Gemini RAG Query Edge Function
 *
 * Performs Retrieval-Augmented Generation using vector embeddings:
 * 1. Generates an embedding for the user's query
 * 2. Searches for similar content via match_embeddings RPC
 * 3. Uses AI to synthesize a contextual answer from retrieved chunks
 * 4. Logs query to gemini_query_logs
 *
 * Input:  { query, corpus_id?, user_id?, match_count?, match_threshold?, generate_answer? }
 * Output: { results: MatchResult[], answer?: string, result_count, duration_ms }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateEmbedding, chatCompletion, logUsage } from '../_shared/ai-provider-routing.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const {
      query,
      corpus_id,
      user_id,
      match_count = 10,
      match_threshold = 0.7,
      generate_answer = true,
      entity_type,
    } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const start = Date.now()

    // Step 1: Generate embedding for the query
    const embeddingResult = await generateEmbedding(supabaseClient, query)

    // Step 2: Search for similar content using match_embeddings RPC
    const { data: matches, error: matchError } = await supabaseClient
      .rpc('match_embeddings', {
        query_embedding: embeddingResult.embedding,
        match_threshold: match_threshold,
        match_count: match_count,
        filter_entity_type: entity_type || null,
        filter_user_id: user_id || null,
      })

    if (matchError) {
      console.error('match_embeddings error:', matchError)
      throw new Error(`Vector search failed: ${matchError.message}`)
    }

    const results = matches || []
    const resultCount = results.length

    // Step 3: Optionally generate a contextual answer using AI
    let answer: string | undefined
    let answerTokens = { input: 0, output: 0 }

    if (generate_answer && resultCount > 0) {
      const contextChunks = results
        .map((r: { content: string; similarity: number; entity_type: string }, i: number) =>
          `[${i + 1}] (similarity: ${r.similarity.toFixed(3)}, type: ${r.entity_type || 'unknown'})\n${r.content}`
        )
        .join('\n\n---\n\n')

      const chatResult = await chatCompletion(supabaseClient, {
        messages: [
          {
            role: 'system',
            content: `You are a helpful knowledge assistant. Answer the user's question based ONLY on the provided context chunks. If the context doesn't contain enough information to answer, say so clearly. Reference the chunk numbers [1], [2], etc. when citing information.`
          },
          {
            role: 'user',
            content: `Question: ${query}\n\nContext:\n${contextChunks}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      })

      answer = chatResult.content
      answerTokens = {
        input: chatResult.input_tokens,
        output: chatResult.output_tokens,
      }
    }

    const durationMs = Date.now() - start

    // Step 4: Log the query
    await supabaseClient.from('gemini_query_logs').insert({
      corpus_id: corpus_id ?? null,
      user_id: user_id ?? null,
      query_text: query,
      result_count: resultCount,
      duration_ms: durationMs,
      metadata: {
        match_threshold,
        match_count,
        entity_type: entity_type || null,
        generated_answer: !!answer,
        embedding_tokens: embeddingResult.tokens,
      },
    })

    // Log AI usage
    await logUsage(
      supabaseClient,
      user_id || null,
      null,
      'gemini-rag-query',
      answerTokens.input + (embeddingResult.tokens || 0),
      answerTokens.output,
      embeddingResult.tokens || 0,
      0
    )

    return new Response(
      JSON.stringify({
        success: true,
        query,
        results: results.map((r: { id: string; entity_type: string; entity_id: string; content: string; metadata: Record<string, unknown>; similarity: number; unified_document_id: string }) => ({
          id: r.id,
          entity_type: r.entity_type,
          entity_id: r.entity_id,
          content: r.content,
          metadata: r.metadata,
          similarity: r.similarity,
          unified_document_id: r.unified_document_id,
        })),
        answer,
        result_count: resultCount,
        duration_ms: durationMs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('gemini-rag-query error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
