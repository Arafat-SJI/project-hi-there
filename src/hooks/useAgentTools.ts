/**
 * Agent Tool Orchestration Hooks
 *
 * React hooks for managing MCP tool execution, tool selection,
 * and tool orchestration within multi-step agent workflows.
 */

import { useQuery, useMutation, useQueryClient } from "@tantml:function_calls>
<invoke name="useAuth">
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { queryKeys, invalidateKeys } from "@/lib/cache";

export interface MCPTool {
  id: string;
  server_id: string;
  name: string;
  description: string | null;
  input_schema: Record<string, any>;
  is_enabled: boolean;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_execution_time_ms: number | null;
  last_executed_at: string | null;
  discovered_at: string;
  updated_at: string;
}

export interface MCPToolExecution {
  id: string;
  tool_id: string;
  server_id: string;
  agent_id: string | null;
  user_id: string;
  input_parameters: Record<string, any>;
  output_result: Record<string, any> | null;
  status: string;
  error_message: string | null;
  error_code: string | null;
  started_at: string;
  completed_at: string | null;
  execution_time_ms: number | null;
  execution_context: Record<string, any> | null;
}

export interface ExecuteToolParams {
  tool_id: string;
  input_parameters: Record<string, any>;
  agent_id?: string;
  plan_id?: string;
  step_id?: string;
  execution_context?: Record<string, any>;
}

/**
 * Fetch available MCP tools for an agent
 */
export function useAgentTools(agentId?: string) {
  return useQuery({
    queryKey: ["agent-tools", agentId],
    queryFn: async () => {
      let query = supabase
        .from("mcp_tools")
        .select(`
          *,
          server:mcp_servers(*)
        `)
        .eq("is_enabled", true);

      // If agent ID provided, filter by agent's MCP server IDs
      if (agentId) {
        const { data: agent } = await supabase
          .from("ai_agents")
          .select("mcp_server_ids, tool_mcp")
          .eq("id", agentId)
          .single();

        if (agent?.tool_mcp && agent?.mcp_server_ids?.length > 0) {
          query = query.in("server_id", agent.mcp_server_ids);
        } else {
          // No MCP enabled for this agent
          return [];
        }
      }

      const { data, error } = await query.order("name");

      if (error) throw error;
      return (data || []) as MCPTool[];
    },
    enabled: !!agentId,
  });
}

/**
 * Execute an MCP tool
 */
export function useExecuteTool() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ExecuteToolParams) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.functions.invoke("execute-mcp-tool", {
        body: {
          tool_id: params.tool_id,
          input_parameters: params.input_parameters,
          agent_id: params.agent_id,
          plan_id: params.plan_id,
          step_id: params.step_id,
          user_id: user.id,
          execution_context: params.execution_context || {},
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidateKeys.ai(queryClient);
      if (data.success) {
        toast.success("Tool executed successfully");
      }
    },
    onError: (error: unknown) => {
      console.error("Tool execution error:", error);
      toast.error((error as Error).message || "Failed to execute tool");
    },
  });
}

/**
 * Fetch tool execution history
 */
export function useToolExecutions(filters?: {
  tool_id?: string;
  agent_id?: string;
  status?: string;
  limit?: number;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tool-executions", filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("mcp_tool_executions")
        .select(`
          *,
          tool:mcp_tools(name, description)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 50);

      if (filters?.tool_id) {
        query = query.eq("tool_id", filters.tool_id);
      }

      if (filters?.agent_id) {
        query = query.eq("agent_id", filters.agent_id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as MCPToolExecution[];
    },
    enabled: !!user,
  });
}

/**
 * Fetch agent execution plans (multi-step workflows)
 */
export function useAgentExecutionPlans(agentId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["execution-plans", agentId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("agent_execution_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (agentId) {
        query = query.eq("agent_id", agentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

/**
 * Fetch execution steps for a plan
 */
export function useExecutionSteps(planId: string) {
  return useQuery({
    queryKey: ["execution-steps", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_execution_steps")
        .select("*")
        .eq("plan_id", planId)
        .order("step_number");

      if (error) throw error;
      return data || [];
    },
    enabled: !!planId,
  });
}

/**
 * Fetch reasoning traces for a plan
 */
export function useReasoningTraces(planId: string) {
  return useQuery({
    queryKey: ["reasoning-traces", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_reasoning_traces")
        .select("*")
        .eq("plan_id", planId)
        .order("created_at");

      if (error) throw error;
      return data || [];
    },
    enabled: !!planId,
  });
}

/**
 * Get tool recommendations based on user intent
 */
export function useRecommendTools(intent: string, agentId?: string) {
  return useQuery({
    queryKey: ["recommend-tools", intent, agentId],
    queryFn: async () => {
      // This would use semantic search on tool descriptions
      // For now, return all available tools
      const { data: agent } = await supabase
        .from("ai_agents")
        .select("mcp_server_ids, tool_mcp")
        .eq("id", agentId || "")
        .single();

      if (!agent?.tool_mcp || !agent?.mcp_server_ids?.length) {
        return [];
      }

      const { data: tools } = await supabase
        .from("mcp_tools")
        .select("*")
        .in("server_id", agent.mcp_server_ids)
        .eq("is_enabled", true);

      // Simple keyword matching for now
      // In production, this would use semantic search with embeddings
      const keywords = intent.toLowerCase().split(/\s+/);
      const scoredTools = (tools || []).map((tool) => {
        const description = (tool.description || "").toLowerCase();
        const name = tool.name.toLowerCase();

        let score = 0;
        keywords.forEach((keyword) => {
          if (name.includes(keyword)) score += 3;
          if (description.includes(keyword)) score += 1;
        });

        return { ...tool, relevance_score: score };
      });

      return scoredTools
        .filter((t) => t.relevance_score > 0)
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 5);
    },
    enabled: !!intent && intent.length > 3,
  });
}
