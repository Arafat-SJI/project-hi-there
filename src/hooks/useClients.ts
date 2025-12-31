import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, invalidateKeys } from "@/lib/cache";
import { ClientFormData } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useClients(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

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
      const { data: client, error } = await supabase
        .from("clients")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return client as Client;
    },
    onSuccess: () => {
      invalidateKeys.clients(queryClient);
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
      const { data: client, error } = await supabase
        .from("clients")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return client as Client;
    },
    onSuccess: () => {
      invalidateKeys.clients(queryClient);
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
    onSuccess: () => {
      invalidateKeys.clients(queryClient);
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
