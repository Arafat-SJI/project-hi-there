import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { queryKeys, invalidateKeys } from "@/lib/cache";

export interface AIAgent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  system_prompt: string;
  data_sources: any;
  provider_config: any;
  required_role: string | null;
  is_enabled: boolean;
  memory_enabled: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  user_id: string;
  input: string;
  output: string | null;
  status: "pending" | "running" | "completed" | "failed";
  error: string | null;
  execution_time_ms: number | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface AgentFormData {
  name: string;
  slug?: string;
  description?: string;
  category: string;
  system_prompt: string;
  is_enabled: boolean;
  memory_enabled: boolean;
}

// Fetch all agents
export function useAIAgents() {
  return useQuery({
    queryKey: queryKeys.ai.agents,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AIAgent[];
    },
  });
}

// Fetch single agent
export function useAIAgent(id: string) {
  return useQuery({
    queryKey: queryKeys.ai.agent(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as AIAgent;
    },
    enabled: !!id,
  });
}

// Fetch agent runs
export function useAgentRuns(agentId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: agentId ? queryKeys.ai.runs(agentId) : ["ai", "runs"],
    queryFn: async () => {
      let query = supabase
        .from("ai_agent_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (agentId) {
        query = query.eq("agent_id", agentId);
      }

      if (user) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AgentRun[];
    },
    enabled: !!user,
  });
}

// Create agent
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AgentFormData) => {
      const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-");

      const { data: agent, error } = await supabase
        .from("ai_agents")
        .insert({
          name: data.name,
          slug,
          description: data.description || null,
          category: data.category,
          system_prompt: data.system_prompt,
          is_enabled: data.is_enabled,
          memory_enabled: data.memory_enabled,
        })
        .select()
        .single();

      if (error) throw error;
      return agent as AIAgent;
    },
    onSuccess: () => {
      invalidateKeys.ai(queryClient);
      toast.success("Agent created successfully!");
    },
    onError: (error: any) => {
      console.error("Error creating agent:", error);
      toast.error(error.message || "Failed to create agent");
    },
  });
}

// Update agent
export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AgentFormData }) => {
      const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-");

      const { data: agent, error } = await supabase
        .from("ai_agents")
        .update({
          name: data.name,
          slug,
          description: data.description || null,
          category: data.category,
          system_prompt: data.system_prompt,
          is_enabled: data.is_enabled,
          memory_enabled: data.memory_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return agent as AIAgent;
    },
    onSuccess: () => {
      invalidateKeys.ai(queryClient);
      toast.success("Agent updated successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating agent:", error);
      toast.error(error.message || "Failed to update agent");
    },
  });
}

// Toggle agent enabled
export function useToggleAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("ai_agents")
        .update({
          is_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      invalidateKeys.ai(queryClient);
      toast.success(`Agent ${variables.is_enabled ? "enabled" : "disabled"}`);
    },
    onError: (error: any) => {
      console.error("Error toggling agent:", error);
      toast.error("Failed to update agent status");
    },
  });
}

// Delete agent
export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_agents").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.ai(queryClient);
      toast.success("Agent deleted successfully");
    },
    onError: (error: any) => {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    },
  });
}

// Run/Execute agent
export function useRunAgent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, input }: { agentId: string; input: string }) => {
      if (!user) throw new Error("User not authenticated");

      const startTime = Date.now();

      // Create pending run record
      const { data: run, error: insertError } = await supabase
        .from("ai_agent_runs")
        .insert({
          agent_id: agentId,
          user_id: user.id,
          input,
          status: "running",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      try {
        // Call AI function to execute agent
        // This is a placeholder - you would call your actual AI function here
        const { data, error } = await supabase.functions.invoke("run-ai-agent", {
          body: {
            agent_id: agentId,
            input,
            user_id: user.id,
          },
        });

        const executionTime = Date.now() - startTime;

        if (error) throw error;

        // Update run with result
        const { error: updateError } = await supabase
          .from("ai_agent_runs")
          .update({
            output: data.output,
            status: "completed",
            execution_time_ms: executionTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", run.id);

        if (updateError) throw updateError;

        return { runId: run.id, output: data.output };
      } catch (error: any) {
        // Update run with error
        await supabase
          .from("ai_agent_runs")
          .update({
            status: "failed",
            error: error.message,
            execution_time_ms: Date.now() - startTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", run.id);

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "runs"] });
      toast.success("Agent executed successfully!");
    },
    onError: (error: any) => {
      console.error("Error running agent:", error);
      toast.error(error.message || "Failed to execute agent");
    },
  });
}
