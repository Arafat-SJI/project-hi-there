/**
 * DataSourceBadge - Shows where a record originated (HubSpot, Salesforce, manual, etc.)
 * Variants: inline (table rows), card (detail pages), minimal (icon only)
 */

import { ExternalLink, Database, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export type DataSourceProvider = "manual" | "hubspot" | "salesforce" | "zoho" | "pipedrive" | "freshsales" | string;

interface DataSourceBadgeProps {
  source?: string | null;
  externalUrl?: string | null;
  lastSyncedAt?: string | null;
  variant?: "inline" | "card" | "minimal";
  className?: string;
}

const PROVIDER_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  hubspot: { label: "HubSpot", color: "hsl(16, 100%, 50%)", icon: "🟠" },
  salesforce: { label: "Salesforce", color: "hsl(210, 100%, 56%)", icon: "☁️" },
  zoho: { label: "Zoho", color: "hsl(4, 90%, 58%)", icon: "🔴" },
  pipedrive: { label: "Pipedrive", color: "hsl(145, 63%, 42%)", icon: "🟢" },
  freshsales: { label: "Freshsales", color: "hsl(199, 89%, 48%)", icon: "🔵" },
  manual: { label: "Manual", color: "hsl(var(--muted-foreground))", icon: "" },
};

function getProviderConfig(source: string) {
  return PROVIDER_CONFIG[source] ?? { label: source, color: "hsl(var(--muted-foreground))", icon: "🔗" };
}

export function DataSourceBadge({ source, externalUrl, lastSyncedAt, variant = "inline", className = "" }: DataSourceBadgeProps) {
  const normalizedSource = (source || "manual").toLowerCase();

  // Don't show anything for manual records in inline/minimal mode
  if (normalizedSource === "manual" && variant !== "card") return null;

  const config = getProviderConfig(normalizedSource);
  const syncTimeAgo = lastSyncedAt ? formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true }) : null;

  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`text-xs ${className}`}>{config.icon}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>From {config.label}</p>
            {syncTimeAgo && <p className="text-xs text-muted-foreground">Synced {syncTimeAgo}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "card") {
    return (
      <div className={`flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 ${className}`}>
        {normalizedSource === "manual" ? (
          <Database className="h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="text-lg">{config.icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {normalizedSource === "manual" ? "Created in Control Tower" : `Synced from ${config.label}`}
          </p>
          {syncTimeAgo && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Last synced {syncTimeAgo}
            </p>
          )}
          {normalizedSource !== "manual" && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Edits here won't push back to {config.label}
            </p>
          )}
        </div>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            View in {config.label}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  // inline variant (for table rows)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 text-xs font-normal cursor-default ${className}`}
            style={{ borderColor: config.color, color: config.color }}
            onClick={(e) => {
              if (externalUrl) {
                e.stopPropagation();
                window.open(externalUrl, "_blank");
              }
            }}
          >
            <span>{config.icon}</span>
            {config.label}
            {externalUrl && <ExternalLink className="h-2.5 w-2.5" />}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>From {config.label}</p>
          {syncTimeAgo && <p className="text-xs">Synced {syncTimeAgo}</p>}
          {externalUrl && <p className="text-xs">Click to open in {config.label}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
