/**
 * Edge functions - per PROJECTS-EXACT-FILE-LIST. Invoke helpers if needed.
 */
import { supabase } from "@/integrations/supabase/client";

interface EdgeFunctionError {
  message?: string;
  context?: Response;
}

async function extractErrorMessage(error: EdgeFunctionError, functionName?: string): Promise<string> {
  const status = error.context?.status;

  try {
    const body = await error.context?.clone().json();
    const apiMessage = body?.message || body?.error;

    if (status === 404 || body?.code === "NOT_FOUND") {
      return functionName
        ? `Edge Function "${functionName}" is not deployed. Run: npx supabase functions deploy ${functionName}`
        : "Edge Function not found. Deploy it to your Supabase project first.";
    }

    if (status === 503 && typeof apiMessage === "string" && apiMessage.includes("GOOGLE_AI_API_KEY")) {
      return "GOOGLE_AI_API_KEY is missing in Supabase secrets. Run: npx supabase secrets set GOOGLE_AI_API_KEY=your-key";
    }

    return apiMessage || error.message || "Request failed";
  } catch {
    if (status === 404) {
      return functionName
        ? `Edge Function "${functionName}" is not deployed. Run: npx supabase functions deploy ${functionName}`
        : "Edge Function not found. Deploy it to your Supabase project first.";
    }
    return error.message || "Request failed";
  }
}

export async function invokeEdgeFunction<T = unknown>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(await extractErrorMessage(error, name));
  if (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) {
    const { message, error: errMessage } = data as { message?: string; error?: string };
    throw new Error(message || errMessage || "Request failed");
  }
  return data as T;
}
