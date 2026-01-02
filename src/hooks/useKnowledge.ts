import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, invalidateKeys } from "@/lib/cache";
import { KnowledgeEntryFormData } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  slug: string;
  category_id: string | null;
  tags: string[] | null;
  summary: string | null;
  status: string | null;
  view_count: number | null;
  author_id: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  embedding_status?: string | null;
  embedding_count?: number | null;
  last_embedded_at?: string | null;
  reading_time_minutes?: number | null;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeEntries(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.knowledge.entries(filters),
    queryFn: async () => {
      let query = supabase
        .from("knowledge_entries")
        .select("*, knowledge_categories(*)")
        .order("created_at", { ascending: false });

      if (filters?.category_id) {
        query = query.eq("category_id", filters.category_id);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (KnowledgeEntry & { knowledge_categories?: KnowledgeCategory | null })[];
    },
  });
}

export function useKnowledgeCategories() {
  return useQuery({
    queryKey: queryKeys.knowledge.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as KnowledgeCategory[];
    },
  });
}

export function useKnowledgeEntry(id: string) {
  return useQuery({
    queryKey: queryKeys.knowledge.entry(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_entries")
        .select("*, knowledge_categories(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as KnowledgeEntry & { knowledge_categories?: KnowledgeCategory | null };
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: KnowledgeEntryFormData) => {
      // Generate slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        + "-" + Date.now();

      const insertData = {
        title: data.title,
        content: data.content,
        slug,
        author_id: user?.id!,
        tags: data.tags || null,
        status: "published",
      };

      const { data: entry, error } = await supabase
        .from("knowledge_entries")
        .insert([insertData])
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
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.tags !== undefined) updateData.tags = data.tags || null;
      if (data.category !== undefined) updateData.category_id = data.category || null;

      const { data: entry, error } = await supabase
        .from("knowledge_entries")
        .update(updateData)
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

/**
 * Hook to manually trigger embedding generation for an entry
 */
export function useTriggerEmbedding() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entryId: string) => {
      // Update status to processing
      const { error: updateError } = await supabase
        .from("knowledge_entries")
        .update({ embedding_status: "processing" })
        .eq("id", entryId);

      if (updateError) throw updateError;

      // Call the edge function to generate embeddings
      const { data, error } = await supabase.functions.invoke(
        "auto-embed-knowledge-files",
        {
          body: { entry_id: entryId },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (_, entryId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.knowledge.entry(entryId),
      });
      invalidateKeys.knowledge(queryClient);
      toast({
        title: "Success",
        description: "Embedding generation started",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger embedding generation",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to increment view count for an entry
 */
export function useIncrementViewCount() {
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.rpc("increment_view_count", {
        entry_id: entryId,
      });

      if (error) throw error;
    },
  });
}

/**
 * Hook to toggle bookmark status for an entry
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entryId: string) => {
      // Check if bookmark exists
      const { data: existing } = await supabase
        .from("knowledge_bookmarks")
        .select("id")
        .eq("user_id", user?.id!)
        .eq("entry_id", entryId)
        .single();

      if (existing) {
        // Remove bookmark
        const { error } = await supabase
          .from("knowledge_bookmarks")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;
        return { action: "removed" };
      } else {
        // Add bookmark
        const { error } = await supabase
          .from("knowledge_bookmarks")
          .insert({
            user_id: user?.id!,
            entry_id: entryId,
          });

        if (error) throw error;
        return { action: "added" };
      }
    },
    onSuccess: (data, entryId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.knowledge.entry(entryId),
      });
      invalidateKeys.knowledge(queryClient);
      toast({
        title: data.action === "added" ? "Bookmarked" : "Bookmark removed",
        description:
          data.action === "added"
            ? "Article saved to your bookmarks"
            : "Article removed from bookmarks",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to fetch user's bookmarked entries
 */
export function useBookmarkedEntries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["knowledge-bookmarks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_bookmarks")
        .select("*, knowledge_entries(*)")
        .eq("user_id", user?.id!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/**
 * Hook to check if an entry is bookmarked
 */
export function useIsBookmarked(entryId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["knowledge-bookmark-status", entryId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_bookmarks")
        .select("id")
        .eq("user_id", user?.id!)
        .eq("entry_id", entryId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    },
    enabled: !!user && !!entryId,
  });
}

/**
 * Hook to get related entries based on semantic similarity
 */
export function useRelatedEntries(entryId: string, limit = 5) {
  return useQuery({
    queryKey: ["knowledge-related", entryId, limit],
    queryFn: async () => {
      // Call edge function for semantic search
      const { data, error } = await supabase.functions.invoke(
        "unified-knowledge-search",
        {
          body: {
            entry_id: entryId,
            limit,
            search_type: "similar",
          },
        }
      );

      if (error) throw error;
      return data?.results || [];
    },
    enabled: !!entryId,
  });
}
