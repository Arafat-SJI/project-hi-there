import { HealthMetricsCard } from "@/components/dashboards/HealthMetricsCard";
import { MeetingsThisWeekCard } from "@/components/dashboards/MeetingsThisWeekCard";
import { WatchListCard } from "@/components/dashboards/WatchListCard";
import { QuickActionsCard } from "@/components/dashboards/QuickActionsCard";
import { DashboardPreferencesSheet } from "@/components/dashboards/DashboardPreferencesSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useIsWidgetEnabled } from "@/hooks/useDashboardWidgets";

/**
 * Owner Dashboard — for agency owners without EOS.
 * Widget visibility respects the admin dashboard_widgets registry.
 */
export default function OwnerDashboard() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const showHealth = useIsWidgetEnabled("health_metrics", "owner");
  const showWatchList = useIsWidgetEnabled("watch_list", "owner");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good {getTimeOfDay()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">Here's your agency overview.</p>
        </div>
        <DashboardPreferencesSheet />
      </div>

      {/* Row 1: Quick actions */}
      <QuickActionsCard />

      {/* Row 2: Health metrics */}
      {showHealth && <HealthMetricsCard />}

      {/* Row 3: Meetings + Watch List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MeetingsThisWeekCard />
        {showWatchList && <WatchListCard />}
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
