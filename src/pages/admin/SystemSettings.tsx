import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, RefreshCw, Building2, Mail, Zap, Shield } from "lucide-react";
import { toast } from "sonner";

export default function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Platform Branding
    platformName: "CollabAi",
    platformTagline: "AI-Powered Collaboration Platform",
    supportEmail: "support@collabai.software",

    // Feature Flags
    features: {
      enableAIChat: true,
      enableKnowledgeBase: true,
      enableMeetings: true,
      enableTasks: true,
      enableNotifications: true,
      enableSemanticSearch: true,
    },

    // Email Settings
    email: {
      enableEmailNotifications: true,
      fromName: "CollabAi",
      fromEmail: "noreply@collabai.software",
    },

    // System Settings
    system: {
      maintenanceMode: false,
      allowSignups: true,
      requireEmailVerification: false,
      sessionTimeout: 7, // days
    },
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, this would save to a system_settings table
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      platformName: "CollabAi",
      platformTagline: "AI-Powered Collaboration Platform",
      supportEmail: "support@collabai.software",
      features: {
        enableAIChat: true,
        enableKnowledgeBase: true,
        enableMeetings: true,
        enableTasks: true,
        enableNotifications: true,
        enableSemanticSearch: true,
      },
      email: {
        enableEmailNotifications: true,
        fromName: "CollabAi",
        fromEmail: "noreply@collabai.software",
      },
      system: {
        maintenanceMode: false,
        allowSignups: true,
        requireEmailVerification: false,
        sessionTimeout: 7,
      },
    });
    toast.info("Settings reset to defaults");
  };

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
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
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
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              placeholder="CollabAi"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platformTagline">Platform Tagline</Label>
            <Input
              id="platformTagline"
              value={settings.platformTagline}
              onChange={(e) => setSettings({ ...settings, platformTagline: e.target.value })}
              placeholder="AI-Powered Collaboration Platform"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              placeholder="support@collabai.software"
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
