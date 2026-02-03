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
      accountability_charts: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_current: boolean | null
          name: string
          published_at: string | null
          published_by: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          name: string
          published_at?: string | null
          published_by?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          name?: string
          published_at?: string | null
          published_by?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      accountability_responsibilities: {
        Row: {
          chart_id: string
          created_at: string | null
          department: string | null
          id: string
          reports_to: string | null
          responsibilities: Json | null
          role_title: string
          sort_order: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chart_id: string
          created_at?: string | null
          department?: string | null
          id?: string
          reports_to?: string | null
          responsibilities?: Json | null
          role_title: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chart_id?: string
          created_at?: string | null
          department?: string | null
          id?: string
          reports_to?: string | null
          responsibilities?: Json | null
          role_title?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accountability_responsibilities_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "accountability_charts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountability_responsibilities_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "accountability_responsibilities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      ai_productivity_insights: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string | null
          department: string | null
          employee_email: string | null
          id: string
          insight_type: string
          model_used: string | null
          pod_id: string | null
          recommendations: string[] | null
          title: string
          week_start: string | null
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string | null
          department?: string | null
          employee_email?: string | null
          id?: string
          insight_type: string
          model_used?: string | null
          pod_id?: string | null
          recommendations?: string[] | null
          title: string
          week_start?: string | null
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          department?: string | null
          employee_email?: string | null
          id?: string
          insight_type?: string
          model_used?: string | null
          pod_id?: string | null
          recommendations?: string[] | null
          title?: string
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_productivity_insights_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
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
      app_modules: {
        Row: {
          category: string | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_core: boolean | null
          name: string
          page_route: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_core?: boolean | null
          name: string
          page_route?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_core?: boolean | null
          name?: string
          page_route?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_feedback: {
        Row: {
          client_access_id: string | null
          created_at: string | null
          feedback_text: string
          id: string
          project_id: string
          rating: number | null
          week_number: number | null
          year: number | null
        }
        Insert: {
          client_access_id?: string | null
          created_at?: string | null
          feedback_text: string
          id?: string
          project_id: string
          rating?: number | null
          week_number?: number | null
          year?: number | null
        }
        Update: {
          client_access_id?: string | null
          created_at?: string | null
          feedback_text?: string
          id?: string
          project_id?: string
          rating?: number | null
          week_number?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_client_access_id_fkey"
            columns: ["client_access_id"]
            isOneToOne: false
            referencedRelation: "project_client_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      common_knowledge: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_communications: {
        Row: {
          channel: string
          contact_id: string
          content: string | null
          created_at: string | null
          direction: string | null
          id: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          channel: string
          contact_id: string
          content?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          contact_id?: string
          content?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          client_id: string | null
          company: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          last_contacted_at: string | null
          last_name: string | null
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          source: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_contacted_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_contacted_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deal_activities: {
        Row: {
          activity_type: string
          content: string
          created_at: string | null
          deal_id: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          content: string
          created_at?: string | null
          deal_id: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          content?: string
          created_at?: string | null
          deal_id?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_comments: {
        Row: {
          content: string
          created_at: string | null
          deal_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          deal_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          deal_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_comments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          client_id: string | null
          closed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          metadata: Json | null
          owner_id: string | null
          probability: number | null
          slug: string
          source: string | null
          stage: string
          tags: string[] | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          client_id?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json | null
          owner_id?: string | null
          probability?: number | null
          slug: string
          source?: string | null
          stage?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          client_id?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json | null
          owner_id?: string | null
          probability?: number | null
          slug?: string
          source?: string | null
          stage?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      embedding_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          max_attempts: number | null
          priority: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
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
          provider_corpus_id: string | null
          provider_document_id: string | null
          unified_document_id: string | null
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
          provider_corpus_id?: string | null
          provider_document_id?: string | null
          unified_document_id?: string | null
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
          provider_corpus_id?: string | null
          provider_document_id?: string | null
          unified_document_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_unified_document_id_fkey"
            columns: ["unified_document_id"]
            isOneToOne: false
            referencedRelation: "unified_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          created_at: string | null
          department_id: string | null
          email: string
          employment_type: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          location: string | null
          manager_email: string | null
          metadata: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          email: string
          employment_type?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          manager_email?: string | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          email?: string
          employment_type?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          manager_email?: string | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      eos_issue_suggestions: {
        Row: {
          ai_model: string | null
          confidence: number | null
          content: string
          created_at: string | null
          id: string
          issue_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          suggestion_type: string
        }
        Insert: {
          ai_model?: string | null
          confidence?: number | null
          content: string
          created_at?: string | null
          id?: string
          issue_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggestion_type: string
        }
        Update: {
          ai_model?: string | null
          confidence?: number | null
          content?: string
          created_at?: string | null
          id?: string
          issue_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "eos_issue_suggestions_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "eos_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      eos_issues: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_anonymous: boolean | null
          meeting_id: string | null
          pod_id: string | null
          priority: string
          reported_by: string | null
          solved_at: string | null
          source: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_anonymous?: boolean | null
          meeting_id?: string | null
          pod_id?: string | null
          priority?: string
          reported_by?: string | null
          solved_at?: string | null
          source?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_anonymous?: boolean | null
          meeting_id?: string | null
          pod_id?: string | null
          priority?: string
          reported_by?: string | null
          solved_at?: string | null
          source?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eos_issues_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "eos_pods"
            referencedColumns: ["id"]
          },
        ]
      }
      eos_pods: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lead_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      eos_scorecard_metrics: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          goal_direction: string | null
          id: string
          metric_type: string | null
          name: string
          scorecard_id: string
          sort_order: number | null
          status: string | null
          target_value: number | null
          unit: string | null
          updated_at: string | null
          week_of: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          goal_direction?: string | null
          id?: string
          metric_type?: string | null
          name: string
          scorecard_id: string
          sort_order?: number | null
          status?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
          week_of?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          goal_direction?: string | null
          id?: string
          metric_type?: string | null
          name?: string
          scorecard_id?: string
          sort_order?: number | null
          status?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
          week_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eos_scorecard_metrics_scorecard_id_fkey"
            columns: ["scorecard_id"]
            isOneToOne: false
            referencedRelation: "eos_scorecards"
            referencedColumns: ["id"]
          },
        ]
      }
      eos_scorecards: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      eos_vto: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          section: string
          sort_order: number | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          section: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          section?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
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
      gemini_corpora: {
        Row: {
          created_at: string | null
          display_name: string | null
          document_count: number | null
          external_corpus_id: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          document_count?: number | null
          external_corpus_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          document_count?: number | null
          external_corpus_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gemini_query_logs: {
        Row: {
          corpus_id: string | null
          created_at: string | null
          duration_ms: number | null
          id: string
          metadata: Json | null
          query_text: string
          result_count: number | null
          user_id: string | null
        }
        Insert: {
          corpus_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          query_text: string
          result_count?: number | null
          user_id?: string | null
        }
        Update: {
          corpus_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          query_text?: string
          result_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gemini_query_logs_corpus_id_fkey"
            columns: ["corpus_id"]
            isOneToOne: false
            referencedRelation: "gemini_corpora"
            referencedColumns: ["id"]
          },
        ]
      }
      gemini_sync_logs: {
        Row: {
          completed_at: string | null
          corpus_id: string
          created_at: string | null
          documents_added: number | null
          documents_removed: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: string | null
          sync_type: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          corpus_id: string
          created_at?: string | null
          documents_added?: number | null
          documents_removed?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          sync_type: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          corpus_id?: string
          created_at?: string | null
          documents_added?: number | null
          documents_removed?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gemini_sync_logs_corpus_id_fkey"
            columns: ["corpus_id"]
            isOneToOne: false
            referencedRelation: "gemini_corpora"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_webhook_logs: {
        Row: {
          client_state_valid: boolean
          error_message: string | null
          event_type: string
          id: string
          metadata: Json | null
          processed_at: string | null
          processing_status: string
          received_at: string
          resource_data: Json | null
          subscription_id: string
        }
        Insert: {
          client_state_valid?: boolean
          error_message?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processing_status?: string
          received_at?: string
          resource_data?: Json | null
          subscription_id: string
        }
        Update: {
          client_state_valid?: boolean
          error_message?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processing_status?: string
          received_at?: string
          resource_data?: Json | null
          subscription_id?: string
        }
        Relationships: []
      }
      graph_webhook_subscriptions: {
        Row: {
          change_types: string[]
          client_state: string
          created_at: string
          error_count: number
          expiration_datetime: string
          id: string
          is_active: boolean
          last_notification_at: string | null
          metadata: Json | null
          notification_url: string
          resource: string
          subscription_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          change_types?: string[]
          client_state: string
          created_at?: string
          error_count?: number
          expiration_datetime: string
          id?: string
          is_active?: boolean
          last_notification_at?: string | null
          metadata?: Json | null
          notification_url: string
          resource: string
          subscription_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          change_types?: string[]
          client_state?: string
          created_at?: string
          error_count?: number
          expiration_datetime?: string
          id?: string
          is_active?: boolean
          last_notification_at?: string | null
          metadata?: Json | null
          notification_url?: string
          resource?: string
          subscription_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gwc_assessments: {
        Row: {
          assessment_date: string | null
          assessor_id: string
          created_at: string | null
          gets_it: boolean | null
          has_capacity: boolean | null
          id: string
          notes: string | null
          responsibility_id: string
          wants_it: boolean | null
        }
        Insert: {
          assessment_date?: string | null
          assessor_id: string
          created_at?: string | null
          gets_it?: boolean | null
          has_capacity?: boolean | null
          id?: string
          notes?: string | null
          responsibility_id: string
          wants_it?: boolean | null
        }
        Update: {
          assessment_date?: string | null
          assessor_id?: string
          created_at?: string | null
          gets_it?: boolean | null
          has_capacity?: boolean | null
          id?: string
          notes?: string | null
          responsibility_id?: string
          wants_it?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "gwc_assessments_responsibility_id_fkey"
            columns: ["responsibility_id"]
            isOneToOne: false
            referencedRelation: "accountability_responsibilities"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          enabled: boolean | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          enabled?: boolean | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          enabled?: boolean | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_fields: {
        Row: {
          created_at: string
          default_value: string | null
          display_order: number | null
          field_key: string
          field_type: string
          help_text: string | null
          id: string
          is_required: boolean | null
          is_sensitive: boolean | null
          label: string
          placeholder: string | null
          provider_id: string
          select_options: Json | null
          validation_regex: string | null
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          display_order?: number | null
          field_key: string
          field_type?: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          label: string
          placeholder?: string | null
          provider_id: string
          select_options?: Json | null
          validation_regex?: string | null
        }
        Update: {
          created_at?: string
          default_value?: string | null
          display_order?: number | null
          field_key?: string
          field_type?: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          label?: string
          placeholder?: string | null
          provider_id?: string
          select_options?: Json | null
          validation_regex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_fields_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_providers: {
        Row: {
          auth_type: string
          category_id: string
          created_at: string
          description: string | null
          display_order: number | null
          docs_url: string | null
          id: string
          is_available: boolean | null
          is_beta: boolean | null
          is_coming_soon: boolean | null
          logo_url: string | null
          name: string
          oauth_config: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          auth_type?: string
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          docs_url?: string | null
          id?: string
          is_available?: boolean | null
          is_beta?: boolean | null
          is_coming_soon?: boolean | null
          logo_url?: string | null
          name: string
          oauth_config?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          auth_type?: string
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          docs_url?: string | null
          id?: string
          is_available?: boolean | null
          is_beta?: boolean | null
          is_coming_soon?: boolean | null
          logo_url?: string | null
          name?: string
          oauth_config?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_providers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "integration_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_services: {
        Row: {
          cost_model: Json | null
          created_at: string
          description: string | null
          display_order: number | null
          enabled: boolean | null
          features: Json | null
          has_cost: boolean | null
          id: string
          is_beta: boolean | null
          is_default: boolean | null
          name: string
          provider_id: string
          requires_config: boolean | null
          service_key: string
          updated_at: string
        }
        Insert: {
          cost_model?: Json | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          enabled?: boolean | null
          features?: Json | null
          has_cost?: boolean | null
          id?: string
          is_beta?: boolean | null
          is_default?: boolean | null
          name: string
          provider_id: string
          requires_config?: boolean | null
          service_key: string
          updated_at?: string
        }
        Update: {
          cost_model?: Json | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          enabled?: boolean | null
          features?: Json | null
          has_cost?: boolean | null
          id?: string
          is_beta?: boolean | null
          is_default?: boolean | null
          name?: string
          provider_id?: string
          requires_config?: boolean | null
          service_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_usage_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          estimated_cost: number | null
          id: string
          provider_id: string | null
          request_metadata: Json | null
          response_metadata: Json | null
          service_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          provider_id?: string | null
          request_metadata?: Json | null
          response_metadata?: Json | null
          service_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          provider_id?: string | null
          request_metadata?: Json | null
          response_metadata?: Json | null
          service_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_usage_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_usage_logs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "integration_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          owner_id: string | null
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
          owner_id?: string | null
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
          owner_id?: string | null
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
      knowledge_embeddings: {
        Row: {
          chunk_index: number | null
          content: string
          created_at: string | null
          entry_id: string | null
          file_id: string | null
          id: string
          metadata: Json | null
          token_count: number | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          created_at?: string | null
          entry_id?: string | null
          file_id?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          created_at?: string | null
          entry_id?: string | null
          file_id?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_embeddings_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
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
      knowledge_files: {
        Row: {
          category_id: string | null
          chunk_count: number | null
          created_at: string | null
          embedding_model: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          processing_error: string | null
          processing_status: string | null
          source_id: string | null
          storage_path: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category_id?: string | null
          chunk_count?: number | null
          created_at?: string | null
          embedding_model?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          source_id?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category_id?: string | null
          chunk_count?: number | null
          created_at?: string | null
          embedding_model?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          source_id?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_category_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_files_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          source_type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          source_type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          source_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_followup_contacts: {
        Row: {
          assigned_to: string | null
          contact_id: string
          converted_deal_id: string | null
          created_at: string | null
          follow_up_notes: string | null
          id: string
          next_follow_up: string | null
          priority: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          contact_id: string
          converted_deal_id?: string | null
          created_at?: string | null
          follow_up_notes?: string | null
          id?: string
          next_follow_up?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string
          converted_deal_id?: string | null
          created_at?: string | null
          follow_up_notes?: string | null
          id?: string
          next_follow_up?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_followup_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_followup_contacts_converted_deal_id_fkey"
            columns: ["converted_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_events: {
        Row: {
          approved_by: string | null
          created_at: string | null
          employee_email: string
          end_date: string
          id: string
          is_half_day: boolean | null
          leave_type: string
          notes: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          employee_email: string
          end_date: string
          id?: string
          is_half_day?: boolean | null
          leave_type: string
          notes?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          employee_email?: string
          end_date?: string
          id?: string
          is_half_day?: boolean | null
          leave_type?: string
          notes?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: []
      }
      meeting_agenda_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_completed: boolean | null
          meeting_id: string
          notes: string | null
          presenter_id: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          meeting_id: string
          notes?: string | null
          presenter_id?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          meeting_id?: string
          notes?: string | null
          presenter_id?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          meeting_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          meeting_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_assignments_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_categorizations: {
        Row: {
          category: string
          confidence: number | null
          created_at: string | null
          created_by: string | null
          id: string
          meeting_id: string
          rule_id: string | null
          source: string | null
        }
        Insert: {
          category: string
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_id: string
          rule_id?: string | null
          source?: string | null
        }
        Update: {
          category?: string
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_id?: string
          rule_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_categorizations_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_files: {
        Row: {
          created_at: string
          download_url: string | null
          external_meeting_id: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string
          has_embeddings: boolean | null
          id: string
          is_processed: boolean | null
          meeting_id: string | null
          metadata: Json | null
          processing_status: string | null
          provider: string
          storage_path: string | null
          transcript_content: Json | null
          transcript_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          external_meeting_id?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type: string
          has_embeddings?: boolean | null
          id?: string
          is_processed?: boolean | null
          meeting_id?: string | null
          metadata?: Json | null
          processing_status?: string | null
          provider?: string
          storage_path?: string | null
          transcript_content?: Json | null
          transcript_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          external_meeting_id?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          has_embeddings?: boolean | null
          id?: string
          is_processed?: boolean | null
          meeting_id?: string | null
          metadata?: Json | null
          processing_status?: string | null
          provider?: string
          storage_path?: string | null
          transcript_content?: Json | null
          transcript_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_files_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          attended: boolean | null
          created_at: string | null
          email: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          meeting_id: string
          name: string | null
          role: string | null
          rsvp_status: string | null
          user_id: string | null
        }
        Insert: {
          attended?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id: string
          name?: string | null
          role?: string | null
          rsvp_status?: string | null
          user_id?: string | null
        }
        Update: {
          attended?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string
          name?: string | null
          role?: string | null
          rsvp_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_series: {
        Row: {
          created_at: string | null
          default_agenda: Json | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          next_occurrence: string | null
          organizer_id: string
          recurrence_rule: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_agenda?: Json | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          next_occurrence?: string | null
          organizer_id: string
          recurrence_rule: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_agenda?: Json | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          next_occurrence?: string | null
          organizer_id?: string
          recurrence_rule?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meeting_takeaways: {
        Row: {
          agenda_item_id: string | null
          assigned_to: string | null
          content: string
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          meeting_id: string
          takeaway_type: string
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          agenda_item_id?: string | null
          assigned_to?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          meeting_id: string
          takeaway_type?: string
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agenda_item_id?: string | null
          assigned_to?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          meeting_id?: string
          takeaway_type?: string
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_takeaways_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "meeting_agenda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_takeaways_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
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
          action_items: Json | null
          agenda_finalized: boolean | null
          client_id: string | null
          closed_at: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          efficiency_score: number | null
          external_id: string | null
          external_meeting_id: string | null
          external_uuid: string | null
          host_url: string | null
          id: string
          is_recurring: boolean | null
          join_url: string | null
          location: string | null
          meeting_type: string | null
          metadata: Json | null
          organizer_id: string
          provider: string | null
          scheduled_at: string | null
          series_id: string | null
          slug: string | null
          status: string | null
          summary: string | null
          title: string
          updated_at: string
          zoom_id: string | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_start_url: string | null
          zoom_uuid: string | null
        }
        Insert: {
          action_items?: Json | null
          agenda_finalized?: boolean | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          efficiency_score?: number | null
          external_id?: string | null
          external_meeting_id?: string | null
          external_uuid?: string | null
          host_url?: string | null
          id?: string
          is_recurring?: boolean | null
          join_url?: string | null
          location?: string | null
          meeting_type?: string | null
          metadata?: Json | null
          organizer_id: string
          provider?: string | null
          scheduled_at?: string | null
          series_id?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          zoom_id?: string | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_start_url?: string | null
          zoom_uuid?: string | null
        }
        Update: {
          action_items?: Json | null
          agenda_finalized?: boolean | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          efficiency_score?: number | null
          external_id?: string | null
          external_meeting_id?: string | null
          external_uuid?: string | null
          host_url?: string | null
          id?: string
          is_recurring?: boolean | null
          join_url?: string | null
          location?: string | null
          meeting_type?: string | null
          metadata?: Json | null
          organizer_id?: string
          provider?: string | null
          scheduled_at?: string | null
          series_id?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
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
          {
            foreignKeyName: "meetings_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "meeting_series"
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
      oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          provider: string
          redirect_uri: string | null
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          provider: string
          redirect_uri?: string | null
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          redirect_uri?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      okr_check_ins: {
        Row: {
          confidence: string | null
          created_at: string | null
          id: string
          key_result_id: string | null
          new_value: number
          notes: string | null
          okr_id: string
          previous_value: number | null
          user_id: string
        }
        Insert: {
          confidence?: string | null
          created_at?: string | null
          id?: string
          key_result_id?: string | null
          new_value: number
          notes?: string | null
          okr_id: string
          previous_value?: number | null
          user_id: string
        }
        Update: {
          confidence?: string | null
          created_at?: string | null
          id?: string
          key_result_id?: string | null
          new_value?: number
          notes?: string | null
          okr_id?: string
          previous_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "okr_check_ins_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "okr_key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okr_check_ins_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_key_results: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          metric_type: string
          okr_id: string
          owner_id: string | null
          sort_order: number | null
          start_value: number | null
          status: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          metric_type?: string
          okr_id: string
          owner_id?: string | null
          sort_order?: number | null
          start_value?: number | null
          status?: string
          target_value?: number
          title: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          metric_type?: string
          okr_id?: string
          owner_id?: string | null
          sort_order?: number | null
          start_value?: number | null
          status?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "okr_key_results_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      okrs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          owner_id: string | null
          parent_okr_id: string | null
          pod_id: string | null
          progress: number | null
          quarter: string
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          owner_id?: string | null
          parent_okr_id?: string | null
          pod_id?: string | null
          progress?: number | null
          quarter: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          owner_id?: string | null
          parent_okr_id?: string | null
          pod_id?: string | null
          progress?: number | null
          quarter?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "okrs_parent_okr_id_fkey"
            columns: ["parent_okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okrs_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "eos_pods"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_integrations: {
        Row: {
          config: Json | null
          connection_message: string | null
          connection_status: string | null
          created_at: string
          enabled: boolean | null
          id: string
          last_sync_at: string | null
          last_tested_at: string | null
          oauth_tokens: Json | null
          provider_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          connection_message?: string | null
          connection_status?: string | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_sync_at?: string | null
          last_tested_at?: string | null
          oauth_tokens?: Json | null
          provider_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          connection_message?: string | null
          connection_status?: string | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_sync_at?: string | null
          last_tested_at?: string | null
          oauth_tokens?: Json | null
          provider_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_integrations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_members: {
        Row: {
          id: string
          joined_at: string | null
          pod_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          pod_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          pod_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_members_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      pods: {
        Row: {
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lead_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pods_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      process_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      process_documents: {
        Row: {
          category_id: string
          content: string | null
          created_at: string | null
          created_by: string | null
          file_url: string | null
          id: string
          published_at: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          version: number | null
        }
        Insert: {
          category_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          file_url?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          category_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          file_url?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "process_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "process_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_queue_history: {
        Row: {
          batch_type: string
          completed_at: string | null
          created_at: string | null
          failed_count: number | null
          id: string
          metadata: Json | null
          processed_count: number | null
          started_at: string | null
          status: string | null
          total_items: number | null
          triggered_by: string | null
        }
        Insert: {
          batch_type: string
          completed_at?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          metadata?: Json | null
          processed_count?: number | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
          triggered_by?: string | null
        }
        Update: {
          batch_type?: string
          completed_at?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          metadata?: Json | null
          processed_count?: number | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      productivity_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          dismissed_at: string | null
          employee_email: string
          id: string
          is_read: boolean | null
          severity: string | null
          title: string
          week_start: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          dismissed_at?: string | null
          employee_email: string
          id?: string
          is_read?: boolean | null
          severity?: string | null
          title: string
          week_start?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          dismissed_at?: string | null
          employee_email?: string
          id?: string
          is_read?: boolean | null
          severity?: string | null
          title?: string
          week_start?: string | null
        }
        Relationships: []
      }
      productivity_records: {
        Row: {
          attendance_status: string | null
          billable_hours: number | null
          created_at: string | null
          department: string | null
          efficiency_score: number | null
          employee_email: string
          id: string
          location: string | null
          meetings_attended: number | null
          metadata: Json | null
          tasks_assigned: number | null
          tasks_completed: number | null
          total_hours: number | null
          updated_at: string | null
          utilization_pct: number | null
          week_number: number
          week_start: string
          year: number
        }
        Insert: {
          attendance_status?: string | null
          billable_hours?: number | null
          created_at?: string | null
          department?: string | null
          efficiency_score?: number | null
          employee_email: string
          id?: string
          location?: string | null
          meetings_attended?: number | null
          metadata?: Json | null
          tasks_assigned?: number | null
          tasks_completed?: number | null
          total_hours?: number | null
          updated_at?: string | null
          utilization_pct?: number | null
          week_number: number
          week_start: string
          year: number
        }
        Update: {
          attendance_status?: string | null
          billable_hours?: number | null
          created_at?: string | null
          department?: string | null
          efficiency_score?: number | null
          employee_email?: string
          id?: string
          location?: string | null
          meetings_attended?: number | null
          metadata?: Json | null
          tasks_assigned?: number | null
          tasks_completed?: number | null
          total_hours?: number | null
          updated_at?: string | null
          utilization_pct?: number | null
          week_number?: number
          week_start?: string
          year?: number
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
      project_billing: {
        Row: {
          billing_type: string | null
          created_at: string | null
          currency: string | null
          id: string
          invoiced_amount: number | null
          payment_terms: string | null
          project_id: string
          rate: number | null
          total_budget: number | null
          updated_at: string | null
        }
        Insert: {
          billing_type?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoiced_amount?: number | null
          payment_terms?: string | null
          project_id: string
          rate?: number | null
          total_budget?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_type?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoiced_amount?: number | null
          payment_terms?: string | null
          project_id?: string
          rate?: number | null
          total_budget?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_billing_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_client_access: {
        Row: {
          access_token: string
          client_email: string
          client_name: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          login_count: number | null
          password_hash: string
          project_id: string
          project_slug: string | null
          revoked_at: string | null
          revoked_by: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string
          client_email: string
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          password_hash: string
          project_id: string
          project_slug?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          client_email?: string
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          password_hash?: string
          project_id?: string
          project_slug?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_client_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_client_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          created_by: string | null
          id: string
          is_visible: boolean | null
          milestone_id: string | null
          project_id: string
          sprint_name: string | null
          updated_at: string | null
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_visible?: boolean | null
          milestone_id?: string | null
          project_id: string
          sprint_name?: string | null
          updated_at?: string | null
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_visible?: boolean | null
          milestone_id?: string | null
          project_id?: string
          sprint_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_client_comments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_client_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_favorites: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string
          source: string | null
          storage_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id: string
          source?: string | null
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string
          source?: string | null
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invoices: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          project_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          project_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          project_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          joined_at: string | null
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          pm_notes: string | null
          project_id: string
          sort_order: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          pm_notes?: string | null
          project_id: string
          sort_order?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          pm_notes?: string | null
          project_id?: string
          sort_order?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_risks: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_client_visible: boolean | null
          mitigation: string | null
          project_id: string
          reported_by: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_client_visible?: boolean | null
          mitigation?: string | null
          project_id: string
          reported_by?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_client_visible?: boolean | null
          mitigation?: string | null
          project_id?: string
          reported_by?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_statuses: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          external_id: string | null
          external_provider: string | null
          id: string
          is_archived: boolean | null
          metadata: Json | null
          name: string
          owner_id: string | null
          slug: string
          source_deal_id: string | null
          start_date: string | null
          status_id: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          name: string
          owner_id?: string | null
          slug: string
          source_deal_id?: string | null
          start_date?: string | null
          status_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          name?: string
          owner_id?: string | null
          slug?: string
          source_deal_id?: string | null
          start_date?: string | null
          status_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "project_statuses"
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
      scheduled_emails: {
        Row: {
          body: string
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          id: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
          subject: string
          to_email: string
        }
        Insert: {
          body: string
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          subject: string
          to_email: string
        }
        Update: {
          body?: string
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_emails_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          storage_path: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          slug: string | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug?: string | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          parent_comment_id: string | null
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_comment_id?: string | null
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_comment_id?: string | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_contributors: {
        Row: {
          added_at: string | null
          id: string
          role: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          role?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          role?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_contributors_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_stream_members: {
        Row: {
          id: string
          joined_at: string | null
          role: string | null
          stream_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string | null
          stream_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_stream_members_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "task_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      task_streams: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          name: string
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          meeting_id: string | null
          metadata: Json | null
          parent_id: string | null
          position: number | null
          priority: string
          slug: string | null
          status: string
          stream_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          parent_id?: string | null
          position?: number | null
          priority?: string
          slug?: string | null
          status?: string
          stream_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          parent_id?: string | null
          position?: number | null
          priority?: string
          slug?: string | null
          status?: string
          stream_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "task_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_documents: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          drive_file_id: string | null
          embedding_model: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          owner_id: string
          owner_type: string
          processing_error: string | null
          processing_status: string | null
          source_id: string | null
          storage_path: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          drive_file_id?: string | null
          embedding_model?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          owner_id: string
          owner_type: string
          processing_error?: string | null
          processing_status?: string | null
          source_id?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          drive_file_id?: string | null
          embedding_model?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          owner_id?: string
          owner_type?: string
          processing_error?: string | null
          processing_status?: string | null
          source_id?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string | null
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
      user_knowledge_files: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          processing_status: string | null
          storage_path: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          processing_status?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          processing_status?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_microsoft_teams: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_archived: boolean | null
          synced_at: string | null
          team_id: string
          updated_at: string | null
          user_id: string
          visibility: string | null
          web_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_archived?: boolean | null
          synced_at?: string | null
          team_id: string
          updated_at?: string | null
          user_id: string
          visibility?: string | null
          web_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_archived?: boolean | null
          synced_at?: string | null
          team_id?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
          web_url?: string | null
        }
        Relationships: []
      }
      user_microsoft_teams_channels: {
        Row: {
          channel_id: string
          created_at: string | null
          created_date_time: string | null
          description: string | null
          display_name: string
          email: string | null
          id: string
          is_favorite: boolean | null
          membership_type: string | null
          synced_at: string | null
          team_id: string
          updated_at: string | null
          user_id: string
          web_url: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          created_date_time?: string | null
          description?: string | null
          display_name: string
          email?: string | null
          id?: string
          is_favorite?: boolean | null
          membership_type?: string | null
          synced_at?: string | null
          team_id: string
          updated_at?: string | null
          user_id: string
          web_url?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          created_date_time?: string | null
          description?: string | null
          display_name?: string
          email?: string | null
          id?: string
          is_favorite?: boolean | null
          membership_type?: string | null
          synced_at?: string | null
          team_id?: string
          updated_at?: string | null
          user_id?: string
          web_url?: string | null
        }
        Relationships: []
      }
      user_module_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_oauth_tokens: {
        Row: {
          access_token: string
          account_avatar_url: string | null
          account_email: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          error_at: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_refreshed_at: string | null
          last_used_at: string | null
          metadata: Json | null
          provider_slug: string
          refresh_token: string | null
          scopes: string[] | null
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          account_avatar_url?: string | null
          account_email?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          error_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          last_used_at?: string | null
          metadata?: Json | null
          provider_slug: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          account_avatar_url?: string | null
          account_email?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          error_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          last_used_at?: string | null
          metadata?: Json | null
          provider_slug?: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      work_types: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: string
          is_billable: boolean
          default_rate: number | null
          color: string | null
          is_active: boolean
          sort_order: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category?: string
          is_billable?: boolean
          default_rate?: number | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: string
          is_billable?: boolean
          default_rate?: number | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vector_search_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          id: string
          metadata: Json | null
          query: string
          result_count: number | null
          search_type: string | null
          top_score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          query: string
          result_count?: number | null
          search_type?: string | null
          top_score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          query?: string
          result_count?: number | null
          search_type?: string | null
          top_score?: number | null
          user_id?: string | null
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
      get_user_modules: {
        Args: never
        Returns: {
          category: string
          icon: string
          name: string
          slug: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_embeddings: {
        Args: {
          filter_entity_type?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          p_user_id?: string
          query_embedding: string
        }
        Returns: {
          content: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          similarity: number
          unified_document_id: string
          user_id: string
        }[]
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
