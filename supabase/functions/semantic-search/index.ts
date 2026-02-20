import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const {
      query,
      match_threshold: bodyThreshold,
      match_count: bodyCount,
      similarity_threshold,
      limit,
      entity_type: bodyEntityType,
      entity_types: bodyEntityTypes,
      user_id,
      project_name,
      project_manager,
      client_name,
    } = body;

    const match_threshold =
      similarity_threshold ?? bodyThreshold ?? 0.7;
    const match_count = limit ?? bodyCount ?? 10;
    const entity_type =
      bodyEntityType ??
      (Array.isArray(bodyEntityTypes) && bodyEntityTypes.length > 0
        ? bodyEntityTypes[0]
        : null);

    if (!query) {
      return new Response(
        JSON.stringify({ error: "query is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const embeddingResponse = await fetch(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: query,
        }),
      }
    );

    if (!embeddingResponse.ok) {
      throw new Error("Failed to generate embedding");
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    const hasAdminFilters =
      (project_name != null && String(project_name).trim() !== "") ||
      (project_manager != null && String(project_manager).trim() !== "") ||
      (client_name != null && String(client_name).trim() !== "");

    let data: unknown[];

    if (hasAdminFilters) {
      const { data: adminData, error } = await supabaseClient.rpc(
        "match_embeddings_admin",
        {
          query_embedding: embedding,
          match_threshold,
          match_count,
          filter_entity_type: entity_type || null,
          filter_user_id: user_id || null,
          filter_project_name:
            project_name != null ? String(project_name).trim() || null : null,
          filter_project_manager:
            project_manager != null
              ? String(project_manager).trim() || null
              : null,
          filter_client_name:
            client_name != null ? String(client_name).trim() || null : null,
        }
      );
      if (error) {
        console.error("match_embeddings_admin error:", error);
        throw error;
      }
      data = adminData ?? [];
    } else {
      const { data: baseData, error } = await supabaseClient.rpc(
        "match_embeddings",
        {
          query_embedding: embedding,
          match_threshold,
          match_count,
          filter_entity_type: entity_type || null,
          filter_user_id: user_id || null,
        }
      );
      if (error) {
        console.error("Search error:", error);
        throw error;
      }
      data = (baseData ?? []).map(
        (r: {
          id: string;
          entity_type: string;
          entity_id: string;
          content: string;
          metadata: unknown;
          user_id: string | null;
          similarity: number;
          unified_document_id?: string | null;
        }) => ({
          ...r,
          project_name: null,
          project_manager: null,
          client_name: null,
        })
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: data,
        count: data.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Semantic search error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
