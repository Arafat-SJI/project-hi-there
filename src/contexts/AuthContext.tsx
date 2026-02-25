import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logLogin, logLogout } from "@/lib/activity-logger";

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  // Agency role for dashboard routing (owner | pm | ic)
  agencyRole?: "owner" | "pm" | "ic";
  // EOS flag: owner sees EOS-enhanced dashboard when true
  isEosUser?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithSSO: (provider: 'google' | 'azure', scopes?: string[]) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  /** Re-fetches agency_role + is_eos_user and patches local profile state. */
  refreshAgencyPreferences: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user role from user_roles table
  const fetchUserRole = async (userId: string): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Error fetching user role:", error);
        }
        return undefined;
      }
      return data?.role;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return undefined;
    }
  };

  // Fetch agency role preferences from user_role_preferences table
  const fetchAgencyPreferences = async (
    userId: string
  ): Promise<{ agencyRole?: "owner" | "pm" | "ic"; isEosUser: boolean }> => {
    try {
      const { data, error } = await (supabase as any)
        .from("user_role_preferences")
        .select("agency_role, is_eos_user")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching agency preferences:", error);
        return { isEosUser: false };
      }

      return {
        agencyRole: (data?.agency_role as "owner" | "pm" | "ic" | null) ?? undefined,
        isEosUser: data?.is_eos_user ?? false,
      };
    } catch (error) {
      console.error("Error fetching agency preferences:", error);
      return { isEosUser: false };
    }
  };

  // Fetch or create user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Fetch role and agency preferences in parallel
      const [role, agencyPrefs] = await Promise.all([
        fetchUserRole(userId),
        fetchAgencyPreferences(userId),
      ]);

      if (error) {
        // Profile doesn't exist, create it
        if (error.code === "PGRST116") {
          const user = (await supabase.auth.getUser()).data.user;
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([
              {
                id: userId,
                email: user?.email,
                full_name: user?.user_metadata?.full_name || user?.user_metadata?.name,
                avatar_url: user?.user_metadata?.avatar_url,
              },
            ])
            .select()
            .single();

          if (createError) throw createError;
          setProfile({ ...newProfile, role, ...agencyPrefs });
        } else {
          throw error;
        }
      } else {
        setProfile({ ...data, role, ...agencyPrefs });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only synchronous state updates here
      setSession(session);
      setUser(session?.user ?? null);
      
      // Defer Supabase calls with setTimeout to prevent deadlock
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // Log login activity
      logLogin("email");
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Sign in failed",
        description: authError.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Sign up failed",
        description: authError.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Google sign in failed",
        description: authError.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign in with Microsoft (Azure AD) - MSAL-based with new window flow
  const signInWithMicrosoft = async () => {
    try {
      // Try MSAL-based login first if configured
      const msalConfig = await import('@/lib/msalConfig');
      const azureAuth = await import('@/lib/azureAuth');
      
      const configValidation = msalConfig.validateMSALConfig();
      if (configValidation.valid) {
        // Check if we have a stored response from previous auth
        const storedResponse = azureAuth.getStoredMSALResponse();
        if (storedResponse && storedResponse.accessToken) {
          // Complete login with stored response
          const result = await azureAuth.completeAzureLoginFromRedirect();
          if (result?.user) {
            toast({
              title: "Welcome!",
              description: "You've successfully signed in with Microsoft.",
            });
            logLogin("microsoft");
            return;
          }
        }
        
        // Initiate window-based auth flow (works in iframes)
        const authResult = await azureAuth.initiateAzureLoginRedirect();
        if (authResult) {
          // Complete login with the result
          const result = await azureAuth.completeAzureLoginFromRedirect();
          if (result?.user) {
            toast({
              title: "Welcome!",
              description: "You've successfully signed in with Microsoft.",
            });
            logLogin("microsoft");
            return;
          }
        }
        return;
      }
      
      // Fallback to Supabase OAuth if MSAL not configured
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "email profile openid User.Read",
        },
      });
      if (error) throw error;
      
      // Log login activity
      logLogin("microsoft");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const authError = error as AuthError;
      const isCancelled = authError?.message === "Authentication window was closed";
      toast({
        title: isCancelled ? "Sign-in cancelled" : "Microsoft sign in failed",
        description: isCancelled ? "You closed the sign-in window. Try again when you're ready." : authError.message,
        variant: isCancelled ? "default" : "destructive",
      });
      throw error;
    }
  };

  // Generic SSO sign in
  const signInWithSSO = async (provider: 'google' | 'azure', scopes?: string[]) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: scopes?.join(' '),
        },
      });
      if (error) throw error;

      // Log SSO login
      logLogin(provider === 'azure' ? 'microsoft' : provider);
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "SSO sign in failed",
        description: authError.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Log logout activity before signing out
      logLogout();
      
      // Check if user is Azure AD user
      const isAzureADUser = localStorage.getItem('isAzureADUser') === 'true';
      
      // Call backend logout endpoint if Azure AD user
      if (isAzureADUser) {
        try {
          const { data: logoutData } = await supabase.functions.invoke('azure-auth-logout', {
            body: {
              isAzureAD: true,
            },
          });
          
          // If logout URL is provided, redirect to Microsoft logout
          if (logoutData?.logoutUrl) {
            // Clear local storage first
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to Microsoft logout
            window.location.href = logoutData.logoutUrl;
            return;
          }
        } catch (error) {
          console.error('Error calling logout endpoint:', error);
          // Continue with regular logout
        }
      }
      
      // Clear MSAL cache if Azure AD user
      if (isAzureADUser) {
        try {
          const msalConfig = await import('@/lib/msalConfig');
          const msalInstance = await msalConfig.getMSALInstance();
          await msalInstance.logoutPopup();
        } catch (error) {
          console.error('Error logging out from MSAL:', error);
          // Continue with regular logout
        }
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Sign out failed",
        description: authError.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Re-fetch agency preferences and patch profile state in place.
  // Called after role assignment so the dashboard re-routes without a full reload.
  const refreshAgencyPreferences = async () => {
    if (!user) return;
    const prefs = await fetchAgencyPreferences(user.id);
    setProfile((prev) => (prev ? { ...prev, ...prefs } : null));
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithSSO,
    signOut,
    updateProfile,
    refreshAgencyPreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
