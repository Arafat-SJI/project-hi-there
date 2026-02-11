import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmbeddingQueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  priority: number;
  retry_count: number;
  status: string;
  error_message?: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batch_size = 10 } = await req.json();

    // Validate batch size
    const validBatchSize = Math.min(Math.max(1, batch_size), 50);

    console.log(`Processing embedding queue with batch size: ${validBatchSize}`);

    // Fetch pending items from embedding_queue table
    const { data: queueItems, error: fetchError } = await supabase
      .from("embedding_queue")
      .select("*")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(validBatchSize);

    if (fetchError) {
      console.error("Error fetching queue items:", fetchError);
      throw fetchError;
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending items in queue",
          processed: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${queueItems.length} items to process`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each item
    for (const item of queueItems as EmbeddingQueueItem[]) {
      try {
        // Mark as processing
        await supabase
          .from("embedding_queue")
          .update({
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        // Call generate-embeddings function for this entity
        const { data: embeddingResult, error: embeddingError } = await supabase.functions.invoke(
          "generate-embeddings",
          {
            body: {
              entity_type: item.entity_type,
              entity_id: item.entity_id,
            },
          }
        );

        if (embeddingError) {
          throw embeddingError;
        }

        // Mark as completed
        await supabase
          .from("embedding_queue")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", item.id);

        results.processed++;
        results.succeeded++;

        console.log(`Successfully processed ${item.entity_type}:${item.entity_id}`);
      } catch (error) {
        console.error(`Error processing ${item.entity_type}:${item.entity_id}:`, error);

        const errorMessage = error instanceof Error ? error.message : String(error);
        const newRetryCount = item.retry_count + 1;
        const maxRetries = 3;

        // Mark as failed if max retries reached, otherwise reset to pending
        const newStatus = newRetryCount >= maxRetries ? "failed" : "pending";

        await supabase
          .from("embedding_queue")
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        results.processed++;
        results.failed++;
        results.errors.push(`${item.entity_type}:${item.entity_id} - ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} items`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-embedding-queue:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
