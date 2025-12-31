import { useState, useEffect } from "react";
import { useAppConfig, useUpdateAppConfig, useResetAppConfig, AppConfig } from "@/hooks/useAppConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, RefreshCw, Building2, Mail, Zap, Shield, Loader2 } from "lucide-react";

export default function SystemSettings() {
  const { data: config, isLoading } = useAppConfig();
  const updateConfig = useUpdateAppConfig();
  const resetConfig = useResetAppConfig();

  const [settings, setSettings] = useState<AppConfig | null>(null);

  // Load config into local state when it arrives
  useEffect(() => {
    if (config) {
      setSettings(config);
    }
  }, [config]);

  const handleSave = async () => {
    if (!settings) return;
    await updateConfig.mutateAsync(settings);
  };

  const handleReset = async () => {
    await resetConfig.mutateAsync();
  };

  const isProcessing = updateConfig.isPending || resetConfig.isPending;

  if (isLoading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Platform Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Platform Branding</CardTitle>
          </div>
          <CardDescription>Configure your platform's name and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input
              id="platformName"
              value={settings.branding.companyName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, companyName: e.target.value },
                })
              }
              placeholder="CollabAi"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platformTagline">Platform Tagline</Label>
            <Input
              id="platformTagline"
              value={settings.branding.tagline}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, tagline: e.target.value },
                })
              }
              placeholder="AI-Powered Collaboration Platform"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.branding.supportEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, supportEmail: e.target.value },
                })
              }
              placeholder="support@collabai.software"
              disabled={isProcessing}
            />
          </div>
        </CardContent>
      </Card>

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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Chat</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI assistant chat functionality
              </p>
            </div>
            <Switch
              checked={settings.features.enableAIChat}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  features: { ...settings.features, enableAIChat: checked },
                })
              }
              disabled={isProcessing}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Knowledge Base</Label>
              <p className="text-sm text-muted-foreground">
                Enable knowledge base management
              </p>
            </div>
            <Switch
              checked={settings.features.enableKnowledgeBase}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  features: { ...settings.features, enableKnowledgeBase: checked },
                })
              }
              disabled={isProcessing}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Meetings</Label>
              <p className="text-sm text-muted-foreground">
                Enable meeting management and scheduling
              </p>
            </div>
            <Switch
              checked={settings.features.enableMeetings}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  features: { ...settings.features, enableMeetings: checked },
                })
              }
              disabled={isProcessing}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tasks</Label>
              <p className="text-sm text-muted-foreground">
                Enable task management functionality
              </p>
            </div>
            <Switch
              checked={settings.features.enableTasks}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  features: { ...settings.features, enableTasks: checked },
                })
              }
              disabled={isProcessing}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable notification system
              </p>
            </div>
            <Switch
              checked={settings.features.enableNotifications}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  features: { ...settings.features, enableNotifications: checked },
                })
              }
              disabled={isProcessing}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Semantic Search</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered semantic search
              </p>
            </div>
            <Switch
              checked={settings.features.enableSemanticSearch}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  features: { ...settings.features, enableSemanticSearch: checked },
                })
              }
              disabled={isProcessing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Settings</CardTitle>
          </div>
          <CardDescription>Configure email notifications and sender information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable system email notifications
              </p>
            </div>
            <Switch
              checked={settings.email.enableEmailNotifications}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  email: { ...settings.email, enableEmailNotifications: checked },
                })
              }
              disabled={isProcessing}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              value={settings.email.fromName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  email: { ...settings.email, fromName: e.target.value },
                })
              }
              placeholder="CollabAi"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromEmail">From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={settings.email.fromEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  email: { ...settings.email, fromEmail: e.target.value },
                })
              }
              placeholder="noreply@collabai.software"
              disabled={isProcessing}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
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
              disabled={isProcessing}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Signups</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register
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
              disabled={isProcessing}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Email Verification</Label>
              <p className="text-sm text-muted-foreground">
                Require users to verify their email
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
              disabled={isProcessing}
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
                  system: { ...settings.system, sessionTimeout: parseInt(e.target.value) || 7 },
                })
              }
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">
              Number of days before a user session expires
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
