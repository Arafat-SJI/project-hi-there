import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- AI model policy + provider routing (inlined for single-file dashboard deploy) ---

type ModelSelectionMode = 'admin_locked' | 'user_choice'
type UserVisibleModels = 'all_enabled' | 'default_only'

interface AIModelPolicy {
  selection_mode: ModelSelectionMode
  default_chat_model_id: string | null
  default_provider_slug: string | null
  user_visible_models: UserVisibleModels
}

const AI_INTEGRATION_SLUGS = ['openai', 'anthropic', 'google-gemini', 'perplexity'] as const

const INTEGRATION_TO_AI_PROVIDER_SLUG: Record<string, string> = {
  openai: 'openai',
  anthropic: 'anthropic',
  'google-gemini': 'google',
  perplexity: 'perplexity',
}

const DEFAULT_AI_MODEL_POLICY: AIModelPolicy = {
  selection_mode: 'user_choice',
  default_chat_model_id: null,
  default_provider_slug: null,
  user_visible_models: 'all_enabled',
}

interface AllowedChatModel {
  id: string
  is_default: boolean
  provider_id: string
}

interface AIModel {
  id: string
  provider_id: string
  name: string
  model_id: string
  category: 'chat' | 'embedding'
  context_window: number
  input_cost_per_1k: number
  output_cost_per_1k: number
  embedding_cost_per_1k: number
  enabled: boolean
  is_default: boolean
  features: Record<string, boolean>
  ai_providers?: {
    name: string
    slug: string
    api_key_secret_name: string
    base_url: string
  }
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatCompletionRequest {
  messages: ChatMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
  stream?: boolean
}

interface ChatCompletionResponse {
  content: string
  input_tokens: number
  output_tokens: number
  model: string
}

function normalizeAIModelPolicy(raw: unknown): AIModelPolicy {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_AI_MODEL_POLICY }
  }
  const obj = raw as Record<string, unknown>
  return {
    selection_mode: obj.selection_mode === 'admin_locked' ? 'admin_locked' : 'user_choice',
    user_visible_models: obj.user_visible_models === 'default_only' ? 'default_only' : 'all_enabled',
    default_chat_model_id:
      typeof obj.default_chat_model_id === 'string' && obj.default_chat_model_id.length > 0
        ? obj.default_chat_model_id
        : null,
    default_provider_slug:
      typeof obj.default_provider_slug === 'string' && obj.default_provider_slug.length > 0
        ? obj.default_provider_slug
        : null,
  }
}

async function getAIModelPolicy(supabase: SupabaseClient): Promise<AIModelPolicy> {
  const { data, error } = await supabase
    .from('integration_settings')
    .select('ai_model_policy')
    .is('organization_id', null)
    .maybeSingle()
  if (error) throw error
  return normalizeAIModelPolicy(data?.ai_model_policy)
}

async function getConnectedAIProviderIds(supabase: SupabaseClient): Promise<Set<string>> {
  const { data: orgIntegrations, error: orgError } = await supabase
    .from('organization_integrations')
    .select('connection_status, enabled, provider:integration_providers(slug)')
    .eq('connection_status', 'connected')
    .eq('enabled', true)
  if (orgError) throw orgError

  const connectedIntegrationSlugs = new Set<string>()
  for (const row of orgIntegrations ?? []) {
    const slug = (row.provider as { slug?: string } | null)?.slug
    if (slug && (AI_INTEGRATION_SLUGS as readonly string[]).includes(slug)) {
      connectedIntegrationSlugs.add(slug)
    }
  }

  const aiSlugs = [...connectedIntegrationSlugs].map((slug) => INTEGRATION_TO_AI_PROVIDER_SLUG[slug] ?? slug)
  if (aiSlugs.length === 0) return new Set()

  const { data: providers, error: provError } = await supabase.from('ai_providers').select('id').in('slug', aiSlugs)
  if (provError) throw provError
  return new Set((providers ?? []).map((p: { id: string }) => p.id))
}

async function fetchAllowedChatModels(supabase: SupabaseClient): Promise<AllowedChatModel[]> {
  const connectedProviderIds = await getConnectedAIProviderIds(supabase)
  if (connectedProviderIds.size === 0) return []

  const { data, error } = await supabase
    .from('ai_models')
    .select('id, is_default, provider_id')
    .eq('category', 'chat')
    .eq('enabled', true)
  if (error) throw error
  return (data ?? []).filter((m: AllowedChatModel) => connectedProviderIds.has(m.provider_id))
}

function filterModelsForPolicy(policy: AIModelPolicy, models: AllowedChatModel[]): AllowedChatModel[] {
  if (models.length === 0) return []
  const defaultModel =
    models.find((m) => m.id === policy.default_chat_model_id) ??
    models.find((m) => m.is_default) ??
    models[0]
  if (policy.selection_mode === 'admin_locked' || policy.user_visible_models === 'default_only') {
    return defaultModel ? [defaultModel] : models.slice(0, 1)
  }
  return models
}

async function resolveEffectiveModelId(
  supabase: SupabaseClient,
  requestedModelId?: string | null
): Promise<string | undefined> {
  const policy = await getAIModelPolicy(supabase)
  const allowedModels = await fetchAllowedChatModels(supabase)
  const visibleModels = filterModelsForPolicy(policy, allowedModels)
  const visibleIds = new Set(visibleModels.map((m) => m.id))
  const defaultId =
    policy.default_chat_model_id && visibleIds.has(policy.default_chat_model_id)
      ? policy.default_chat_model_id
      : visibleModels.find((m) => m.is_default)?.id ?? visibleModels[0]?.id
  if (policy.selection_mode === 'admin_locked') return defaultId
  if (requestedModelId && visibleIds.has(requestedModelId)) return requestedModelId
  return defaultId
}

async function getApiKey(supabase: SupabaseClient, secretName: string): Promise<string | null> {
  const envKey = Deno.env.get(secretName)
  if (envKey) return envKey
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', `integrations.${secretName.toLowerCase()}`)
    .single()
  if (error || !data) return null
  return data.value
}

async function getModel(
  supabase: SupabaseClient,
  modelId?: string,
  category?: 'chat' | 'embedding'
): Promise<AIModel | null> {
  if (modelId) {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*, ai_providers(*)')
      .eq('id', modelId)
      .eq('enabled', true)
      .single()
    if (error || !data) return null
    return data as AIModel
  }
  if (category) {
    const { data: settingsRow } = await supabase
      .from('integration_settings')
      .select('ai_model_policy')
      .is('organization_id', null)
      .maybeSingle()
    const policy = normalizeAIModelPolicy(settingsRow?.ai_model_policy)
    if (policy.default_chat_model_id) {
      const { data: policyModel, error: policyError } = await supabase
        .from('ai_models')
        .select('*, ai_providers(*)')
        .eq('id', policy.default_chat_model_id)
        .eq('enabled', true)
        .maybeSingle()
      if (!policyError && policyModel) return policyModel as AIModel
    }
    const { data, error } = await supabase
      .from('ai_models')
      .select('*, ai_providers(*)')
      .eq('category', category)
      .eq('is_default', true)
      .eq('enabled', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return data as AIModel
  }
  return null
}

async function chatOpenAI(apiKey: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model || 'gpt-4o-mini',
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 1000,
    }),
  })
  if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`)
  const data = await response.json()
  return {
    content: data.choices[0].message.content,
    input_tokens: data.usage.prompt_tokens,
    output_tokens: data.usage.completion_tokens,
    model: data.model,
  }
}

async function chatAnthropic(apiKey: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model || 'claude-sonnet-4-20250514',
      messages: request.messages.filter((m) => m.role !== 'system'),
      system: request.messages.find((m) => m.role === 'system')?.content,
      max_tokens: request.max_tokens ?? 1000,
      temperature: request.temperature ?? 0.7,
    }),
  })
  if (!response.ok) throw new Error(`Anthropic API error: ${await response.text()}`)
  const data = await response.json()
  return {
    content: data.content[0].text,
    input_tokens: data.usage.input_tokens,
    output_tokens: data.usage.output_tokens,
    model: data.model,
  }
}

async function chatGoogle(apiKey: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const model = request.model || 'gemini-2.5-flash'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: request.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { temperature: request.temperature ?? 0.7, maxOutputTokens: request.max_tokens ?? 1000 },
      }),
    }
  )
  if (!response.ok) throw new Error(`Google AI API error: ${await response.text()}`)
  const data = await response.json()
  const content = data.candidates[0].content.parts[0].text
  return {
    content,
    input_tokens: data.usageMetadata?.promptTokenCount || Math.ceil(JSON.stringify(request.messages).length / 4),
    output_tokens: data.usageMetadata?.candidatesTokenCount || Math.ceil(content.length / 4),
    model,
  }
}

async function chatPerplexity(apiKey: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model || 'sonar',
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 1000,
    }),
  })
  if (!response.ok) throw new Error(`Perplexity API error: ${await response.text()}`)
  const data = await response.json()
  return {
    content: data.choices[0].message.content,
    input_tokens: data.usage.prompt_tokens,
    output_tokens: data.usage.completion_tokens,
    model: data.model,
  }
}

async function chatCompletion(
  supabase: SupabaseClient,
  request: ChatCompletionRequest,
  modelId?: string
): Promise<ChatCompletionResponse> {
  let model = await getModel(supabase, modelId, 'chat')
  if (!model) {
    const { data } = await supabase
      .from('ai_models')
      .select('*, ai_providers(*)')
      .eq('category', 'chat')
      .eq('enabled', true)
      .limit(1)
      .single()
    if (data) model = data as AIModel
  }
  if (!model || !model.ai_providers) {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    if (lovableKey) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 1000,
        }),
      })
      if (!response.ok) throw new Error(`Lovable AI error: ${await response.text()}`)
      const data = await response.json()
      return {
        content: data.choices[0].message.content,
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
        model: 'google/gemini-3-flash-preview',
      }
    }
    throw new Error('No valid chat model found')
  }
  const apiKey = await getApiKey(supabase, model.ai_providers.api_key_secret_name)
  if (!apiKey) throw new Error(`API key not configured for ${model.ai_providers.name}`)
  const requestWithModel = { ...request, model: model.model_id }
  switch (model.ai_providers.slug) {
    case 'openai': return chatOpenAI(apiKey, requestWithModel)
    case 'anthropic': return chatAnthropic(apiKey, requestWithModel)
    case 'google': return chatGoogle(apiKey, requestWithModel)
    case 'perplexity': return chatPerplexity(apiKey, requestWithModel)
    default: throw new Error(`Unsupported provider: ${model.ai_providers.slug}`)
  }
}

async function logUsage(
  supabase: SupabaseClient,
  userId: string | null,
  modelId: string | null,
  functionName: string,
  inputTokens: number,
  outputTokens: number,
  embeddingTokens: number,
  estimatedCost: number
): Promise<void> {
  const { error } = await supabase.from('ai_usage_logs').insert({
    user_id: userId,
    model_id: modelId,
    function_name: functionName,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    embedding_tokens: embeddingTokens,
    estimated_cost: estimatedCost,
  })
  if (error) console.error('Failed to log AI usage:', error)
}

function calculateCost(model: AIModel, inputTokens: number, outputTokens: number, embeddingTokens: number): number {
  return (
    (inputTokens / 1000) * model.input_cost_per_1k +
    (outputTokens / 1000) * model.output_cost_per_1k +
    (embeddingTokens / 1000) * model.embedding_cost_per_1k
  )
}

// --- End AI model policy + provider routing ---

// --- Agent MCP tools (inlined for single-file dashboard deploy) ---

const MCP_HTTP_CONFIG_KEY = "x-http-config";

function isRestConfiguredTool(schema: Record<string, unknown>): boolean {
  const httpConfig = schema[MCP_HTTP_CONFIG_KEY] as { path?: string } | undefined;
  return Boolean(httpConfig?.path);
}

async function resolveAgentMcpServerIds(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  fromAgent: string[]
): Promise<string[]> {
  if (fromAgent.length > 0) return fromAgent;

  const { data: links, error } = await supabase
    .from("agent_mcp_servers")
    .select("server_id")
    .eq("agent_id", agentId)
    .eq("is_enabled", true);

  if (error) {
    console.warn("resolveAgentMcpServerIds:", error.message);
    return [];
  }

  return (links ?? []).map((row: { server_id: string }) => row.server_id);
}

interface AgentMcpToolDef {
  tool_id: string;
  server_id: string;
  tool_name: string;
  function_name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface McpChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

function stripHttpConfig(schema: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...schema };
  delete copy[MCP_HTTP_CONFIG_KEY];
  if (!copy.type) copy.type = "object";
  if (!copy.properties) copy.properties = {};
  return copy;
}

function makeFunctionName(serverName: string, toolName: string): string {
  const raw = `${serverName}_${toolName}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return (raw || "mcp_tool").slice(0, 64);
}

async function loadAgentMcpToolDefs(
  supabase: ReturnType<typeof createClient>,
  serverIds: string[]
): Promise<AgentMcpToolDef[]> {
  if (!serverIds.length) return [];

  const { data: tools, error } = await supabase
    .from("mcp_tools")
    .select("id, server_id, name, description, input_schema")
    .in("server_id", serverIds)
    .eq("is_enabled", true)
    .order("name");

  if (error || !tools?.length) {
    if (error) console.warn("loadAgentMcpToolDefs:", error.message);
    return [];
  }

  const { data: servers } = await supabase
    .from("mcp_servers")
    .select("id, name")
    .in("id", serverIds);

  const serverNames = new Map(
    (servers ?? []).map((s: { id: string; name: string }) => [s.id, s.name])
  );

  const usedNames = new Set<string>();
  const defs: AgentMcpToolDef[] = [];

  for (const tool of tools) {
    const serverName = serverNames.get(tool.server_id) ?? "server";
    let functionName = makeFunctionName(serverName, tool.name);
    let suffix = 2;
    while (usedNames.has(functionName)) {
      functionName = `${makeFunctionName(serverName, tool.name).slice(0, 58)}_${suffix}`;
      suffix++;
    }
    usedNames.add(functionName);

    const schema = (tool.input_schema as Record<string, unknown>) ?? {};

    defs.push({
      tool_id: tool.id,
      server_id: tool.server_id,
      tool_name: tool.name,
      function_name: functionName,
      description: tool.description || tool.name,
      parameters: stripHttpConfig(schema),
    });
  }

  return defs;
}

async function executeMcpToolViaEdgeFunction(
  supabaseUrl: string,
  serviceKey: string,
  params: {
    tool_id: string;
    input_parameters: Record<string, unknown>;
    user_id: string;
    agent_id?: string;
    conversation_id?: string;
  }
): Promise<string> {
  const response = await fetch(`${supabaseUrl}/functions/v1/execute-mcp-tool`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tool_id: params.tool_id,
      input_parameters: params.input_parameters,
      user_id: params.user_id,
      agent_id: params.agent_id,
      conversation_id: params.conversation_id,
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `MCP tool execution failed (${response.status})`);
  }

  if (body.success === false) {
    throw new Error(body.error || "MCP tool execution failed");
  }

  const output = body.output ?? body;
  return typeof output === "string" ? output : JSON.stringify(output, null, 2);
}

interface RestHttpConfig {
  method: string;
  path: string;
  headers?: Record<string, string>;
}

function buildRestAuthHeaders(
  authConfig: Record<string, unknown> = {},
  authType = "none"
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (authConfig.authorization_header) {
    headers.Authorization = String(authConfig.authorization_header);
  } else if (authType === "api_key" && authConfig.api_key) {
    headers["X-API-Key"] = String(authConfig.api_key);
  } else if (authType === "bearer" && authConfig.bearer_token) {
    headers.Authorization = `Bearer ${authConfig.bearer_token}`;
  } else if (authType === "basic" && authConfig.username) {
    const credentials = btoa(`${authConfig.username}:${authConfig.password || ""}`);
    headers.Authorization = `Basic ${credentials}`;
  }
  return headers;
}

async function executeRestToolDirect(
  server: { server_url: string; auth_type?: string; auth_config?: Record<string, unknown> },
  toolSchema: Record<string, unknown>,
  parameters: Record<string, unknown>
): Promise<unknown> {
  const httpConfig = toolSchema[MCP_HTTP_CONFIG_KEY] as RestHttpConfig | undefined;
  if (!httpConfig?.path) {
    throw new Error("REST tool is missing endpoint configuration");
  }

  const authConfig = (server.auth_config as Record<string, unknown>) ?? {};
  const authType = server.auth_type ?? "none";

  let url = httpConfig.path;
  if (!url.startsWith("http")) {
    const baseUrl = server.server_url.replace(/\/$/, "");
    const path = httpConfig.path.startsWith("/") ? httpConfig.path : `/${httpConfig.path}`;
    url = `${baseUrl}${path}`;
  }

  const method = (httpConfig.method || "POST").toUpperCase();
  const headers: Record<string, string> = {
    ...buildRestAuthHeaders(authConfig, authType),
    ...(httpConfig.headers || {}),
  };

  if (!headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions: RequestInit = { method, headers };

  if (["POST", "PUT", "PATCH"].includes(method)) {
    fetchOptions.body = JSON.stringify(parameters);
  } else if (method === "GET" && Object.keys(parameters).length > 0) {
    const query = new URLSearchParams(
      Object.entries(parameters).map(([k, v]) => [k, String(v)])
    ).toString();
    url = `${url}${url.includes("?") ? "&" : "?"}${query}`;
  }

  const response = await fetch(url, fetchOptions);
  const text = await response.text();

  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { text };
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${typeof parsed === "object" ? JSON.stringify(parsed) : text}`
    );
  }

  return parsed;
}

async function executeAgentMcpToolDirect(
  supabase: ReturnType<typeof createClient>,
  toolId: string,
  args: Record<string, unknown>,
  userId: string,
  agentId: string,
  conversationId: string
): Promise<string> {
  const { data: tool, error } = await supabase
    .from("mcp_tools")
    .select("input_schema, server_id, mcp_servers(server_url, auth_type, auth_config, transport_type)")
    .eq("id", toolId)
    .single();

  if (error || !tool) {
    throw new Error(`Tool not found: ${error?.message ?? toolId}`);
  }

  const server = tool.mcp_servers as {
    server_url: string;
    auth_type?: string;
    auth_config?: Record<string, unknown>;
    transport_type?: string;
  } | null;

  if (!server) {
    throw new Error("MCP server configuration not found for tool");
  }

  const schema = tool.input_schema as Record<string, unknown>;
  const coercedArgs = coerceToolParameters(schema, args);

  if (server.transport_type === "rest" || isRestConfiguredTool(schema)) {
    const result = await executeRestToolDirect(server, schema, coercedArgs);
    return typeof result === "string" ? result : JSON.stringify(result, null, 2);
  }

  const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return executeMcpToolViaEdgeFunction(baseUrl, serviceKey, {
    tool_id: toolId,
    input_parameters: coercedArgs,
    user_id: userId,
    agent_id: agentId,
    conversation_id: conversationId,
  });
}

function coerceToolParameters(
  schema: Record<string, unknown>,
  parameters: Record<string, unknown>
): Record<string, unknown> {
  const properties = (schema.properties as Record<string, { type?: string }>) ?? {};
  const coerced: Record<string, unknown> = { ...parameters };

  for (const [key, value] of Object.entries(coerced)) {
    const propType = properties[key]?.type;
    if ((propType === "integer" || propType === "number") && typeof value === "string" && value.trim() !== "") {
      const num = Number(value);
      if (!Number.isNaN(num)) coerced[key] = num;
    }
  }

  return coerced;
}

async function chatWithMcpToolsOpenAI(
  apiKey: string,
  model: string,
  messages: McpChatMessage[],
  toolDefs: AgentMcpToolDef[],
  executeTool: (toolId: string, args: Record<string, unknown>) => Promise<string>,
  options?: {
    max_tokens?: number;
    temperature?: number;
    max_rounds?: number;
    require_tool_use?: boolean;
  }
): Promise<{
  content: string;
  input_tokens: number;
  output_tokens: number;
  model: string;
  tools_called: string[];
  last_tool_error: string | null;
}> {
  const openaiTools = toolDefs.map((t) => ({
    type: "function" as const,
    function: {
      name: t.function_name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const workingMessages = [...messages];
  let inputTokens = 0;
  let outputTokens = 0;
  const maxRounds = options?.max_rounds ?? 5;
  const toolsCalled: string[] = [];
  let lastToolError: string | null = null;

  for (let round = 0; round < maxRounds; round++) {
    const toolChoice =
      options?.require_tool_use && round === 0
        ? "required"
        : "auto";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: workingMessages,
        tools: openaiTools,
        tool_choice: toolChoice,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${errText}`);
    }

    const data = await response.json();
    inputTokens += data.usage?.prompt_tokens ?? 0;
    outputTokens += data.usage?.completion_tokens ?? 0;

    const assistantMessage = data.choices?.[0]?.message;
    if (!assistantMessage) {
      throw new Error("No response from AI model");
    }

    const toolCalls = assistantMessage.tool_calls;
    if (!toolCalls?.length) {
      return {
        content: assistantMessage.content || "",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model: data.model || model,
        tools_called: toolsCalled,
        last_tool_error: lastToolError,
      };
    }

    workingMessages.push(assistantMessage);

    for (const toolCall of toolCalls) {
      const fnName = toolCall.function?.name;
      const def = toolDefs.find((d) => d.function_name === fnName);
      let toolResult: string;

      try {
        const args = JSON.parse(toolCall.function?.arguments || "{}");
        if (!def) {
          toolResult = `Error: Unknown tool ${fnName}`;
          lastToolError = toolResult;
        } else {
          toolsCalled.push(def.tool_name);
          toolResult = await executeTool(def.tool_id, args);
          if (toolResult.startsWith("Error:")) {
            lastToolError = toolResult;
          }
        }
      } catch (err: unknown) {
        toolResult = `Error: ${err instanceof Error ? err.message : "Tool execution failed"}`;
        lastToolError = toolResult;
      }

      workingMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult,
      });
    }
  }

  return {
    content: "I reached the maximum number of tool calls for this request. Please try a simpler question.",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    model,
    tools_called: toolsCalled,
    last_tool_error: lastToolError,
  };
}

// --- End agent MCP tools ---

interface ConversationChatRequest {
  conversation_id: string
  agent_id: string
  message: string
  user_id: string
  model_id?: string
  include_rag?: boolean
  max_history?: number
  memory_context?: string
}

function isIntegrationTaskQuery(message: string): boolean {
  const normalized = message.toLowerCase()
  const mentionsTask = /\btasks?\b/.test(normalized)
  const mentionsIntegration = /\b(clickup|click up|activecollab|active collab)\b/.test(normalized)
  return mentionsTask && mentionsIntegration
}

function shouldRequireMcpToolUse(message: string): boolean {
  if (isIntegrationTaskQuery(message)) return true
  const normalized = message.toLowerCase()
  const dataIntent = /\b(list|show|get|fetch|find|retrieve|give me)\b/.test(normalized)
  const taskOrProject =
    /\b(tasks?|project\s*id|project_id)\b/.test(normalized) ||
    /\bproject\s+\d+/.test(normalized)
  return dataIntent && taskOrProject
}

async function resolveOpenAiCredentials(
  supabaseClient: SupabaseClient,
  effectiveModelId?: string
): Promise<{ apiKey: string; modelId: string } | null> {
  let apiKey = await getApiKey(supabaseClient, "OPENAI_API_KEY");
  let modelId = "gpt-4o-mini";

  const model = await getModel(supabaseClient, effectiveModelId, "chat");
  if (model?.ai_providers?.slug === "openai") {
    const providerKey = await getApiKey(supabaseClient, model.ai_providers.api_key_secret_name);
    if (providerKey) apiKey = providerKey;
    modelId = model.model_id || modelId;
  }

  return apiKey ? { apiKey, modelId } : null;
}

function buildMcpToolSystemPrompt(toolDefs: AgentMcpToolDef[]): string {
  const toolLines = toolDefs
    .map((t) => {
      const props = (t.parameters.properties as Record<string, unknown>) ?? {};
      const required = Array.isArray(t.parameters.required) ? t.parameters.required.join(", ") : "";
      return `- ${t.tool_name}: ${t.description}${required ? ` (required: ${required})` : ""}`;
    })
    .join("\n");

  return [
    "MCP TOOLS — you MUST use these when the user asks for live ActiveCollab or API data:",
    toolLines,
    "Call the matching tool with parameters from the user message (e.g. project_id).",
    "Never say you cannot access the service — call the tool first, then summarize the result.",
    "If a tool returns an error, show the error details and suggest what parameter might be missing.",
  ].join("\n");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const {
      conversation_id,
      agent_id,
      message,
      user_id,
      model_id,
      include_rag = true,
      max_history = 20,
      memory_context = "",
    }: ConversationChatRequest = await req.json()

    // Validate required fields
    if (!conversation_id || !agent_id || !message || !user_id) {
      return new Response(
        JSON.stringify({ error: 'conversation_id, agent_id, message, and user_id are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Get agent configuration
    const { data: agent, error: agentError } = await supabaseClient
      .from('ai_agents')
      .select('*')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // 2. Get user personalization if exists
    let additionalContext = ''
    const { data: personalization } = await supabaseClient
      .from('user_agent_personalizations')
      .select('additional_prompt, attached_knowledge_files, use_all_knowledge, max_context_files, relevance_threshold')
      .eq('user_id', user_id)
      .eq('agent_id', agent_id)
      .eq('is_enabled', true)
      .single()

    if (personalization?.additional_prompt) {
      additionalContext = personalization.additional_prompt
    }

    // 3. Get RAG context if agent has RAG enabled OR include_rag was explicitly requested
    let ragContext = ''
    let ragResultCount = 0
    let hadClickUpTaskSummary = false
    const integrationTaskQuery = isIntegrationTaskQuery(message)
    const shouldDoRag = agent.rag_enabled === true || include_rag || integrationTaskQuery
    if (shouldDoRag) {
      try {
        const baseUrl = Deno.env.get('SUPABASE_URL')
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (baseUrl && serviceKey) {
          const ragThreshold = personalization?.relevance_threshold ?? 0.5
          const ragCount = personalization?.max_context_files ?? 8
          const normalizedMessage = message.toLowerCase()
          const isClickUpTaskCountQuery =
            /\bclickup\b/.test(normalizedMessage) &&
            /\btasks?\b/.test(normalizedMessage) &&
            /\b(how many|count|number of|total)\b/.test(normalizedMessage)

          // When agent has rag_enabled, search ALL embeddings (org-wide data like ClickUp tasks)
          // Only scope to user when explicitly not using all knowledge AND agent doesn't have rag_enabled
          const searchUserId = (agent.rag_enabled === true || personalization?.use_all_knowledge) ? null : user_id
          console.log(`RAG search: query="${message.substring(0, 80)}", threshold=${ragThreshold}, count=${ragCount}, rag_enabled=${agent.rag_enabled}, searchUserId=${searchUserId}`)
          const semRes = await fetch(`${baseUrl}/functions/v1/semantic-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
            body: JSON.stringify({
              query: message,
              match_threshold: ragThreshold,
              match_count: ragCount,
              entity_type: integrationTaskQuery ? 'task' : null,
              user_id: searchUserId,
            }),
          })
          if (semRes.ok) {
            const semBody = await semRes.json()
            const rawDocs = semBody.results ?? []
            const relevantDocs = integrationTaskQuery
              ? rawDocs.filter((doc: { metadata?: { source?: string } }) => {
                  const source = doc.metadata?.source?.toLowerCase()
                  return source === 'clickup' || source === 'activecollab'
                })
              : rawDocs
            ragResultCount = relevantDocs.length
            console.log(`RAG search returned ${relevantDocs.length} results`)

            let ragSummary = ''
            if (isClickUpTaskCountQuery) {
              const { count: clickUpTaskEmbeddingCount, error: clickUpCountError } = await supabaseClient
                .from('embeddings')
                .select('id', { count: 'exact', head: true })
                .eq('entity_type', 'task')
                .contains('metadata', { source: 'clickup' })

              if (clickUpCountError) {
                console.error('ClickUp task embedding count error:', clickUpCountError)
              } else if (typeof clickUpTaskEmbeddingCount === 'number') {
                hadClickUpTaskSummary = true
                ragSummary = [
                  'RETRIEVED DATA SUMMARY:',
                  `- Total ClickUp task embeddings currently available: ${clickUpTaskEmbeddingCount}`,
                  '- If the user asks how many ClickUp tasks exist, use this exact total in the answer.',
                ].join('\n')
              }
            }

            if (relevantDocs.length > 0 || ragSummary) {
              ragContext = '\n\nRELEVANT CONTEXT (from knowledge base):\nYou MUST answer from the retrieved context below when it is relevant. Treat the retrieved records and summaries as authoritative. If a summary includes an exact total, use that total directly in your answer. Only say the context is insufficient when there is truly no relevant context.\n\n'
                + (ragSummary ? `${ragSummary}\n\n` : '')
                + relevantDocs
                  .map((doc: { content?: string; entity_type?: string; similarity?: number; metadata?: { source?: string } }, i: number) => {
                    const source = doc.metadata?.source ?? doc.entity_type ?? 'unknown'
                    return `[${i + 1}] (${source}, relevance: ${(doc.similarity ?? 0).toFixed(2)})\n${doc.content ?? ''}`
                  })
                  .join('\n\n')
            }
          } else {
            console.warn('RAG semantic search returned non-OK:', semRes.status)
          }
        }
      } catch (ragError) {
        console.error('RAG search error:', ragError)
      }
    }

    // 4. Get conversation history
    const { data: history } = await supabaseClient
      .from('agent_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(max_history)

    // 5. Build messages array
    const systemPrompt = [
      agent.system_prompt,
      additionalContext,
      memory_context,
      ragContext,
    ].filter(Boolean).join('\n\n')

    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      { role: 'system', content: systemPrompt }
    ]

    // Add conversation history
    if (history && history.length > 0) {
      messages.push(...history
        .filter((h: any) => h.role !== 'system')
        .map((h: any) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content
        }))
      )
    }

    // Add current user message
    messages.push({ role: 'user', content: message })

    // 6. Get provider config from agent or use defaults
    const providerConfig = agent.provider_config || {}
    const temperature = providerConfig.temperature ?? 0.7
    const maxTokens = providerConfig.max_tokens ?? 2000

    const effectiveModelId = await resolveEffectiveModelId(supabaseClient, model_id)

    const serverIds = await resolveAgentMcpServerIds(
      supabaseClient,
      agent_id,
      Array.isArray(agent.mcp_server_ids) ? (agent.mcp_server_ids as string[]) : []
    )
    const mcpEnabled = serverIds.length > 0
    let mcpToolsUsed = 0
    let mcpPathUsed = false
    let mcpToolError: string | null = null
    let mcpToolsCalled: string[] = []
    let response: Awaited<ReturnType<typeof chatCompletion>>

    if (mcpEnabled) {
      const toolDefs = await loadAgentMcpToolDefs(supabaseClient, serverIds)
      mcpToolsUsed = toolDefs.length
      const openaiCreds = await resolveOpenAiCredentials(supabaseClient, effectiveModelId)

      if (toolDefs.length > 0 && openaiCreds) {
        mcpPathUsed = true
        const mcpMessages: McpChatMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        if (mcpMessages[0]?.role === "system") {
          mcpMessages[0].content = `${mcpMessages[0].content}\n\n${buildMcpToolSystemPrompt(toolDefs)}`
        }

        try {
          const mcpResponse = await chatWithMcpToolsOpenAI(
            openaiCreds.apiKey,
            openaiCreds.modelId,
            mcpMessages,
            toolDefs,
            (toolId, args) =>
              executeAgentMcpToolDirect(supabaseClient, toolId, args, user_id, agent_id, conversation_id),
            {
              max_tokens: maxTokens,
              temperature,
              require_tool_use: shouldRequireMcpToolUse(message),
            }
          )

          mcpToolsCalled = mcpResponse.tools_called
          if (mcpResponse.last_tool_error) {
            mcpToolError = mcpResponse.last_tool_error
          }

          response = {
            content: mcpResponse.content,
            input_tokens: mcpResponse.input_tokens,
            output_tokens: mcpResponse.output_tokens,
            model: mcpResponse.model,
          }
        } catch (mcpErr: unknown) {
          mcpToolError = mcpErr instanceof Error ? mcpErr.message : "MCP tool execution failed";
          console.error("MCP chat error:", mcpToolError);
          response = await chatCompletion(
            supabaseClient,
            { messages, max_tokens: maxTokens, temperature },
            effectiveModelId
          );
        }
      } else {
        if (toolDefs.length > 0) {
          const toolSummary = toolDefs
            .map((t) => `- ${t.tool_name}: ${t.description}`)
            .join('\n')
          messages[0].content += `\n\nATTACHED MCP TOOLS:\n${toolSummary}\nOpenAI API key is required in Supabase secrets (OPENAI_API_KEY) for automatic tool execution.`
          mcpToolError = openaiCreds ? "No tools loaded" : "OPENAI_API_KEY not configured for MCP tool calling"
        } else {
          mcpToolError = "No enabled tools found on attached MCP servers"
        }
        response = await chatCompletion(
          supabaseClient,
          { messages, max_tokens: maxTokens, temperature },
          effectiveModelId
        )
      }
    } else {
      // 7. Call AI provider
      response = await chatCompletion(
        supabaseClient,
        {
          messages,
          max_tokens: maxTokens,
          temperature,
        },
        effectiveModelId
      )
    }

    const latency = Date.now() - startTime

    // 8. Get the model for cost calculation and logging
    const model = await getModel(supabaseClient, effectiveModelId, 'chat')
    if (!model) {
      throw new Error('Model not found')
    }

    // 9. Calculate cost
    const cost = calculateCost(model, response.input_tokens, response.output_tokens, 0)

    // 10. Log usage
    await logUsage(
      supabaseClient,
      user_id,
      model.id,
      'agent-conversation-chat',
      response.input_tokens,
      response.output_tokens,
      0,
      cost
    )

    // 11. Update agent usage count
    await supabaseClient
      .from('ai_agents')
      .update({ usage_count: (agent.usage_count || 0) + 1 })
      .eq('id', agent_id)

    return new Response(
      JSON.stringify({
        response: response.content,
        model_used: response.model,
        provider_used: model.ai_providers?.slug || 'unknown',
        tokens_input: response.input_tokens,
        tokens_output: response.output_tokens,
        latency_ms: latency,
        estimated_cost: cost,
        citations: [], // TODO: Extract citations from RAG context
        metadata: {
          conversation_id,
          agent_id,
          had_rag_context: ragContext.length > 0,
          rag_result_count: ragResultCount,
          had_clickup_task_summary: hadClickUpTaskSummary,
          history_count: history?.length || 0,
          mcp_enabled: mcpEnabled,
          mcp_tools_available: mcpToolsUsed,
          mcp_path_used: mcpPathUsed,
          mcp_tool_error: mcpToolError,
          mcp_tools_called: mcpToolsCalled,
          mcp_server_ids: serverIds,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Agent conversation chat error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
