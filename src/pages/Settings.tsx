import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Moon, Globe, Shield, Zap } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      meetings: true,
      clients: true,
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
  });

  const handleSave = () => {
    // TODO: Save to database (profiles.metadata or separate settings table)
    toast.success("Settings saved successfully!");
  };

  const handleReset = () => {
    setSettings({
      notifications: {
        email: true,
        push: true,
        meetings: true,
        clients: true,
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
    });
    toast.info("Settings reset to defaults");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and settings
        </p>
      </div>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, email: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications in browser
              </p>
            </div>
            <Switch
              checked={settings.notifications.push}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, push: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Meeting Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about upcoming meetings
              </p>
            </div>
            <Switch
              checked={settings.notifications.meetings}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, meetings: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Client Updates</Label>
              <p className="text-sm text-muted-foreground">
                Notifications for client-related activities
              </p>
            </div>
            <Switch
              checked={settings.notifications.clients}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, clients: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Agent Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when AI agents complete tasks
              </p>
            </div>
            <Switch
              checked={settings.notifications.aiAgents}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, aiAgents: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={settings.appearance.theme}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, theme: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select your preferred theme
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={settings.appearance.language}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, language: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose your preferred language
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Privacy & Security</CardTitle>
          </div>
          <CardDescription>Control your privacy preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Select
              value={settings.privacy.profileVisibility}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, profileVisibility: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="team">Team Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Who can see your profile information
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activity Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Allow system to track your activity for analytics
              </p>
            </div>
            <Switch
              checked={settings.privacy.activityTracking}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, activityTracking: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>AI Features</CardTitle>
          </div>
          <CardDescription>Configure AI assistant behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Suggestions</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered suggestions throughout the app
              </p>
            </div>
            <Switch
              checked={settings.ai.enableSuggestions}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  ai: { ...settings.ai, enableSuggestions: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Summarize Meetings</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate summaries for new meetings
              </p>
            </div>
            <Switch
              checked={settings.ai.autoSummarize}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  ai: { ...settings.ai, autoSummarize: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
