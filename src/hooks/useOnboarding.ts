import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Check if user has completed onboarding
      const { data: config } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", `user.${currentUser.id}.onboarding_completed`)
        .single();

      // If no config exists or value is false, show onboarding
      const hasCompletedOnboarding = config?.value === true;

      // Also check if user profile is complete (has full_name)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser.id)
        .single();

      const hasProfile = profile?.full_name && profile.full_name.trim() !== "";

      // Show onboarding if either condition is not met
      setShowOnboarding(!hasCompletedOnboarding || !hasProfile);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // On error, assume onboarding is needed to be safe
      setShowOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      // Mark onboarding as completed
      await supabase.from("app_config").upsert({
        key: `user.${user.id}.onboarding_completed`,
        value: true,
        category: "user_preferences",
        description: "User onboarding completion status",
      });

      setShowOnboarding(false);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    loading,
    completeOnboarding,
    skipOnboarding,
    user,
  };
}
