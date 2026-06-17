import { useState, useEffect } from "react";
import { useAppConfig, useUpdateAppConfig, AppConfig } from "@/hooks/useAppConfig";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Save, Shield, Database, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdvancedSettings() {
  const { data: config, isLoading } = useAppConfig();
  const updateConfig = useUpdateAppConfig();

  const [settings, setSettings] = useState<AppConfig | null>(null);
  const [seedOptions, setSeedOptions] = useState({
    seedAIAgents: true,
    seedKnowledgeCategories: true,
    seedSampleData: false,
  });
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (config) setSettings(config);
  }, [config]);

  const isSaving = updateConfig.isPending;
  const isBusy = isSaving || isSeeding;

  async function handleSave() {
    if (!settings) return;
    await updateConfig.mutateAsync(settings);
  }

  async function handleSeedData() {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-template-data", {
        body: { options: seedOptions },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Successfully seeded: ${data.seeded.join(", ")}`);
        if (data.errors?.length > 0) {
          toast.warning(`Errors: ${data.errors.join(", ")}`);
        }
      } else {
        toast.error("Failed to seed template data");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to seed template data");
    } finally {
      setIsSeeding(false);
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced</h1>
          <p className="text-muted-foreground">
            Feature flags, system configuration, and data seeding
          </p>
        </div>
        <Button onClick={handleSave} disabled={isBusy}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Feature Flags</CardTitle>
          </div>
          <CardDescription>Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["enableAIChat", "AI Chat", "Enable AI assistant chat functionality"],
              ["enableKnowledgeBase", "Knowledge Base", "Enable knowledge base management"],
              ["enableMeetings", "Meetings", "Enable meeting management and scheduling"],
              ["enableTasks", "Tasks", "Enable task management functionality"],
              ["enableNotifications", "Notifications", "Enable notification system"],
              ["enableSemanticSearch", "Semantic Search", "Enable AI-powered semantic search"],
              ["enableClients", "Clients Module", "Enable client/CRM management"],
              ["enableAIAgents", "AI Agents", "Enable AI agents management"],
              ["enablePersonalKnowledge", "Personal Knowledge", "Enable user personal file uploads"],
              ["enableFeedback", "Feedback Collection", "Enable user feedback submission"],
              ["enableGoogleDrive", "Google Drive Integration", "Enable Google Drive file sync"],
              ["enableZoomSync", "Zoom Integration", "Enable Zoom meeting sync"],
            ] as const
          ).map(([key, label, description], index) => (
            <div key={key}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{label}</Label>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={settings.features[key]}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      features: { ...settings.features, [key]: checked },
                    })
                  }
                  disabled={isBusy}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>System Configuration</CardTitle>
          </div>
          <CardDescription>General system settings and security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Put the platform in maintenance mode
              </p>
            </div>
            <Switch
              checked={settings.system.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  system: { ...settings.system, maintenanceMode: checked },
                })
              }
              disabled={isBusy}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Signups</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to self-register
              </p>
            </div>
            <Switch
              checked={settings.system.allowSignups}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  system: { ...settings.system, allowSignups: checked },
                })
              }
              disabled={isBusy}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Email Verification</Label>
              <p className="text-sm text-muted-foreground">
                Require users to verify their email before signing in
              </p>
            </div>
            <Switch
              checked={settings.system.requireEmailVerification}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  system: { ...settings.system, requireEmailVerification: checked },
                })
              }
              disabled={isBusy}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (days)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              min="1"
              max="30"
              value={settings.system.sessionTimeout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  system: {
                    ...settings.system,
                    sessionTimeout: parseInt(e.target.value) || 7,
                  },
                })
              }
              disabled={isBusy}
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              Number of days before a user session expires.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Template Data Seeding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Template Data Seeding</CardTitle>
          </div>
          <CardDescription>
            Populate the platform with default templates and sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="seedAIAgents"
                checked={seedOptions.seedAIAgents}
                onCheckedChange={(checked) =>
                  setSeedOptions({ ...seedOptions, seedAIAgents: checked as boolean })
                }
              />
              <label
                htmlFor="seedAIAgents"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Seed Default AI Agents (Meeting Summarizer, Document Analyzer, etc.)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="seedKnowledgeCategories"
                checked={seedOptions.seedKnowledgeCategories}
                onCheckedChange={(checked) =>
                  setSeedOptions({ ...seedOptions, seedKnowledgeCategories: checked as boolean })
                }
              />
              <label
                htmlFor="seedKnowledgeCategories"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Seed Knowledge Base Categories
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="seedSampleData"
                checked={seedOptions.seedSampleData}
                onCheckedChange={(checked) =>
                  setSeedOptions({ ...seedOptions, seedSampleData: checked as boolean })
                }
              />
              <label
                htmlFor="seedSampleData"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Seed Sample Data (demo clients, meetings, etc.)
              </label>
            </div>
          </div>

          <Button onClick={handleSeedData} disabled={isBusy} variant="outline" className="w-full">
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Data...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Seed Template Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
