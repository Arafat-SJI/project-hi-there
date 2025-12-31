import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
// V1 Framework Functions organized by category
const V1_FUNCTIONS = {
  foundation: [
    'validate-api-key',
    'audit-log-writer',
    'send-email',
    'send-notification',
  ],
  auth: ['admin-users', 'admin-delete-user'],
  clients: ['api-v1-clients'],
  meetings: [
    'sync-zoom-files',
    'zoom-transcript-processing',
    'generate-meeting-summary',
    'auto-embed-meetings',
    'categorize-meeting',
    'api-v1-meetings',
  ],
  knowledge: [
    'google-drive-sync',
    'google-drive-upload',
    'user-knowledge-upload',
    'user-knowledge-drive-sync',
    'user-knowledge-process',
    'auto-embed-knowledge-files',
    'unified-knowledge-search',
  ],
  ai: [
    'ai-chat-assistant',
    'semantic-search',
    'run-ai-agent',
    'generate-embeddings',
    'gemini-corpus-sync',
    'gemini-rag-query',
    'generate-business-doc',
    'generate-sow',
  ],
  notifications: ['send-slack-message', 'send-feedback-notification'],
};

interface FunctionInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface CopyProgress {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'copying' | 'success' | 'error';
  errors: string[];
}

export default function EdgeFunctionCopyTool() {
  // Form state - hardcoded project refs
  const [sourceProjectRef, setSourceProjectRef] = useState('ttlmdbgptqlvjswtcrnq');
  const [sourceApiToken, setSourceApiToken] = useState('');
  const [targetProjectRef, setTargetProjectRef] = useState('tjkqvbxtziheggurtvcz');
  const [targetApiToken, setTargetApiToken] = useState('');

  // Function selection state
  const [selectedFunctions, setSelectedFunctions] = useState<Set<string>>(new Set());
  const [availableFunctions, setAvailableFunctions] = useState<FunctionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy progress state
  const [copyProgress, setCopyProgress] = useState<CopyProgress>({
    total: 0,
    completed: 0,
    current: '',
    status: 'idle',
    errors: [],
  });

  // List all V1 functions from categories
  const getAllV1Functions = () => {
    return Object.values(V1_FUNCTIONS).flat();
  };

  // Toggle function selection
  const toggleFunction = (slug: string) => {
    const newSelected = new Set(selectedFunctions);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedFunctions(newSelected);
  };

  // Select all V1 functions
  const selectAllV1 = () => {
    const v1Slugs = getAllV1Functions();
    setSelectedFunctions(new Set(v1Slugs));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedFunctions(new Set());
  };

  // Fetch functions from source project via proxy
  const fetchSourceFunctions = async () => {
    if (!sourceProjectRef || !sourceApiToken) {
      setError('Please provide source project ref and API token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('supabase-management-proxy', {
        body: {
          action: 'list-functions',
          projectRef: sourceProjectRef,
          apiToken: sourceApiToken,
        },
      });

      if (invokeError) {
        throw new Error(`Failed to fetch functions: ${invokeError.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const functions: FunctionInfo[] = data;
      setAvailableFunctions(functions);

      // Auto-select V1 functions that exist
      const v1Slugs = getAllV1Functions();
      const existingV1 = functions
        .filter((f) => v1Slugs.includes(f.slug))
        .map((f) => f.slug);
      setSelectedFunctions(new Set(existingV1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch functions');
    } finally {
      setLoading(false);
    }
  };

  // Get function metadata from source project
  const getFunctionMetadata = async (slug: string) => {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${sourceProjectRef}/functions/${slug}`,
      {
        headers: {
          Authorization: `Bearer ${sourceApiToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get metadata for ${slug}: ${response.statusText}`);
    }

    return await response.json();
  };

  // Get function code (ESZIP format) from source project
  const getFunctionCode = async (slug: string): Promise<ArrayBuffer> => {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${sourceProjectRef}/functions/${slug}/body`,
      {
        headers: {
          Authorization: `Bearer ${sourceApiToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get code for ${slug}: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  };

  // Deploy function to target project using ESZIP format
  const deployFunction = async (slug: string, eszipBytes: ArrayBuffer, metadata: any) => {
    // Try PATCH first (update existing function)
    const patchResponse = await fetch(
      `https://api.supabase.com/v1/projects/${targetProjectRef}/functions/${slug}?verify_jwt=${metadata.verify_jwt || false}&import_map=${metadata.import_map || false}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${targetApiToken}`,
          'Content-Type': 'application/vnd.denoland.eszip',
        },
        body: eszipBytes,
      }
    );

    if (patchResponse.ok) {
      return await patchResponse.json();
    }

    // If function doesn't exist (404), create it using POST
    if (patchResponse.status === 404) {
      const createResponse = await fetch(
        `https://api.supabase.com/v1/projects/${targetProjectRef}/functions?slug=${slug}&name=${slug}&verify_jwt=${metadata.verify_jwt || false}&import_map=${metadata.import_map || false}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${targetApiToken}`,
            'Content-Type': 'application/vnd.denoland.eszip',
          },
          body: eszipBytes,
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create ${slug}: ${createResponse.statusText} - ${errorText}`);
      }

      return await createResponse.json();
    }

    // Other error from PATCH
    const errorText = await patchResponse.text();
    throw new Error(`Failed to deploy ${slug}: ${patchResponse.statusText} - ${errorText}`);
  };

  // Copy selected functions
  const copyFunctions = async () => {
    if (!targetProjectRef || !targetApiToken) {
      setError('Please provide target project ref and API token');
      return;
    }

    if (selectedFunctions.size === 0) {
      setError('Please select at least one function to copy');
      return;
    }

    const functionsToKeep = Array.from(selectedFunctions);

    setCopyProgress({
      total: functionsToKeep.length,
      completed: 0,
      current: '',
      status: 'copying',
      errors: [],
    });

    const errors: string[] = [];

    for (let i = 0; i < functionsToKeep.length; i++) {
      const slug = functionsToKeep[i];

      setCopyProgress((prev) => ({
        ...prev,
        current: slug,
        completed: i,
      }));

      try {
        // Get function metadata from source
        const metadata = await getFunctionMetadata(slug);

        // Get function code (ESZIP bytes) from source
        const eszipBytes = await getFunctionCode(slug);

        // Deploy to target using ESZIP format
        await deployFunction(slug, eszipBytes, metadata);

        console.log(`✓ Copied ${slug} (verify_jwt=${metadata.verify_jwt})`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : `Failed to copy ${slug}`;
        errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setCopyProgress({
      total: functionsToKeep.length,
      completed: functionsToKeep.length,
      current: '',
      status: errors.length > 0 ? 'error' : 'success',
      errors,
    });
  };

  // Get category for a function slug
  const getFunctionCategory = (slug: string): string => {
    for (const [category, functions] of Object.entries(V1_FUNCTIONS)) {
      if (functions.includes(slug)) {
        return category;
      }
    }
    return 'other';
  };

  // Render function list grouped by category
  const renderFunctionList = () => {
    const categories = Object.keys(V1_FUNCTIONS) as Array<keyof typeof V1_FUNCTIONS>;

    return (
      <div className="space-y-6">
        {categories.map((category) => {
          const functions = V1_FUNCTIONS[category];
          const categoryFunctions = availableFunctions.filter((f) =>
            functions.includes(f.slug)
          );

          return (
            <div key={category} className="space-y-2">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                {category} ({categoryFunctions.length}/{functions.length})
              </h3>
              <div className="space-y-1">
                {functions.map((slug) => {
                  const funcInfo = availableFunctions.find((f) => f.slug === slug);
                  const exists = !!funcInfo;
                  const isSelected = selectedFunctions.has(slug);

                  return (
                    <div
                      key={slug}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                    >
                      <Checkbox
                        id={slug}
                        checked={isSelected}
                        onCheckedChange={() => toggleFunction(slug)}
                        disabled={!exists}
                      />
                      <label
                        htmlFor={slug}
                        className={`flex-1 text-sm cursor-pointer ${
                          !exists ? 'text-muted-foreground line-through' : ''
                        }`}
                      >
                        {slug}
                      </label>
                      {exists ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edge Function Copy Tool</h1>
        <p className="text-muted-foreground">
          Copy edge functions from one Supabase project to another using the Management API
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Source Project */}
        <Card>
          <CardHeader>
            <CardTitle>Source Project</CardTitle>
            <CardDescription>The project to copy functions FROM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-ref">Project Ref</Label>
              <Input
                id="source-ref"
                placeholder="tjkqvbxtziheggurtvcz"
                value={sourceProjectRef}
                onChange={(e) => setSourceProjectRef(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                From your project URL: https://supabase.com/dashboard/project/
                <strong>[project-ref]</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-token">API Token (Personal Access Token)</Label>
              <Input
                id="source-token"
                type="password"
                placeholder="sbp_..."
                value={sourceApiToken}
                onChange={(e) => setSourceApiToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Generate at:{' '}
                <a
                  href="https://supabase.com/dashboard/account/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Account → Access Tokens
                </a>
              </p>
            </div>

            <Button onClick={fetchSourceFunctions} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'List Functions'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Target Project */}
        <Card>
          <CardHeader>
            <CardTitle>Target Project</CardTitle>
            <CardDescription>The project to copy functions TO</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-ref">Project Ref</Label>
              <Input
                id="target-ref"
                placeholder="your-new-project-ref"
                value={targetProjectRef}
                onChange={(e) => setTargetProjectRef(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-token">API Token (Personal Access Token)</Label>
              <Input
                id="target-token"
                type="password"
                placeholder="sbp_..."
                value={targetApiToken}
                onChange={(e) => setTargetApiToken(e.target.value)}
              />
            </div>

            <div className="pt-4 space-y-2">
              <p className="text-sm font-medium">Selected: {selectedFunctions.size} functions</p>
              <div className="flex gap-2">
                <Button onClick={selectAllV1} variant="outline" size="sm" className="flex-1">
                  Select All V1
                </Button>
                <Button onClick={deselectAll} variant="outline" size="sm" className="flex-1">
                  Deselect All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Function List */}
      {availableFunctions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Functions ({availableFunctions.length})</CardTitle>
            <CardDescription>
              Select the functions you want to copy. Green checkmark = available in source project.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderFunctionList()}</CardContent>
        </Card>
      )}

      {/* Copy Button */}
      {availableFunctions.length > 0 && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={copyFunctions}
            disabled={copyProgress.status === 'copying' || selectedFunctions.size === 0}
            size="lg"
            className="min-w-[200px]"
          >
            {copyProgress.status === 'copying' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Copying...
              </>
            ) : (
              `Copy ${selectedFunctions.size} Functions`
            )}
          </Button>
        </div>
      )}

      {/* Copy Progress */}
      {copyProgress.status !== 'idle' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Copy Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {copyProgress.completed} / {copyProgress.total} completed
                </span>
                <span>{Math.round((copyProgress.completed / copyProgress.total) * 100)}%</span>
              </div>
              <Progress value={(copyProgress.completed / copyProgress.total) * 100} />
            </div>

            {copyProgress.current && (
              <p className="text-sm text-muted-foreground">Currently copying: {copyProgress.current}</p>
            )}

            {copyProgress.status === 'success' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Successfully copied {copyProgress.total} functions!
                </AlertDescription>
              </Alert>
            )}

            {copyProgress.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Errors occurred:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {copyProgress.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Get your Personal Access Token from Supabase Dashboard → Account → Access Tokens</li>
            <li>Enter source project credentials and click "List Functions"</li>
            <li>Select the functions you want to copy (or click "Select All V1")</li>
            <li>Enter target project credentials</li>
            <li>Click "Copy Functions" and wait for completion</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-4">
            <strong>Note:</strong> This copies function code only. You still need to set environment
            variables in your target project (OPENAI_API_KEY, ZOOM_*, etc.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
