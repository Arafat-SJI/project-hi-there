export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_agent_runs: {
        Row: {
          agent_id: string
          context: Json | null
          created_at: string
          error_message: string | null
          id: string
          input: string | null
          latency_ms: number | null
          metadata: Json | null
          model_used: string | null
          output: string | null
          provider_used: string | null
          status: string | null
          token_metrics: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          context?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          input?: string | null
          latency_ms?: number | null
          metadata?: Json | null
          model_used?: string | null
          output?: string | null
          provider_used?: string | null
          status?: string | null
          token_metrics?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          context?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          input?: string | null
          latency_ms?: number | null
          metadata?: Json | null
          model_used?: string | null
          output?: string | null
          provider_used?: string | null
          status?: string | null
          token_metrics?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          category: string | null
          created_at: string
          data_sources: Json | null
          description: string | null
          id: string
          is_enabled: boolean | null
          memory_enabled: boolean | null
          metadata: Json | null
          name: string
          provider_config: Json | null
          required_role: Database["public"]["Enums"]["app_role"] | null
          slug: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          memory_enabled?: boolean | null
          metadata?: Json | null
          name: string
          provider_config?: Json | null
          required_role?: Database["public"]["Enums"]["app_role"] | null
          slug: string
          system_prompt: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          memory_enabled?: boolean | null
          metadata?: Json | null
          name?: string
          provider_config?: Json | null
          required_role?: Database["public"]["Enums"]["app_role"] | null
          slug?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_chat_history: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          category: string
          context_window: number
          created_at: string
          embedding_cost_per_1k: number
          enabled: boolean
          features: Json
          id: string
          input_cost_per_1k: number
          is_default: boolean
          model_id: string
          name: string
          output_cost_per_1k: number
          provider_id: string
          updated_at: string
        }
        Insert: {
          category: string
          context_window?: number
          created_at?: string
          embedding_cost_per_1k?: number
          enabled?: boolean
          features?: Json
          id?: string
          input_cost_per_1k?: number
          is_default?: boolean
          model_id: string
          name: string
          output_cost_per_1k?: number
          provider_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          context_window?: number
          created_at?: string
          embedding_cost_per_1k?: number
          enabled?: boolean
          features?: Json
          id?: string
          input_cost_per_1k?: number
          is_default?: boolean
          model_id?: string
          name?: string
          output_cost_per_1k?: number
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          api_key_secret_name: string | null
          base_url: string | null
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          api_key_secret_name?: string | null
          base_url?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          api_key_secret_name?: string | null
          base_url?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          embedding_tokens: number
          estimated_cost: number
          function_name: string | null
          id: string
          input_tokens: number
          metadata: Json | null
          model_id: string | null
          output_tokens: number
          user_id: string
        }
        Insert: {
          created_at?: string
          embedding_tokens?: number
          estimated_cost?: number
          function_name?: string | null
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model_id?: string | null
          output_tokens?: number
          user_id: string
        }
        Update: {
          created_at?: string
          embedding_tokens?: number
          estimated_cost?: number
          function_name?: string | null
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model_id?: string | null
          output_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_sensitive: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          chunk_index: number | null
          content: string
          created_at: string
          embedding: string | null
          entity_id: string
          entity_type: string
          gemini_corpus_id: string | null
          gemini_document_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          created_at?: string
          embedding?: string | null
          entity_id: string
          entity_type: string
          gemini_corpus_id?: string | null
          gemini_document_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          created_at?: string
          embedding?: string | null
          entity_id?: string
          entity_type?: string
          gemini_corpus_id?: string | null
          gemini_document_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          rating: number | null
          status: string | null
          subject: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          rating?: number | null
          status?: string | null
          subject: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          rating?: number | null
          status?: string | null
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          metadata: Json | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_entries: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          search_vector: unknown
          slug: string
          status: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          search_vector?: unknown
          slug: string
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          search_vector?: unknown
          slug?: string
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcripts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          meeting_id: string
          speaker: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          meeting_id: string
          speaker: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          meeting_id?: string
          speaker?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          location: string | null
          meeting_type: string | null
          metadata: Json | null
          organizer_id: string
          scheduled_at: string | null
          status: string | null
          title: string
          updated_at: string
          zoom_id: string | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_start_url: string | null
          zoom_uuid: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          meeting_type?: string | null
          metadata?: Json | null
          organizer_id: string
          scheduled_at?: string | null
          status?: string | null
          title: string
          updated_at?: string
          zoom_id?: string | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_start_url?: string | null
          zoom_uuid?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          meeting_type?: string | null
          metadata?: Json | null
          organizer_id?: string
          scheduled_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          zoom_id?: string | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_start_url?: string | null
          zoom_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string | null
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zoom_files: {
        Row: {
          created_at: string
          download_url: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string
          has_embeddings: boolean | null
          id: string
          is_processed: boolean | null
          meeting_id: string
          metadata: Json | null
          processing_status: string | null
          storage_path: string | null
          transcript_content: Json | null
          transcript_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type: string
          has_embeddings?: boolean | null
          id?: string
          is_processed?: boolean | null
          meeting_id: string
          metadata?: Json | null
          processing_status?: string | null
          storage_path?: string | null
          transcript_content?: Json | null
          transcript_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          has_embeddings?: boolean | null
          id?: string
          is_processed?: boolean | null
          meeting_id?: string
          metadata?: Json | null
          processing_status?: string | null
          storage_path?: string | null
          transcript_content?: Json | null
          transcript_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zoom_files_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
