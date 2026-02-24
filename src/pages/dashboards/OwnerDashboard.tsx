import { HealthMetricsCard } from "@/components/dashboards/HealthMetricsCard";
import { MeetingsThisWeekCard } from "@/components/dashboards/MeetingsThisWeekCard";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Owner Dashboard — for agency owners without EOS.
 * Sprint 1: Health Metrics + Meetings This Week.
 * Sprint 2: Watch List card will be added here.
 * Sprint 3: AI Digest card will be added here.
 */
export default function OwnerDashboard() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good {getTimeOfDay()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">Here's your agency overview.</p>
      </div>

      {/* Row 1: Health metrics (spans full width) */}
      <HealthMetricsCard />

      {/* Row 2: Meetings + placeholder for Watch List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MeetingsThisWeekCard />
        {/* Watch List card will be added in Sprint 2 */}
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Watch List — coming in Sprint 2</p>
        </div>
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
