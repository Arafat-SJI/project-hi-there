import { HealthMetricsCard } from "@/components/dashboards/HealthMetricsCard";
import { MeetingsThisWeekCard } from "@/components/dashboards/MeetingsThisWeekCard";
import { WatchListCard } from "@/components/dashboards/WatchListCard";
import { EOSIssuesCard } from "@/components/dashboards/EOSIssuesCard";
import { EOSRocksCard } from "@/components/dashboards/EOSRocksCard";
import { EOSScorecardCard } from "@/components/dashboards/EOSScorecardCard";
import { AIDigestCard } from "@/components/dashboards/AIDigestCard";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Owner Dashboard — EOS variant.
 * Shown when the owner's profile has isEosUser = true.
 *
 * Layout:
 *   Row 1: Health Metrics (full width)
 *   Row 2: AI Digest (full width)
 *   Row 3: Watch List | Meetings This Week
 *   Row 4: EOS Issues | EOS Rocks/OKRs | EOS Scorecard
 */
export default function OwnerDashboardWithEOS() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good {getTimeOfDay()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">Your agency overview with EOS.</p>
      </div>

      {/* Row 1: Agency health */}
      <HealthMetricsCard />

      {/* Row 2: AI Digest (full width) */}
      <AIDigestCard />

      {/* Row 3: Watch List + Meetings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WatchListCard />
        <MeetingsThisWeekCard />
      </div>

      {/* Row 4: EOS Scorecard + Issues + Rocks */}
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
