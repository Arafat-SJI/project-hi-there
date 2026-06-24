/**
 * Control Tower MCP Gateway
 *
 * Exposes REST-configured MCP servers as a real MCP (JSON-RPC) HTTP endpoint
 * so clients like Cursor can connect. Requires ?server_id=<uuid> on the URL.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, mcp-protocol-version, mcp-session-id",
};

const DEFAULT_PROTOCOL_VERSION = "2024-11-05";
const MCP_HTTP_CONFIG_KEY = "x-http-config";

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface RestHttpConfig {
  method: string;
  path: string;
  headers?: Record<string, string>;
}

function jsonRpcResult(id: string | number | null | undefined, result: unknown): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: id ?? null, result }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function jsonRpcError(
  id: string | number | null | undefined,
  code: number,
  message: string
): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );
}

function stripHttpConfig(schema: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...schema };
  delete copy[MCP_HTTP_CONFIG_KEY];
  return copy;
}

function buildUpstreamAuthHeaders(
  authConfig: Record<string, unknown> = {},
  authType = "none"
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (authConfig.authorization_header) {
    headers["Authorization"] = String(authConfig.authorization_header);
  } else if (authType === "api_key" && authConfig.api_key) {
    headers["X-API-Key"] = String(authConfig.api_key);
  } else if (authType === "bearer" && authConfig.bearer_token) {
    headers["Authorization"] = `Bearer ${authConfig.bearer_token}`;
  } else if (authType === "basic" && authConfig.username) {
    const credentials = btoa(`${authConfig.username}:${authConfig.password || ""}`);
    headers["Authorization"] = `Basic ${credentials}`;
  }

  return headers;
}

async function executeRestTool(
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
    ...buildUpstreamAuthHeaders(authConfig, authType),
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

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const requestUrl = new URL(req.url);
    const serverId = requestUrl.searchParams.get("server_id");

    if (!serverId) {
      return new Response(
        JSON.stringify({ error: "Missing server_id query parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = extractBearerToken(req);
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired access token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: server, error: serverError } = await supabaseUser
      .from("mcp_servers")
      .select("*")
      .eq("id", serverId)
      .single();

    if (serverError || !server) {
      return new Response(JSON.stringify({ error: "MCP server not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (server.is_enabled === false) {
      return new Response(JSON.stringify({ error: "MCP server is disabled" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (server.transport_type !== "rest") {
      return new Response(
        JSON.stringify({
          error: "This gateway only supports REST servers. Use the server's native MCP URL for http/sse transports.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as JsonRpcRequest;
    const { method, params = {}, id } = body;

    if (!method) {
      return jsonRpcError(id, -32600, "Invalid Request: missing method");
    }

    switch (method) {
      case "initialize": {
        const clientVersion =
          (params.protocolVersion as string) || DEFAULT_PROTOCOL_VERSION;
        return jsonRpcResult(id, {
          protocolVersion: clientVersion,
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: `Control Tower: ${server.name}`,
            version: "1.0.0",
          },
        });
      }

      case "notifications/initialized":
        return new Response(null, { status: 202, headers: corsHeaders });

      case "ping":
        return jsonRpcResult(id, {});

      case "tools/list": {
        const { data: tools, error: toolsError } = await supabaseUser
          .from("mcp_tools")
          .select("name, description, input_schema")
          .eq("server_id", serverId)
          .eq("is_enabled", true)
          .order("name");

        if (toolsError) {
          return jsonRpcError(id, -32603, `Failed to list tools: ${toolsError.message}`);
        }

        const mcpTools = (tools ?? []).map((tool) => ({
          name: tool.name,
          description: tool.description || tool.name,
          inputSchema: stripHttpConfig((tool.input_schema as Record<string, unknown>) ?? {
            type: "object",
            properties: {},
          }),
        }));

        return jsonRpcResult(id, { tools: mcpTools });
      }

      case "tools/call": {
        const toolName = params.name as string;
        const arguments_ = (params.arguments as Record<string, unknown>) ?? {};

        if (!toolName) {
          return jsonRpcError(id, -32602, "Missing tool name");
        }

        const { data: tool, error: toolError } = await supabaseUser
          .from("mcp_tools")
          .select("name, input_schema")
          .eq("server_id", serverId)
          .eq("name", toolName)
          .eq("is_enabled", true)
          .single();

        if (toolError || !tool) {
          return jsonRpcResult(id, {
            content: [{ type: "text", text: `Tool not found: ${toolName}` }],
            isError: true,
          });
        }

        try {
          const result = await executeRestTool(
            server,
            tool.input_schema as Record<string, unknown>,
            arguments_
          );

          const text =
            typeof result === "string" ? result : JSON.stringify(result, null, 2);

          return jsonRpcResult(id, {
            content: [{ type: "text", text }],
            isError: false,
          });
        } catch (toolErr: unknown) {
          const message = toolErr instanceof Error ? toolErr.message : "Tool execution failed";
          return jsonRpcResult(id, {
            content: [{ type: "text", text: message }],
            isError: true,
          });
        }
      }

      default:
        if (method.startsWith("notifications/")) {
          return new Response(null, { status: 202, headers: corsHeaders });
        }
        return jsonRpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error: unknown) {
    console.error("control-tower-mcp error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
