import { HealthMetricsCard } from "@/components/dashboards/HealthMetricsCard";
import { MeetingsThisWeekCard } from "@/components/dashboards/MeetingsThisWeekCard";
import { WatchListCard } from "@/components/dashboards/WatchListCard";
import { EOSIssuesCard } from "@/components/dashboards/EOSIssuesCard";
import { EOSRocksCard } from "@/components/dashboards/EOSRocksCard";
import { EOSScorecardCard } from "@/components/dashboards/EOSScorecardCard";
import { AIDigestCard } from "@/components/dashboards/AIDigestCard";
import { QuickActionsCard } from "@/components/dashboards/QuickActionsCard";
import { DashboardPreferencesSheet } from "@/components/dashboards/DashboardPreferencesSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import { useIsWidgetEnabled } from "@/hooks/useDashboardWidgets";

/**
 * Owner Dashboard — EOS variant.
 * Shown when the owner's profile has isEosUser = true.
 *
 * Widget visibility is doubly-gated:
 *   1. Admin-level: dashboard_widgets.is_enabled (via useIsWidgetEnabled)
 *   2. User-level: user_role_preferences.ai_digest_enabled (for ai_digest)
 */
export default function OwnerDashboardWithEOS() {
  const { profile } = useAuth();
  const { preferences } = useDashboardPreferences();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const showHealth = useIsWidgetEnabled("health_metrics", "owner");
  const showWatchList = useIsWidgetEnabled("watch_list", "owner");
  const showAiDigest = useIsWidgetEnabled("ai_digest", "owner");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good {getTimeOfDay()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">Your agency overview with EOS.</p>
        </div>
        <DashboardPreferencesSheet />
      </div>

      {/* Row 1: Quick Actions */}
      <QuickActionsCard />

      {/* Row 2: Agency health */}
      {showHealth && <HealthMetricsCard />}

      {/* Row 3: AI Digest — admin-enabled AND user-enabled */}
      {showAiDigest && preferences.ai_digest_enabled && <AIDigestCard />}

      {/* Row 4: Watch List + Meetings */}
      <div className="grid gap-6 lg:grid-cols-2">
        {showWatchList && <WatchListCard />}
        <MeetingsThisWeekCard />
      </div>

      {/* Row 5: EOS Scorecard + Issues + Rocks */}
      <div className="grid gap-6 lg:grid-cols-3">
        <EOSScorecardCard />
        <EOSIssuesCard />
        <EOSRocksCard />
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
