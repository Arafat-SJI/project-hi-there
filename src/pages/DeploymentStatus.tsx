import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EdgeFunction {
  name: string;
  category: string;
  description: string;
  required: boolean;
  envVars?: string[];
  requiresAuth?: boolean;
}

interface FunctionStatus {
  name: string;
  deployed: boolean;
  responding: boolean;
  error?: string;
  loading: boolean;
  authRequired?: boolean;
}

const EDGE_FUNCTIONS: EdgeFunction[] = [
  // Foundation (4)
  { name: "validate-api-key", category: "Foundation", description: "API key validation", required: true },
  { name: "audit-log-writer", category: "Foundation", description: "Activity logging", required: true },
  { name: "send-email", category: "Foundation", description: "Email sending", required: false, envVars: ["SENDGRID_API_KEY"] },
  { name: "send-notification", category: "Foundation", description: "Notifications", required: true },

  // AI (6)
  { name: "ai-chat-assistant", category: "AI", description: "Chat with AI", required: true, envVars: ["OPENAI_API_KEY"] },
  { name: "semantic-search", category: "AI", description: "Vector search", required: true, envVars: ["OPENAI_API_KEY"] },
  { name: "run-ai-agent", category: "AI", description: "Execute AI agents", required: true, envVars: ["OPENAI_API_KEY"] },
  { name: "generate-embeddings", category: "AI", description: "Create embeddings", required: true, envVars: ["OPENAI_API_KEY"] },
  { name: "generate-meeting-summary", category: "AI", description: "Summarize meetings", required: false, envVars: ["OPENAI_API_KEY"] },
  { name: "generate-business-doc", category: "AI", description: "Generate documents", required: false, envVars: ["OPENAI_API_KEY"] },

  // Meetings (5)
  { name: "sync-zoom-files", category: "Meetings", description: "Sync Zoom recordings", required: false, envVars: ["ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"], requiresAuth: true },
  { name: "zoom-transcript-processing", category: "Meetings", description: "Process transcripts", required: false },
  { name: "auto-embed-meetings", category: "Meetings", description: "Embed meeting data", required: false, envVars: ["OPENAI_API_KEY"] },
  { name: "categorize-meeting", category: "Meetings", description: "Auto-categorize meetings", required: false, envVars: ["OPENAI_API_KEY"] },
  { name: "api-v1-meetings", category: "Meetings", description: "Meeting CRUD API", required: true, requiresAuth: true },

  // Knowledge Base (7)
  { name: "google-drive-sync", category: "Knowledge", description: "Sync Google Drive", required: false, envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { name: "google-drive-upload", category: "Knowledge", description: "Upload to Drive", required: false, envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { name: "user-knowledge-upload", category: "Knowledge", description: "User file upload", required: false },
  { name: "user-knowledge-drive-sync", category: "Knowledge", description: "User Drive sync", required: false, envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { name: "user-knowledge-process", category: "Knowledge", description: "Process knowledge files", required: false, envVars: ["OPENAI_API_KEY"] },
  { name: "auto-embed-knowledge-files", category: "Knowledge", description: "Embed knowledge", required: false, envVars: ["OPENAI_API_KEY"] },
  { name: "unified-knowledge-search", category: "Knowledge", description: "Search knowledge base", required: true },

  // Clients & Feedback (2)
  { name: "api-v1-clients", category: "Clients", description: "Client CRUD API", required: true, requiresAuth: true },
  { name: "send-feedback-notification", category: "Feedback", description: "Feedback notifications", required: false },

  // Admin (4)
  { name: "check-environment", category: "Admin", description: "Check environment", required: false, requiresAuth: true },
  { name: "seed-template-data", category: "Admin", description: "Seed template data", required: false, requiresAuth: true },
  { name: "sync-ai-models", category: "Admin", description: "Sync AI models", required: false, requiresAuth: true },
  
  // OAuth (3)
  { name: "oauth-exchange-token", category: "OAuth", description: "OAuth token exchange", required: false, requiresAuth: true },
  { name: "oauth-refresh-token", category: "OAuth", description: "OAuth token refresh", required: false, requiresAuth: true },
  { name: "auto-embed-knowledge-entry", category: "Knowledge", description: "Embed knowledge entries", required: false, envVars: ["OPENAI_API_KEY"] },
];

export default function DeploymentStatus() {
  const [functionStatuses, setFunctionStatuses] = useState<Record<string, FunctionStatus>>({});
  const [testing, setTesting] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    // Initialize statuses
    const initial: Record<string, FunctionStatus> = {};
    EDGE_FUNCTIONS.forEach(func => {
      initial[func.name] = {
        name: func.name,
        deployed: false,
        responding: false,
        loading: false,
      };
    });
    setFunctionStatuses(initial);

    // Check database connection
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      setDatabaseStatus("connected");
    } catch (error) {
      console.error("Database connection error:", error);
      setDatabaseStatus("error");
    }
  };

  const testFunction = async (functionName: string) => {
    setFunctionStatuses(prev => ({
      ...prev,
      [functionName]: { ...prev[functionName], loading: true }
    }));

    // Get current session for auth-required functions
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if this function requires auth
    const funcConfig = EDGE_FUNCTIONS.find(f => f.name === functionName);
    const requiresAuth = funcConfig?.requiresAuth ?? false;
    
    if (requiresAuth && !session) {
      setFunctionStatuses(prev => ({
        ...prev,
        [functionName]: {
          ...prev[functionName],
          deployed: true,
          responding: false,
          loading: false,
          authRequired: true,
          error: "Requires authentication - log in to test"
        }
      }));
      return;
    }

    // Prepare test payloads for specific functions
    const testPayloads: Record<string, object> = {
      'validate-api-key': { ping: true },
      'audit-log-writer': { ping: true },
      'send-email': { ping: true },
      'send-notification': { ping: true },
      'ai-chat-assistant': { ping: true },
      'run-ai-agent': { ping: true },
      'generate-embeddings': {
        entity_type: 'test',
        entity_id: 'deployment_status_health_check',
        content: 'Test embedding content for deployment status health check.',
        metadata: { source: 'deployment-status', type: 'health-check' },
      },
      'generate-meeting-summary': { ping: true },
      'generate-business-doc': { ping: true },
      'semantic-search': { query: 'test', limit: 1 },
      'unified-knowledge-search': { query: 'test', limit: 1 },
    };

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: testPayloads[functionName] || {},
      });

      setFunctionStatuses(prev => ({
        ...prev,
        [functionName]: {
          ...prev[functionName],
          deployed: true,
          responding: !error,
          loading: false,
          error: error?.message
        }
      }));
    } catch (error: any) {
      setFunctionStatuses(prev => ({
        ...prev,
        [functionName]: {
          ...prev[functionName],
          deployed: false,
          responding: false,
          loading: false,
          error: error.message || "Not deployed"
        }
      }));
    }
  };

  const testAllFunctions = async () => {
    setTesting(true);
    toast.info("Testing all edge functions...");

    for (const func of EDGE_FUNCTIONS) {
      await testFunction(func.name);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTesting(false);
    toast.success("Testing complete!");
  };

  const getStatusIcon = (status: FunctionStatus) => {
    if (status.loading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (status.deployed && status.responding) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (status.deployed && !status.responding) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusBadge = (status: FunctionStatus) => {
    if (status.loading) {
      return <Badge variant="secondary">Testing...</Badge>;
    }
    if (status.deployed && status.responding) {
      return <Badge className="bg-green-500 text-white">Active</Badge>;
    }
    if (status.authRequired) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Auth Required</Badge>;
    }
    if (status.deployed && !status.responding) {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="secondary">Not Tested</Badge>;
  };

  const groupedFunctions = EDGE_FUNCTIONS.reduce((acc, func) => {
    if (!acc[func.category]) {
      acc[func.category] = [];
    }
    acc[func.category].push(func);
    return acc;
  }, {} as Record<string, EdgeFunction[]>);

  const deployedCount = Object.values(functionStatuses).filter(s => s.deployed && s.responding).length;
  const totalCount = EDGE_FUNCTIONS.length;
  const deploymentProgress = (deployedCount / totalCount) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Deployment Status</h1>
        <p className="text-muted-foreground">
          Monitor and verify edge function deployments
        </p>
      </div>

      {/* Overall Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {databaseStatus === "checking" && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              {databaseStatus === "connected" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {databaseStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
              <span className="text-2xl font-bold capitalize">{databaseStatus}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deployedCount} / {totalCount}</div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${deploymentProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testAllFunctions}
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test All Functions
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Functions by Category */}
      {Object.entries(groupedFunctions).map(([category, functions]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category} Functions</CardTitle>
            <CardDescription>
              {functions.filter(f => functionStatuses[f.name]?.deployed && functionStatuses[f.name]?.responding).length} of {functions.length} active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {functions.map((func) => {
                const status = functionStatuses[func.name] || {
                  name: func.name,
                  deployed: false,
                  responding: false,
                  loading: false,
                };

                return (
                  <div
                    key={func.name}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <div>
                        <div className="font-medium">{func.name}</div>
                        <div className="text-sm text-muted-foreground">{func.description}</div>
                        {func.envVars && func.envVars.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Requires: {func.envVars.join(", ")}
                          </div>
                        )}
                        {status.error && (
                          <div className="text-xs text-red-500 mt-1">
                            Error: {status.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(status)}
                      {func.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testFunction(func.name)}
                        disabled={status.loading}
                      >
                        {status.loading ? "Testing..." : "Test"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Deployment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Instructions</CardTitle>
          <CardDescription>
            Follow these steps to complete deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Set Environment Variables</h4>
            <p className="text-sm text-muted-foreground">
              Go to Supabase Dashboard → Settings → Edge Functions → Secrets
            </p>
            <code className="block bg-muted p-2 rounded text-sm">
              OPENAI_API_KEY=sk-proj-xxxxx (Required for AI features)
            </code>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Deploy Edge Functions</h4>
            <p className="text-sm text-muted-foreground">
              Option A: Use the automated script
            </p>
            <code className="block bg-muted p-2 rounded text-sm">
              ./deploy-edge-functions.sh
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              Option B: Follow MANUAL_DEPLOYMENT_CHECKLIST.md for dashboard deployment
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Run Database Migrations</h4>
            <p className="text-sm text-muted-foreground">
              Execute SQL files in Supabase SQL Editor:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              <li>20251231183400_create_match_embeddings_function.sql</li>
              <li>20251231183500_insert_test_data.sql</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">4. Verify Deployment</h4>
            <p className="text-sm text-muted-foreground">
              Click "Test All Functions" above to verify everything is working
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
