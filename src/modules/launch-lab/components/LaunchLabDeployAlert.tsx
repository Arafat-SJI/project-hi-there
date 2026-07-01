import { AlertTriangle, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { LaunchLabHealth } from "../hooks/useLaunchLabHealth";

interface LaunchLabDeployAlertProps {
  health: LaunchLabHealth | undefined;
  isLoading: boolean;
}

export function LaunchLabDeployAlert({ health, isLoading }: LaunchLabDeployAlertProps) {
  if (isLoading || !health || health.deployed) return null;

  return (
    <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-foreground">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle>Launch Lab AI is not deployed yet</AlertTitle>
      <AlertDescription className="mt-2 space-y-2 text-sm">
        <p>
          The <code className="text-xs bg-muted px-1 rounded">launch-lab-agent</code> Edge Function
          was not found on your Supabase project. Pitch analysis will fail until you deploy it.
        </p>
        <div className="rounded-md bg-muted/80 p-3 font-mono text-xs space-y-1">
          <p className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <Terminal className="h-3.5 w-3.5" />
            Run in terminal (one-time setup):
          </p>
          <p>npx supabase login</p>
          <p>npx supabase link --project-ref hvonjbgyszponjlynpos</p>
          <p>npx supabase secrets set GOOGLE_AI_API_KEY=your-gemini-key</p>
          <p>npx supabase functions deploy launch-lab-agent</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Note: <code className="bg-muted px-1 rounded">GOOGLE_AI_API_KEY</code> in{" "}
          <code className="bg-muted px-1 rounded">.env</code> is not used by Edge Functions — set it
          as a Supabase secret.
        </p>
      </AlertDescription>
    </Alert>
  );
}

export function LaunchLabSecretAlert({ health }: { health: LaunchLabHealth | undefined }) {
  if (!health?.deployed || health.configured !== false) return null;

  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle>Gemini API key missing</AlertTitle>
      <AlertDescription className="text-sm mt-1">
        Deploy succeeded but <code className="text-xs bg-muted px-1 rounded">GOOGLE_AI_API_KEY</code>{" "}
        is not set. Run:{" "}
        <code className="text-xs bg-muted px-1 rounded">
          npx supabase secrets set GOOGLE_AI_API_KEY=your-key
        </code>
      </AlertDescription>
    </Alert>
  );
}
