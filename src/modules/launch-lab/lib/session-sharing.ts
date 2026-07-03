import { supabase } from "@/integrations/supabase/client";
import type { LaunchLabSessionShare, LaunchLabShareableUser } from "../types";

export function getLaunchLabProjectUrl(sessionId: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/launch-lab/${sessionId}`;
}

export async function fetchLaunchLabSessionShares(sessionId: string): Promise<LaunchLabSessionShare[]> {
  const { data, error } = await supabase.rpc("get_launch_lab_session_shares", {
    p_session_id: sessionId,
  });

  if (error) throw error;

  return (
    (data as {
      id: string;
      session_id: string;
      shared_with_user_id: string;
      shared_with_email: string | null;
      shared_with_name: string | null;
      created_at: string;
    }[] | null) ?? []
  ).map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    sharedWithUserId: row.shared_with_user_id,
    sharedByUserId: "",
    createdAt: row.created_at,
    sharedWithEmail: row.shared_with_email,
    sharedWithName: row.shared_with_name,
  }));
}

export async function fetchLaunchLabShareableUsers(): Promise<LaunchLabShareableUser[]> {
  const { data, error } = await supabase.rpc("get_launch_lab_shareable_users");

  if (error) throw error;

  return (
    (data as {
      id: string;
      email: string | null;
      full_name: string | null;
      avatar_url: string | null;
    }[] | null) ?? []
  ).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
  }));
}

export async function shareLaunchLabSessionWithUser(
  sessionId: string,
  userId: string,
): Promise<{ ok: true } | { error: string }> {
  const { data, error } = await supabase.rpc("share_launch_lab_session_with_user", {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error) throw error;

  const result = data as { ok?: boolean; error?: string } | null;
  if (result?.error) return { error: result.error };
  if (!result?.ok) return { error: "Could not share project" };
  return { ok: true };
}

export async function removeLaunchLabSessionShare(shareId: string): Promise<void> {
  const { error } = await supabase.from("launch_lab_session_shares").delete().eq("id", shareId);
  if (error) throw error;
}
