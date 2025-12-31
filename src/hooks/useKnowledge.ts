import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, invalidateKeys } from "@/lib/cache";
import { KnowledgeEntryFormData } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  file_url?: string;
  file_type?: string;
  embedding_status?: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export function useKnowledgeEntries(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.knowledge.entries(filters),
    queryFn: async () => {
      let query = supabase
        .from("knowledge_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KnowledgeEntry[];
    },
  });
}

export function useKnowledgeEntry(id: string) {
  return useQuery({
    queryKey: queryKeys.knowledge.entry(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_entries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as KnowledgeEntry;
    },
    enabled: !!id,
  });
}

export function useKnowledgeSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.knowledge.search(query),
    queryFn: async () => {
      if (!query || query.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from("knowledge_entries")
        .select("*")
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data as KnowledgeEntry[];
    },
    enabled: query.length >= 2,
  });
}

export function useCreateKnowledgeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: KnowledgeEntryFormData) => {
      const { data: entry, error } = await supabase
        .from("knowledge_entries")
        .insert([{ ...data, embedding_status: "pending" }])
        .select()
        .single();

      if (error) throw error;
      return entry as KnowledgeEntry;
    },
    onSuccess: () => {
      invalidateKeys.knowledge(queryClient);
      toast({
        title: "Success",
        description: "Knowledge entry created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create knowledge entry",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateKnowledgeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<KnowledgeEntryFormData>;
    }) => {
      const { data: entry, error } = await supabase
        .from("knowledge_entries")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return entry as KnowledgeEntry;
    },
    onSuccess: () => {
      invalidateKeys.knowledge(queryClient);
      toast({
        title: "Success",
        description: "Knowledge entry updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update knowledge entry",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteKnowledgeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("knowledge_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.knowledge(queryClient);
      toast({
        title: "Success",
        description: "Knowledge entry deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete knowledge entry",
        variant: "destructive",
      });
    },
  });
}
