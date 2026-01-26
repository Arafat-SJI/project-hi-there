import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MCPToolCallResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

async function sendMCPRequest(
  serverUrl: string,
  method: string,
  params: Record<string, unknown> = {},
  authConfig: Record<string, unknown> = {},
  authType: string = 'none'
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Apply authentication
  if (authType === 'api_key' && authConfig.api_key) {
    headers['X-API-Key'] = String(authConfig.api_key);
  } else if (authType === 'bearer' && authConfig.bearer_token) {
    headers['Authorization'] = `Bearer ${authConfig.bearer_token}`;
  } else if (authType === 'basic' && authConfig.username) {
    const credentials = btoa(`${authConfig.username}:${authConfig.password || ''}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const requestBody = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  };

  const response = await fetch(serverUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'MCP request failed');
  }

  return data.result;
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
      server_id,
      tool_name,
      tool_input,
      agent_id,
      conversation_id,
      message_id,
      user_id
    } = await req.json()

    if (!server_id || !tool_name) {
      return new Response(
        JSON.stringify({ error: 'server_id and tool_name are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get server configuration
    const { data: server, error: serverError } = await supabaseClient
      .from('mcp_servers')
      .select('*')
      .eq('id', server_id)
      .single()

    if (serverError || !server) {
      throw new Error('MCP server not found')
    }

    if (!server.is_active) {
      throw new Error('MCP server is not active')
    }

    const { server_url, transport_type, auth_type, auth_config } = server

    // Only HTTP transport is currently supported
    if (transport_type !== 'http') {
      throw new Error(`Transport type '${transport_type}' is not supported for remote execution`)
    }

    // Create execution record
    const { data: execution, error: insertError } = await supabaseClient
      .from('mcp_tool_executions')
      .insert({
        server_id,
        agent_id: agent_id || null,
        conversation_id: conversation_id || null,
        message_id: message_id || null,
        user_id,
        tool_name,
        tool_input: tool_input || {},
        status: 'executing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create execution record:', insertError)
      throw new Error('Failed to create execution record')
    }

    const startTime = Date.now()

    try {
      // Execute the tool via MCP
      const result = await sendMCPRequest(
        server_url,
        'tools/call',
        {
          name: tool_name,
          arguments: tool_input || {},
        },
        auth_config,
        auth_type
      ) as MCPToolCallResponse

      const duration = Date.now() - startTime

      // Process the result
      let output: unknown = result
      if (result.content && Array.isArray(result.content)) {
        // Extract text content for easier consumption
        const textContent = result.content
          .filter(c => c.type === 'text' && c.text)
          .map(c => c.text)
          .join('\n')

        output = {
          raw: result,
          text: textContent || null,
          hasError: result.isError || false,
        }
      }

      // Update execution record with success
      await supabaseClient
        .from('mcp_tool_executions')
        .update({
          status: 'completed',
          tool_output: output,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', execution.id)

      return new Response(
        JSON.stringify({
          execution_id: execution.id,
          output,
          duration_ms: duration,
          status: 'completed',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )

    } catch (toolError: unknown) {
      const duration = Date.now() - startTime
      const errorMessage = toolError instanceof Error ? toolError.message : 'Tool execution failed'

      // Update execution record with failure
      await supabaseClient
        .from('mcp_tool_executions')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', execution.id)

      return new Response(
        JSON.stringify({
          execution_id: execution.id,
          error: errorMessage,
          duration_ms: duration,
          status: 'failed',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

  } catch (error: unknown) {
    console.error('Execute MCP tool error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
