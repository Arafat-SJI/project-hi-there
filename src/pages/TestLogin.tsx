import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, User, Shield, Briefcase, Code, Crown, Loader2 } from "lucide-react";

const TEST_ACCOUNTS = [
  {
    label: "Owner (Admin)",
    email: "admin@collabai.software",
    role: "owner",
    eosUser: true,
    icon: Shield,
    description: "Full admin + agency owner with EOS",
    color: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20",
    badgeVariant: "destructive" as const,
  },
  {
    label: "CEO / Owner",
    email: "ceo@collabai.software",
    role: "owner",
    eosUser: true,
    icon: Crown,
    description: "Agency owner with EOS dashboard",
    color: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20",
    badgeVariant: "default" as const,
  },
  {
    label: "Project Manager",
    email: "demo@collabai.software",
    role: "pm",
    eosUser: false,
    icon: Briefcase,
    description: "PM dashboard with team capacity",
    color: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20",
    badgeVariant: "secondary" as const,
  },
  {
    label: "Individual Contributor",
    email: "ic@collabai.software",
    role: "ic",
    eosUser: false,
    icon: Code,
    description: "IC dashboard with task kanban",
    color: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
    badgeVariant: "outline" as const,
  },
] as const;

const PASSWORD = "Test@123456";

export default function TestLogin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Block in production
  const isProduction = window.location.hostname === "spark-start-kit-86.lovable.app";
  if (isProduction) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>This page is not available in production.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleLogin = async (email: string) => {
    setLoading(email);
    setError(null);
    try {
      // Sign out first if already logged in
      if (user) {
        await supabase.auth.signOut();
        // Small delay to let state clear
        await new Promise((r) => setTimeout(r, 300));
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: PASSWORD,
      });
      if (signInError) throw signInError;
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    setLoading("logout");
    await supabase.auth.signOut();
    setLoading(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">🧪 Test Login</h1>
          <p className="text-sm text-muted-foreground">Quick-switch between agency role accounts</p>
        </div>

        {/* Current session */}
        {user && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">{user.email}</span>
                {(profile as any)?.agencyRole && (
                  <Badge variant="secondary" className="text-xs">
                    {(profile as any).agencyRole}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                disabled={loading === "logout"}
              >
                {loading === "logout" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span className="ml-1">Logout</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Account buttons */}
        <div className="grid gap-3">
          {TEST_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isActive = user?.email === account.email;
            const isLoading = loading === account.email;

            return (
              <button
                key={account.email}
                onClick={() => handleLogin(account.email)}
                disabled={!!loading}
                className={`relative flex items-center gap-4 rounded-lg border p-4 text-left transition-all ${account.color} ${isActive ? "ring-2 ring-primary" : ""} disabled:opacity-50`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/80">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{account.label}</span>
                    <Badge variant={account.badgeVariant} className="text-[10px] px-1.5 py-0">
                      {account.role}
                    </Badge>
                    {account.eosUser && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">EOS</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{account.description}</p>
                </div>
                {isActive && (
                  <Badge className="absolute top-2 right-2 text-[10px]">Active</Badge>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Dev/staging only · Password: ••••••••••
        </p>
      </div>
    </div>
  );
}
