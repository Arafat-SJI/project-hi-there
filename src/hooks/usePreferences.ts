import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    meetings: boolean;
    clients: boolean;
    tasks: boolean;
    aiAgents: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    language: string;
  };
  privacy: {
    profileVisibility: "public" | "team" | "private";
    activityTracking: boolean;
  };
  ai: {
    enableSuggestions: boolean;
    autoSummarize: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    email: true,
    push: true,
    meetings: true,
    clients: true,
    tasks: true,
    aiAgents: false,
  },
  appearance: {
    theme: "system",
    language: "en",
  },
  privacy: {
    profileVisibility: "team",
    activityTracking: true,
  },
  ai: {
    enableSuggestions: true,
    autoSummarize: false,
  },
};

// Fetch user preferences
export function usePreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["preferences", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Merge with defaults to ensure all keys exist
      const userPrefs = data?.preferences || {};
      return {
        ...DEFAULT_PREFERENCES,
        ...userPrefs,
        notifications: {
          ...DEFAULT_PREFERENCES.notifications,
          ...userPrefs.notifications,
        },
        appearance: {
          ...DEFAULT_PREFERENCES.appearance,
          ...userPrefs.appearance,
        },
        privacy: {
          ...DEFAULT_PREFERENCES.privacy,
          ...userPrefs.privacy,
        },
        ai: {
          ...DEFAULT_PREFERENCES.ai,
          ...userPrefs.ai,
        },
      } as UserPreferences;
    },
    enabled: !!user,
  });
}

// Update user preferences
export function useUpdatePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!user) throw new Error("User not authenticated");

      // Get current preferences
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();

      const currentPrefs = currentProfile?.preferences || {};

      // Merge with current preferences
      const updatedPrefs = {
        ...currentPrefs,
        ...preferences,
        notifications: {
          ...currentPrefs.notifications,
          ...preferences.notifications,
        },
        appearance: {
          ...currentPrefs.appearance,
          ...preferences.appearance,
        },
        privacy: {
          ...currentPrefs.privacy,
          ...preferences.privacy,
        },
        ai: {
          ...currentPrefs.ai,
          ...preferences.ai,
        },
      };

      const { data, error } = await supabase
        .from("profiles")
        .update({ preferences: updatedPrefs })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences", user?.id] });
      toast.success("Settings saved successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating preferences:", error);
      toast.error("Failed to save settings");
    },
  });
}

// Reset preferences to defaults
export function useResetPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update({ preferences: DEFAULT_PREFERENCES })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences", user?.id] });
      toast.info("Settings reset to defaults");
    },
    onError: (error: any) => {
      console.error("Error resetting preferences:", error);
      toast.error("Failed to reset settings");
    },
  });
}
