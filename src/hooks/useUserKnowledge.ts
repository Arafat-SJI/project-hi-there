import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface UserKnowledgeFile {
  id: string;
  user_id: string;
  source_id: string | null;
  source_type: string;
  file_name: string;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  processing_status: string;
  processing_error: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
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
        .from('user_knowledge_files')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserKnowledgeFile[];
    },
    enabled: !!user,
  });
}

export function useUserKnowledgeSources() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-knowledge-sources', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_knowledge_sources')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserKnowledgeSource[];
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

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-knowledge')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create file record
      const { data: fileRecord, error: recordError } = await supabase
        .from('user_knowledge_files')
        .insert({
          user_id: user.id,
          source_type: 'upload',
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Trigger processing
      const { error: processError } = await supabase.functions.invoke('user-knowledge-process', {
        body: { file_id: fileRecord.id },
      });

      if (processError) {
        console.error("Process error:", processError);
        // Don't throw - file is uploaded, processing will be retried
      }

      return fileRecord as UserKnowledgeFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-knowledge-files'] });
      toast({
        title: "Success",
        description: "File uploaded and processing started",
      });
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
      // Get file details to delete from storage
      const { data: file } = await supabase
        .from('user_knowledge_files')
        .select('file_path')
        .eq('id', fileId)
        .single();

      // Delete from storage if exists
      if (file?.file_path) {
        await supabase.storage
          .from('user-knowledge')
          .remove([file.file_path]);
      }

      // Delete record
      const { error } = await supabase
        .from('user_knowledge_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-knowledge-files'] });
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

      const { data, error } = await supabase
        .from('user_knowledge_sources')
        .insert({
          ...sourceData,
          user_id: user.id,
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
      const { data, error } = await supabase
        .rpc('get_user_file_stats', { p_user_id: user!.id });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
