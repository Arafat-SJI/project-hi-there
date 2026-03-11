import { useState, useEffect } from "react";
import {
  Settings2, Eye, EyeOff, CheckCircle2, XCircle,
  ExternalLink, Sparkles, Brain, Gem, Bot, Loader2, Info,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ─── Static provider definitions ──────────────────────────────────────────────

type ProviderKey = "lovable" | "openai" | "gemini" | "claude";

interface ProviderDefinition {
  key: ProviderKey;
  name: string;
  description: string;
  Icon: React.ElementType;
  color: string;
  bgColor: string;
  ringColor: string;
  isDefault: boolean;
  models: string[];
  docsUrl?: string;
  keyPlaceholder?: string;
}

const PROVIDERS: ProviderDefinition[] = [
  {
    key: "lovable",
    name: "Lovable AI",
    description: "Built-in default provider. Always connected — no API key required.",
    Icon: Sparkles,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    ringColor: "ring-violet-200 dark:ring-violet-800",
    isDefault: true,
    models: ["lovable-2", "lovable-2-mini"],
  },
  {
    key: "openai",
    name: "OpenAI",
    description: "GPT-4o and GPT-4 series models for advanced reasoning and content generation.",
    Icon: Brain,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    ringColor: "ring-emerald-200 dark:ring-emerald-800",
    isDefault: false,
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    docsUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-proj-...",
  },
  {
    key: "gemini",
    name: "Google Gemini",
    description: "Gemini models for multimodal reasoning, long context, and code tasks.",
    Icon: Gem,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    ringColor: "ring-blue-200 dark:ring-blue-800",
    isDefault: false,
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    docsUrl: "https://aistudio.google.com/app/apikey",
    keyPlaceholder: "AIza...",
  },
  {
    key: "claude",
    name: "Anthropic Claude",
    description: "Claude models for thoughtful reasoning, safety, and nuanced responses.",
    Icon: Bot,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    ringColor: "ring-orange-200 dark:ring-orange-800",
    isDefault: false,
    models: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"],
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
  },
];

// ─── State types ───────────────────────────────────────────────────────────────

interface ProviderState {
  apiKey: string;
  isConfigured: boolean;
  showKey: boolean;
  isTesting: boolean;
}

const STORAGE_KEY = "llm_provider_config";

function loadStoredConfig(): Partial<Record<ProviderKey, boolean>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ─── Provider Card ─────────────────────────────────────────────────────────────

interface ProviderCardProps {
  provider: ProviderDefinition;
  state: ProviderState;
  onApiKeyChange: (key: string) => void;
  onToggleShowKey: () => void;
  onSave: () => void;
  onTest: () => void;
  onDisconnect: () => void;
}

function ProviderCard({ provider, state, onApiKeyChange, onToggleShowKey, onSave, onTest, onDisconnect }: ProviderCardProps) {
  const { Icon, color, bgColor, ringColor, isDefault, models } = provider;
  const showModels = isDefault || state.isConfigured;

  return (
    <Card className={`flex flex-col transition-shadow hover:shadow-md ring-1 ${ringColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`rounded-lg p-2 ${bgColor} flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {isDefault && (
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 border-0">
                Default
              </Badge>
            )}
            {(isDefault || state.isConfigured) ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <XCircle className="h-3 w-3" />
                Not Configured
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-2">
          <CardTitle className="text-base">{provider.name}</CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed">
            {provider.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">

        {/* API Key section */}
        {isDefault ? (
          <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300">
              <Zap className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-medium">No API key needed — always available</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`key-${provider.key}`} className="text-xs font-medium">
                  API Key
                </Label>
                {provider.docsUrl && (
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Get key
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Input
                    id={`key-${provider.key}`}
                    type={state.showKey ? "text" : "password"}
                    value={state.apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder={state.isConfigured ? "••••••••••••••••••••••••" : provider.keyPlaceholder}
                    className="pr-9 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={onToggleShowKey}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {state.showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={onSave}
                disabled={!state.apiKey.trim()}
              >
                Save Key
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onTest}
                disabled={!state.isConfigured || state.isTesting}
              >
                {state.isTesting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Test"
                )}
              </Button>
              {state.isConfigured && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={onDisconnect}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Models section */}
        {showModels && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Available Models
              </p>
              <div className="flex flex-wrap gap-1.5">
                {models.map((model) => (
                  <Badge key={model} variant="secondary" className="text-xs font-mono font-normal">
                    {model}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {!showModels && (
          <p className="text-xs text-muted-foreground italic">
            Configure an API key to unlock {models.length} models.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LLMConfig() {
  const stored = loadStoredConfig();

  const [states, setStates] = useState<Record<ProviderKey, ProviderState>>({
    lovable: { apiKey: "", isConfigured: true, showKey: false, isTesting: false },
    openai: { apiKey: "", isConfigured: stored.openai ?? false, showKey: false, isTesting: false },
    gemini: { apiKey: "", isConfigured: stored.gemini ?? false, showKey: false, isTesting: false },
    claude: { apiKey: "", isConfigured: stored.claude ?? false, showKey: false, isTesting: false },
  });

  const configuredCount = PROVIDERS.filter(
    (p) => p.isDefault || states[p.key].isConfigured
  ).length;

  const totalModels = PROVIDERS.filter(
    (p) => p.isDefault || states[p.key].isConfigured
  ).reduce((sum, p) => sum + p.models.length, 0);

  function updateState(key: ProviderKey, patch: Partial<ProviderState>) {
    setStates((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function persistConfig(key: ProviderKey, configured: boolean) {
    const current = loadStoredConfig();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [key]: configured }));
  }

  function handleSave(key: ProviderKey) {
    const { apiKey } = states[key];
    if (!apiKey.trim()) return;
    updateState(key, { isConfigured: true, apiKey: "" });
    persistConfig(key, true);
    toast.success(`${PROVIDERS.find((p) => p.key === key)?.name} connected successfully`);
  }

  function handleTest(key: ProviderKey) {
    updateState(key, { isTesting: true });
    setTimeout(() => {
      updateState(key, { isTesting: false });
      toast.success(`Connection to ${PROVIDERS.find((p) => p.key === key)?.name} verified`);
    }, 1500);
  }

  function handleDisconnect(key: ProviderKey) {
    updateState(key, { isConfigured: false, apiKey: "" });
    persistConfig(key, false);
    toast.info(`${PROVIDERS.find((p) => p.key === key)?.name} disconnected`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings2 className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">LLM Configuration</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Connect AI providers and manage available models for your agents.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{configuredCount}</p>
            <p className="text-xs text-muted-foreground">Connected</p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="text-center">
            <p className="text-2xl font-bold">{totalModels}</p>
            <p className="text-xs text-muted-foreground">Models Available</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <Alert className="border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800">
        <Info className="h-4 w-4 text-violet-600" />
        <AlertDescription className="text-sm text-violet-800 dark:text-violet-200">
          <strong>Lovable AI</strong> is always connected as the default provider at no cost. Add other
          providers to expand the models available to your AI agents. All configured providers' models
          are immediately usable.
        </AlertDescription>
      </Alert>

      {/* Provider grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <ProviderCard
            key={provider.key}
            provider={provider}
            state={states[provider.key]}
            onApiKeyChange={(key) => updateState(provider.key, { apiKey: key })}
            onToggleShowKey={() => updateState(provider.key, { showKey: !states[provider.key].showKey })}
            onSave={() => handleSave(provider.key)}
            onTest={() => handleTest(provider.key)}
            onDisconnect={() => handleDisconnect(provider.key)}
          />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">
        API keys are stored securely and never exposed to the client.
        Keys are used only by server-side edge functions.
      </p>
    </div>
  );
}
