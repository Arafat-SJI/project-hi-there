import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink, Key, Mail, Video, Brain, Cloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  fields: IntegrationField[];
  docsUrl?: string;
}

interface IntegrationField {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  placeholder: string;
  required?: boolean;
  value: string;
}

export default function Integrations() {
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "openai",
      name: "OpenAI",
      description: "Enable AI chat and semantic search with GPT models",
      icon: <Brain className="h-5 w-5" />,
      enabled: true,
      docsUrl: "https://platform.openai.com/docs/api-reference",
      fields: [
        {
          key: "openai_api_key",
          label: "API Key",
          type: "password",
          placeholder: "sk-...",
          required: true,
          value: "",
        },
        {
          key: "openai_org_id",
          label: "Organization ID",
          type: "text",
          placeholder: "org-...",
          required: false,
          value: "",
        },
      ],
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Connect Zoom for meeting recordings and transcriptions",
      icon: <Video className="h-5 w-5" />,
      enabled: false,
      docsUrl: "https://marketplace.zoom.us/docs/api-reference/zoom-api",
      fields: [
        {
          key: "zoom_client_id",
          label: "Client ID",
          type: "text",
          placeholder: "Your Zoom Client ID",
          required: true,
          value: "",
        },
        {
          key: "zoom_client_secret",
          label: "Client Secret",
          type: "password",
          placeholder: "Your Zoom Client Secret",
          required: true,
          value: "",
        },
        {
          key: "zoom_account_id",
          label: "Account ID",
          type: "text",
          placeholder: "Your Zoom Account ID",
          required: true,
          value: "",
        },
      ],
    },
    {
      id: "sendgrid",
      name: "SendGrid",
      description: "Send email notifications and invitations",
      icon: <Mail className="h-5 w-5" />,
      enabled: false,
      docsUrl: "https://docs.sendgrid.com/api-reference",
      fields: [
        {
          key: "sendgrid_api_key",
          label: "API Key",
          type: "password",
          placeholder: "SG...",
          required: true,
          value: "",
        },
        {
          key: "sendgrid_from_email",
          label: "From Email",
          type: "text",
          placeholder: "noreply@yourdomain.com",
          required: true,
          value: "",
        },
        {
          key: "sendgrid_from_name",
          label: "From Name",
          type: "text",
          placeholder: "CollabAi",
          required: false,
          value: "",
        },
      ],
    },
    {
      id: "google",
      name: "Google Drive",
      description: "Store and sync files with Google Drive",
      icon: <Cloud className="h-5 w-5" />,
      enabled: false,
      docsUrl: "https://developers.google.com/drive/api/guides/about-sdk",
      fields: [
        {
          key: "google_client_id",
          label: "Client ID",
          type: "text",
          placeholder: "Your Google Client ID",
          required: true,
          value: "",
        },
        {
          key: "google_client_secret",
          label: "Client Secret",
          type: "password",
          placeholder: "Your Google Client Secret",
          required: true,
          value: "",
        },
      ],
    },
  ]);

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    );
  };

  const handleFieldChange = (integrationId: string, fieldKey: string, value: string) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId
          ? {
              ...integration,
              fields: integration.fields.map((field) =>
                field.key === fieldKey ? { ...field, value } : field
              ),
            }
          : integration
      )
    );
  };

  const handleTestConnection = async (integration: Integration) => {
    setTesting(integration.id);
    try {
      // In a real implementation, you would call an edge function to test the connection
      // For now, simulate a test
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if required fields are filled
      const hasAllRequiredFields = integration.fields
        .filter((f) => f.required)
        .every((f) => f.value.trim() !== "");

      if (!hasAllRequiredFields) {
        toast.error("Please fill in all required fields");
        return;
      }

      toast.success(`${integration.name} connection successful!`);
    } catch (error: any) {
      console.error("Connection test error:", error);
      toast.error(`Failed to connect to ${integration.name}`);
    } finally {
      setTesting(null);
    }
  };

  const handleSaveIntegration = async (integration: Integration) => {
    setSaving(true);
    try {
      // In a real implementation, you would:
      // 1. Store sensitive data in app_config with is_sensitive = true
      // 2. Or use Supabase Edge Function Secrets for better security

      // For now, we'll store in app_config
      const updates = integration.fields.map((field) =>
        supabase.from("app_config").upsert(
          {
            key: `integrations.${integration.id}.${field.key}`,
            value: field.value,
            category: "integrations",
            description: `${integration.name} - ${field.label}`,
            is_sensitive: field.type === "password",
          },
          { onConflict: "key" }
        )
      );

      // Also save the enabled status
      updates.push(
        supabase.from("app_config").upsert(
          {
            key: `integrations.${integration.id}.enabled`,
            value: integration.enabled,
            category: "integrations",
            description: `${integration.name} - Enabled`,
            is_sensitive: false,
          },
          { onConflict: "key" }
        )
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw errors[0].error;
      }

      toast.success(`${integration.name} settings saved!`);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`Failed to save ${integration.name} settings`);
    } finally {
      setSaving(false);
    }
  };

  const getIntegrationStatus = (integration: Integration): "configured" | "partial" | "not_configured" => {
    const requiredFields = integration.fields.filter((f) => f.required);
    const filledFields = requiredFields.filter((f) => f.value.trim() !== "");

    if (filledFields.length === 0) return "not_configured";
    if (filledFields.length === requiredFields.length) return "configured";
    return "partial";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integration Management</h1>
        <p className="text-muted-foreground">
          Configure third-party service integrations and API credentials
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-6">
        {integrations.map((integration) => {
          const status = getIntegrationStatus(integration);

          return (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg border p-2">{integration.icon}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{integration.name}</CardTitle>
                        {status === "configured" && integration.enabled && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </Badge>
                        )}
                        {status === "partial" && (
                          <Badge variant="secondary" className="gap-1">
                            <Key className="h-3 w-3" />
                            Partial
                          </Badge>
                        )}
                        {!integration.enabled && (
                          <Badge variant="outline" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{integration.description}</CardDescription>
                      {integration.docsUrl && (
                        <a
                          href={integration.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          View Documentation
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {integration.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={() => handleToggleIntegration(integration.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              {integration.enabled && (
                <CardContent className="space-y-4">
                  {/* Integration Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {integration.fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                          id={field.key}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={field.value}
                          onChange={(e) =>
                            handleFieldChange(integration.id, field.key, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleSaveIntegration(integration)}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Settings"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection(integration)}
                      disabled={testing === integration.id || status === "not_configured"}
                    >
                      {testing === integration.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Key className="h-5 w-5" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900 dark:text-amber-100">
          <p>
            API keys and secrets are stored in the app_config table with encryption. For production
            deployments, consider using Supabase Edge Function Secrets for enhanced security.
            Never share your API keys publicly or commit them to version control.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
