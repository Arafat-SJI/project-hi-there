import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";
import { queryKeys, invalidateKeys } from "@/lib/cache";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  read_at: string | null;
  link: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Fetch all notifications for current user
export function useNotifications(filter?: "all" | "unread") {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.notifications.all, filter],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filter === "unread") {
        query = query.eq("is_read", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Invalidate and refetch when notifications change
          invalidateKeys.notifications(queryClient);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

// Get unread count
export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Mark notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.notifications(queryClient);
    },
    onError: (error: any) => {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark as read");
    },
  });
}

// Mark all as read
export function useMarkAllAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.notifications(queryClient);
      toast.success("All notifications marked as read");
    },
    onError: (error: any) => {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.notifications(queryClient);
      toast.success("Notification deleted");
    },
    onError: (error: any) => {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    },
  });
}

// Create notification (utility function for other modules to use)
export async function createNotification(data: {
  user_id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
  metadata?: Record<string, any>;
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: data.user_id,
    title: data.title,
    message: data.message,
    type: data.type || "info",
    link: data.link || null,
    metadata: data.metadata || {},
    is_read: false,
  });

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}
