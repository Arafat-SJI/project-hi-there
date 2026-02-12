/**
 * Edge functions - per PROJECTS-EXACT-FILE-LIST. Invoke helpers if needed.
 */
import { supabase } from "@/integrations/supabase/client";

export async function invokeEdgeFunction<T = unknown>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return data as T;
}
