/**
 * Supabase helpers - per PROJECTS-EXACT-FILE-LIST. Add shared Supabase utilities as needed.
 */
export function getSupabaseErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: string }).message);
  return "An error occurred";
}
