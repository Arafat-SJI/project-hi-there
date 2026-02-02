import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, invalidateKeys } from "@/lib/cache";
import { useToast } from "@/hooks/use-toast";
import type { KnowledgeBaseStats, KnowledgeBaseCategory, KnowledgeBaseSource, KnowledgeBaseFile } from "@/types/knowledgeBase";

const EDGE_URL = (path: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-base${path}`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

export function useKnowledgeBaseStats() {
  return useQuery({
    queryKey: queryKeys.knowledge.stats,
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL('/?action=stats'), { headers });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as KnowledgeBaseStats;
    },
  });
}

export function useKnowledgeBaseCategories() {
  return useQuery({
    queryKey: queryKeys.knowledge.categories,
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL('/categories'), { headers });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as KnowledgeBaseCategory[];
    },
  });
}

export function useKnowledgeBaseSources() {
  return useQuery({
    queryKey: queryKeys.knowledge.sources,
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL('/sources'), { headers });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as KnowledgeBaseSource[];
    },
  });
}

export function useKnowledgeBaseFiles(filters?: { category_id?: string; source_id?: string; processing_status?: string }) {
  const params = new URLSearchParams();
  if (filters?.category_id) params.set('category_id', filters.category_id);
  if (filters?.source_id) params.set('source_id', filters.source_id);
  if (filters?.processing_status) params.set('processing_status', filters.processing_status);
  const qs = params.toString();

  return useQuery({
    queryKey: queryKeys.knowledge.files(filters),
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL(`/files${qs ? `?${qs}` : ''}`), { headers });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as KnowledgeBaseFile[];
    },
  });
}

export function useCreateKnowledgeBaseCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (body: Partial<KnowledgeBaseCategory>) => {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL('/categories'), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as KnowledgeBaseCategory;
    },
    onSuccess: () => {
      invalidateKeys.knowledge(queryClient);
      toast({ title: "Success", description: "Category created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

export function useUpdateKnowledgeBaseCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KnowledgeBaseCategory> & { id: string }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL('/categories'), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as KnowledgeBaseCategory;
    },
    onSuccess: () => {
      invalidateKeys.knowledge(queryClient);
      toast({ title: "Success", description: "Category updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}
