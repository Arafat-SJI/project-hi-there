import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, invalidateKeys } from "@/lib/cache";
import { ClientFormData } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { logCrud } from "@/lib/activity-logger";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  status: string | null;
  metadata: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientSortBy = "name" | "created_at";
export type ClientSortOrder = "asc" | "desc";

export function useClients(filters?: Record<string, any> & { sortBy?: ClientSortBy; sortOrder?: ClientSortOrder }) {
  const sortBy = filters?.sortBy ?? "created_at";
  const sortOrder = filters?.sortOrder ?? "desc";

  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order(sortBy, { ascending: sortOrder === "asc" });

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      // Map form data to database columns (notes stored in metadata)
      const insertData = {
        name: data.name,
        email: data.email || null,
        company: data.company || null,
        phone: data.phone || null,
        metadata: data.notes ? { notes: data.notes } : null,
      };
      
      const { data: client, error } = await supabase
        .from("clients")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return client as Client;
    },
    onSuccess: (client) => {
      invalidateKeys.clients(queryClient);
      logCrud("create", "client", client.id, { name: client.name });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      // Map form data to database columns
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email || null;
      if (data.company !== undefined) updateData.company = data.company || null;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.notes !== undefined) updateData.metadata = { notes: data.notes };
      
      const { data: client, error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return client as Client;
    },
    onSuccess: (client) => {
      invalidateKeys.clients(queryClient);
      logCrud("update", "client", client.id, { name: client.name });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      invalidateKeys.clients(queryClient);
      logCrud("delete", "client", id);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
  });
}

// Helper to extract notes from client metadata
export function getClientNotes(client: Client): string {
  if (client.metadata && typeof client.metadata === 'object' && 'notes' in client.metadata) {
    return String(client.metadata.notes) || '';
  }
  return '';
}
