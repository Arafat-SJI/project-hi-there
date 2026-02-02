import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/cache";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { UserAgentPersonalization } from "@/types/knowledgeBase";

export function useAllAgentPersonalizations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.knowledge.agentPersonalizations(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_agent_personalizations')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserAgentPersonalization[];
    },
    enabled: !!user,
  });
}

export function useUpdateAgentPersonalization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: Partial<UserAgentPersonalization> & { id: string }) => {
      const { id, ...updates } = payload;
      const { data, error } = await supabase
        .from('user_agent_personalizations')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();
      if (error) throw error;
      return data as UserAgentPersonalization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.agentPersonalizations(user?.id ?? '') });
      toast({ title: "Success", description: "Personalization updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

export function useUpsertAgentPersonalization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { agent_id: string; additional_prompt?: string; attached_knowledge_files?: string[]; attached_unified_document_ids?: string[]; use_all_knowledge?: boolean; max_context_files?: number; relevance_threshold?: number }) => {
      const { data, error } = await supabase
        .from('user_agent_personalizations')
        .upsert(
          { user_id: user!.id, ...payload },
          { onConflict: 'user_id,agent_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as UserAgentPersonalization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.agentPersonalizations(user?.id ?? '') });
      toast({ title: "Success", description: "Agent personalization saved" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}
