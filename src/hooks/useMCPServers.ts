import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Types
export type TransportType = "stdio" | "http" | "websocket" | "sse";
export type AuthType = "none" | "api_key" | "bearer" | "oauth" | "basic";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPCapabilities {
  tools: boolean;
  resources: boolean;
  prompts: boolean;
  sampling?: boolean;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  server_url: string;
  transport_type: TransportType;
  auth_type: AuthType;
  auth_config: Record<string, unknown>;
  available_tools: MCPTool[];
  available_resources: unknown[];
  available_prompts: unknown[];
  capabilities: MCPCapabilities;
  user_id: string | null;
  is_global: boolean;
  is_active: boolean;
  is_verified: boolean;
  last_verified_at: string | null;
  error_message: string | null;
  usage_count: number;
  last_used_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MCPToolExecution {
  id: string;
  server_id: string;
  agent_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
  user_id: string;
  tool_name: string;
  tool_input: unknown;
  tool_output: unknown;
  status: "pending" | "executing" | "completed" | "failed" | "timeout";
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AgentMCPServer {
  id: string;
  agent_id: string;
  server_id: string;
  enabled_tools: string[];
  tool_config: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  // Joined server data
  mcp_servers?: MCPServer;
}

export interface CreateMCPServerData {
  name: string;
  description?: string;
  icon?: string;
  server_url: string;
  transport_type: TransportType;
  auth_type?: AuthType;
  auth_config?: Record<string, unknown>;
  available_tools?: MCPTool[];
  capabilities?: Partial<MCPCapabilities>;
}

export interface UpdateMCPServerData extends Partial<CreateMCPServerData> {
  is_active?: boolean;
}

// Query keys
const mcpKeys = {
  all: ["mcp", "servers"] as const,
  user: ["mcp", "servers", "user"] as const,
  global: ["mcp", "servers", "global"] as const,
  server: (id: string) => ["mcp", "server", id] as const,
  agentServers: (agentId: string) => ["mcp", "agent", agentId, "servers"] as const,
  agentTools: (agentId: string) => ["mcp", "agent", agentId, "tools"] as const,
  executions: (serverId: string) => ["mcp", "executions", serverId] as const,
};

// Fetch all MCP servers (user's own + global)
export function useMCPServers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: mcpKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcp_servers")
        .select("*")
        .or(`user_id.eq.${user?.id},is_global.eq.true`)
        .order("is_global", { ascending: false })
        .order("name");

      if (error) throw error;
      return (data || []) as MCPServer[];
    },
    enabled: !!user,
  });
}

// Fetch only user's MCP servers
export function useUserMCPServers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: mcpKeys.user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcp_servers")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as MCPServer[];
    },
    enabled: !!user,
  });
}

// Fetch only global MCP servers
export function useGlobalMCPServers() {
  return useQuery({
    queryKey: mcpKeys.global,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcp_servers")
        .select("*")
        .eq("is_global", true)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return (data || []) as MCPServer[];
    },
  });
}

// Fetch single MCP server
export function useMCPServer(id: string | null) {
  return useQuery({
    queryKey: mcpKeys.server(id || ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcp_servers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as MCPServer;
    },
    enabled: !!id,
  });
}

// Create MCP server
export function useCreateMCPServer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMCPServerData) => {
      if (!user) throw new Error("User not authenticated");

      const { data: server, error } = await supabase
        .from("mcp_servers")
        .insert({
          name: data.name,
          description: data.description || null,
          icon: data.icon || "🔌",
          server_url: data.server_url,
          transport_type: data.transport_type,
          auth_type: data.auth_type || "none",
          auth_config: data.auth_config || {},
          available_tools: data.available_tools || [],
          capabilities: {
            tools: true,
            resources: false,
            prompts: false,
            ...data.capabilities,
          },
          user_id: user.id,
          is_global: false,
          is_active: true,
          is_verified: false,
        })
        .select()
        .single();

      if (error) throw error;
      return server as MCPServer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.all });
      queryClient.invalidateQueries({ queryKey: mcpKeys.user });
      toast.success("MCP server created successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating MCP server:", error);
      toast.error(error.message || "Failed to create MCP server");
    },
  });
}

// Update MCP server
export function useUpdateMCPServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMCPServerData }) => {
      const { data: server, error } = await supabase
        .from("mcp_servers")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return server as MCPServer;
    },
    onSuccess: (server) => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.all });
      queryClient.invalidateQueries({ queryKey: mcpKeys.server(server.id) });
      toast.success("MCP server updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating MCP server:", error);
      toast.error(error.message || "Failed to update MCP server");
    },
  });
}

// Delete MCP server
export function useDeleteMCPServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mcp_servers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.all });
      queryClient.invalidateQueries({ queryKey: mcpKeys.user });
      toast.success("MCP server deleted");
    },
    onError: (error: Error) => {
      console.error("Error deleting MCP server:", error);
      toast.error(error.message || "Failed to delete MCP server");
    },
  });
}

// Test/verify MCP server connection
export function useVerifyMCPServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Call edge function to test connection
      const { data, error } = await supabase.functions.invoke("verify-mcp-server", {
        body: { server_id: id },
      });

      if (error) throw error;
      return data as { verified: boolean; tools: MCPTool[]; error?: string };
    },
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.server(id) });
      queryClient.invalidateQueries({ queryKey: mcpKeys.all });

      if (result.verified) {
        toast.success(`Connection verified! Found ${result.tools.length} tools`);
      } else {
        toast.error(result.error || "Connection verification failed");
      }
    },
    onError: (error: Error) => {
      console.error("Error verifying MCP server:", error);
      toast.error(error.message || "Failed to verify connection");
    },
  });
}

// Get MCP servers connected to an agent
export function useAgentMCPServers(agentId: string | null) {
  return useQuery({
    queryKey: mcpKeys.agentServers(agentId || ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_mcp_servers")
        .select(`
          *,
          mcp_servers (*)
        `)
        .eq("agent_id", agentId)
        .eq("is_enabled", true);

      if (error) throw error;
      return (data || []) as AgentMCPServer[];
    },
    enabled: !!agentId,
  });
}

// Get all tools available to an agent from MCP servers
export function useAgentMCPTools(agentId: string | null) {
  return useQuery({
    queryKey: mcpKeys.agentTools(agentId || ""),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agent_mcp_tools", {
        p_agent_id: agentId,
      });

      if (error) throw error;
      return (data || []) as Array<{
        server_id: string;
        server_name: string;
        tool: MCPTool;
      }>;
    },
    enabled: !!agentId,
  });
}

// Connect MCP server to agent
export function useConnectMCPToAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      serverId,
      enabledTools,
    }: {
      agentId: string;
      serverId: string;
      enabledTools?: string[];
    }) => {
      const { data, error } = await supabase
        .from("agent_mcp_servers")
        .upsert({
          agent_id: agentId,
          server_id: serverId,
          enabled_tools: enabledTools || [],
          is_enabled: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AgentMCPServer;
    },
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.agentServers(agentId) });
      queryClient.invalidateQueries({ queryKey: mcpKeys.agentTools(agentId) });
      toast.success("MCP server connected to agent");
    },
    onError: (error: Error) => {
      console.error("Error connecting MCP to agent:", error);
      toast.error(error.message || "Failed to connect MCP server");
    },
  });
}

// Disconnect MCP server from agent
export function useDisconnectMCPFromAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      serverId,
    }: {
      agentId: string;
      serverId: string;
    }) => {
      const { error } = await supabase
        .from("agent_mcp_servers")
        .delete()
        .eq("agent_id", agentId)
        .eq("server_id", serverId);

      if (error) throw error;
      return { agentId, serverId };
    },
    onSuccess: ({ agentId }) => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.agentServers(agentId) });
      queryClient.invalidateQueries({ queryKey: mcpKeys.agentTools(agentId) });
      toast.success("MCP server disconnected from agent");
    },
    onError: (error: Error) => {
      console.error("Error disconnecting MCP from agent:", error);
      toast.error(error.message || "Failed to disconnect MCP server");
    },
  });
}

// Execute MCP tool
export function useExecuteMCPTool() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serverId,
      toolName,
      toolInput,
      agentId,
      conversationId,
      messageId,
    }: {
      serverId: string;
      toolName: string;
      toolInput: Record<string, unknown>;
      agentId?: string;
      conversationId?: string;
      messageId?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.functions.invoke("execute-mcp-tool", {
        body: {
          server_id: serverId,
          tool_name: toolName,
          tool_input: toolInput,
          agent_id: agentId,
          conversation_id: conversationId,
          message_id: messageId,
          user_id: user.id,
        },
      });

      if (error) throw error;
      return data as { execution_id: string; output: unknown; duration_ms: number };
    },
    onSuccess: (_, { serverId }) => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.executions(serverId) });
    },
    onError: (error: Error) => {
      console.error("Error executing MCP tool:", error);
      toast.error(error.message || "Failed to execute tool");
    },
  });
}

// Get tool execution history for a server
export function useMCPToolExecutions(serverId: string | null, limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...mcpKeys.executions(serverId || ""), limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcp_tool_executions")
        .select("*")
        .eq("server_id", serverId)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as MCPToolExecution[];
    },
    enabled: !!serverId && !!user,
  });
}
