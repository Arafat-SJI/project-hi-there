import { useSearchParams } from "react-router-dom";
import { KnowledgeHealthSection } from "@/components/knowledge/dashboard/KnowledgeHealthSection";
import { KnowledgeAnalyticsSection } from "@/components/knowledge/dashboard/KnowledgeAnalyticsSection";
import { UsageInsightsSection } from "@/components/knowledge/dashboard/UsageInsightsSection";
import { SyncStatusSection } from "@/components/knowledge/dashboard/SyncStatusSection";
import { SourceOverviewSection } from "@/components/knowledge/dashboard/SourceOverviewSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  BarChart3,
  Search,
  RefreshCw,
  Database,
} from "lucide-react";

const TABS = [
  { value: "health", label: "Health", icon: LayoutDashboard },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "usage", label: "Usage Insights", icon: Search },
  { value: "sync", label: "Sync Status", icon: RefreshCw },
  { value: "sources", label: "Sources", icon: Database },
] as const;

const TAB_VALUES = new Set(TABS.map((t) => t.value));
const DEFAULT_TAB = "health";

export default function KnowledgeDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") ?? DEFAULT_TAB;
  const activeTab = TAB_VALUES.has(tabParam as (typeof TABS)[number]["value"])
    ? tabParam
    : DEFAULT_TAB;

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Knowledge Base Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Command center for analytics, usage insights, sync health, and source overview
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="health" className="mt-6">
          <KnowledgeHealthSection />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <KnowledgeAnalyticsSection />
        </TabsContent>
        <TabsContent value="usage" className="mt-6">
          <UsageInsightsSection />
        </TabsContent>
        <TabsContent value="sync" className="mt-6">
          <SyncStatusSection />
        </TabsContent>
        <TabsContent value="sources" className="mt-6">
          <SourceOverviewSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
