import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface UserKnowledgeFile {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string | null;
  processing_status: string | null;
  chunk_count: number | null;
  metadata: any;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserKnowledgeSource {
  id: string;
  user_id: string;
  name: string;
  source_type: string;
  source_identifier: string | null;
  source_url: string | null;
  sync_enabled: boolean;
  sync_frequency: string;
  last_synced_at: string | null;
  sync_status: string;
  file_count: number;
  total_size: number;
  credentials: any;
  sync_config: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export function useUserKnowledgeFiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-knowledge-files', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_knowledge_files")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as UserKnowledgeFile[];
    },
    enabled: !!user,
  });
}

export function useUserKnowledgeSources() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-knowledge-sources', user?.id],
    queryFn: async () => {
      // user_knowledge_sources may not be in auto-generated types yet
      const { data, error } = await (supabase as any)
        .from("user_knowledge_sources")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as UserKnowledgeSource[];
    },
    enabled: !!user,
  });
}

export function useUploadUserKnowledgeFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const storagePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-knowledge')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error } = await supabase
        .from("user_knowledge_files")
        .insert({
          user_id: user.id,
          title: file.name.replace(/\.[^.]+$/, ''),
          file_name: file.name,
          file_type: file.type || fileExt || null,
          file_size: file.size,
          storage_path: storagePath,
          processing_status: 'pending',
          metadata: { original_name: file.name },
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "File Uploaded",
        description: `${file.name} uploaded successfully`,
      });

      return data as UserKnowledgeFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-knowledge-files'] });
      queryClient.invalidateQueries({ queryKey: ['user-file-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteUserKnowledgeFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fileId: string) => {
      // Get file info for storage cleanup
      const { data: file, error: fetchError } = await supabase
        .from("user_knowledge_files")
        .select("storage_path")
        .eq("id", fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete storage file if it exists
      if (file?.storage_path) {
        await supabase.storage
          .from('user-knowledge')
          .remove([file.storage_path]);
      }

      // Delete database record
      const { error } = await supabase
        .from("user_knowledge_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-knowledge-files'] });
      queryClient.invalidateQueries({ queryKey: ['user-file-stats'] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateUserKnowledgeSource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sourceData: Partial<UserKnowledgeSource>) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("user_knowledge_sources")
        .insert({
          user_id: user.id,
          name: sourceData.name!,
          source_type: sourceData.source_type || 'local_upload',
          source_identifier: sourceData.source_identifier || null,
          source_url: sourceData.source_url || null,
          sync_enabled: sourceData.sync_enabled ?? false,
          sync_frequency: sourceData.sync_frequency || 'manual',
          sync_config: sourceData.sync_config || {},
          metadata: sourceData.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserKnowledgeSource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-knowledge-sources'] });
      toast({
        title: "Success",
        description: "Knowledge source created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUserFileStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-file-stats', user?.id],
    queryFn: async () => {
      // Compute stats from user files directly
      const { data: files, error } = await supabase
        .from("user_knowledge_files")
        .select("file_size, processing_status")
        .eq("user_id", user!.id);

      if (error) throw error;

      return {
        total_files: files?.length || 0,
        total_size: files?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0,
        pending: files?.filter(f => f.processing_status === 'pending').length || 0,
        processing: files?.filter(f => f.processing_status === 'processing').length || 0,
        completed: files?.filter(f => f.processing_status === 'completed').length || 0,
        failed: files?.filter(f => f.processing_status === 'failed').length || 0,
      };
    },
    enabled: !!user,
  });
}
