/**
 * Custom hook for managing OAuth clients
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OAuthClient {
  id: string;
  client_id: string;
  client_secret: string;
  client_name: string;
  client_type: string;
  redirect_uris: string[];
  allowed_scopes: string[];
  grant_types: string[];
  logo_url?: string;
  homepage_url?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  require_pkce: boolean;
  require_consent: boolean;
  trusted: boolean;
  enabled: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  total_authorizations: number;
  last_used_at?: string;
}

export function useOAuthClients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["oauth-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oauth_clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OAuthClient[];
    },
  });

  const createClient = useMutation({
    mutationFn: async (clientData: Partial<OAuthClient>) => {
      const { data, error } = await supabase
        .from("oauth_clients")
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
      toast({
        title: "Success",
        description: "OAuth client created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OAuthClient> }) => {
      const { data, error } = await supabase
        .from("oauth_clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
      toast({
        title: "Success",
        description: "OAuth client updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("oauth_clients").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
      toast({
        title: "Success",
        description: "OAuth client deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("oauth_clients")
        .update({ enabled })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
      toast({
        title: "Success",
        description: "Client status updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    clients,
    isLoading,
    error,
    createClient: createClient.mutate,
    updateClient: updateClient.mutate,
    deleteClient: deleteClient.mutate,
    toggleEnabled: toggleEnabled.mutate,
    isCreating: createClient.isPending,
    isUpdating: updateClient.isPending,
    isDeleting: deleteClient.isPending,
  };
}
