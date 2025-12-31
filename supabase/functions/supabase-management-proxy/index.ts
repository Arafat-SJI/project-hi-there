import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProxyRequest {
  action: 'list-functions' | 'get-function-body' | 'deploy-function';
  projectRef: string;
  apiToken: string;
  slug?: string;
  codeBase64?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ProxyRequest = await req.json();
    const { action, projectRef, apiToken, slug, codeBase64 } = body;

    console.log(`[supabase-management-proxy] Action: ${action}, Project: ${projectRef}, Slug: ${slug || 'N/A'}`);

    // Validate required fields
    if (!action || !projectRef || !apiToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, projectRef, apiToken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = `https://api.supabase.com/v1/projects/${projectRef}/functions`;
    const authHeaders = {
      'Authorization': `Bearer ${apiToken}`,
    };

    let response: Response;

    switch (action) {
      case 'list-functions': {
        console.log(`[supabase-management-proxy] Fetching functions list for ${projectRef}`);
        response = await fetch(baseUrl, {
          method: 'GET',
          headers: authHeaders,
        });
        break;
      }

      case 'get-function-body': {
        if (!slug) {
          return new Response(
            JSON.stringify({ error: 'Missing required field: slug' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log(`[supabase-management-proxy] Fetching function body for ${slug}`);
        response = await fetch(`${baseUrl}/${slug}/body`, {
          method: 'GET',
          headers: authHeaders,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[supabase-management-proxy] Error fetching body: ${errorText}`);
          return new Response(
            JSON.stringify({ error: `Failed to get function body: ${response.statusText}`, details: errorText }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Return the blob as base64
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        return new Response(
          JSON.stringify({ data: base64, contentType: blob.type }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'deploy-function': {
        if (!slug || !codeBase64) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: slug, codeBase64' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log(`[supabase-management-proxy] Deploying function ${slug} to ${projectRef}`);

        // Decode base64 to binary
        const binaryString = atob(codeBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const codeBlob = new Blob([bytes], { type: 'application/gzip' });

        // Create form data
        const formData = new FormData();
        formData.append('file', codeBlob, `${slug}.tar.gz`);
        formData.append('metadata', JSON.stringify({
          entrypoint_path: 'index.ts',
          name: slug,
        }));

        response = await fetch(`${baseUrl}/deploy?slug=${slug}`, {
          method: 'POST',
          headers: authHeaders,
          body: formData,
        });
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[supabase-management-proxy] API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.statusText}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`[supabase-management-proxy] Success: ${action}`);
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[supabase-management-proxy] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
