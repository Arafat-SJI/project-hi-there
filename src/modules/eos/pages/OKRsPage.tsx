/**
 * OKRs Page
 *
 * Lists OKRs with filter/search support, tabbed views for different
 * visualizations (cards, health grid, by-pod, by-owner, closed), and
 * creation/close dialogs.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Search } from "lucide-react";
import { useOKRs, useUpdateOKR } from "../hooks/useOKRs";
import { useEOSPods } from "../hooks/useEOSPods";
import { OKRCard } from "../components/okr/OKRCard";
import { CreateOKRDialog } from "../components/okr/CreateOKRDialog";
import { OKRHealthGrid } from "../components/okr/OKRHealthGrid";
import { TeamOKRsByPod } from "../components/okr/TeamOKRsByPod";
import { KeyResultsByOwner } from "../components/okr/KeyResultsByOwner";
import { ClosedOKRsTable } from "../components/okr/ClosedOKRsTable";
import { CloseOKRDialog } from "../components/okr/CloseOKRDialog";
import { OKRDetailDialog } from "./OKRDetailDialog";
import type { OKRFilters, OKR } from "../types";

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

type ViewTab = "cards" | "health" | "by-pod" | "by-owner" | "closed";

export default function OKRsPage() {
  const [filters, setFilters] = useState<OKRFilters>({ quarter: getCurrentQuarter() });
  const [viewTab, setViewTab] = useState<ViewTab>("cards");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOKR, setSelectedOKR] = useState<OKR | null>(null);
  const [closingOKR, setClosingOKR] = useState<OKR | null>(null);

  const { data: okrs, isLoading } = useOKRs(filters);
  const { data: pods } = useEOSPods();
  const updateOKR = useUpdateOKR();

  const handleCloseOKR = (data: { status: "completed" | "closed"; notes?: string }) => {
    if (!closingOKR) return;
    updateOKR.mutate(
      { id: closingOKR.id, data: { status: data.status } as any },
      { onSuccess: () => setClosingOKR(null) },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">OKRs</h1>
          <p className="text-muted-foreground">Objectives & Key Results</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create OKR
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search OKRs..."
            className="pl-9"
            value={filters.search || ""}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value || undefined })
            }
          />
        </div>
        <Select
          value={filters.quarter || "all"}
          onValueChange={(v) =>
            setFilters({ ...filters, quarter: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quarters</SelectItem>
            {(() => {
              const now = new Date();
              const year = now.getFullYear();
              const items: { label: string; value: string }[] = [];
              for (let y = year; y <= year + 1; y++) {
                for (let q = 1; q <= 4; q++) {
                  items.push({ label: `Q${q} ${y}`, value: `Q${q} ${y}` });
                }
              }
              return items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ));
            })()}
          </SelectContent>
        </Select>
        <Select
          value={filters.status || "all"}
          onValueChange={(v) =>
            setFilters({ ...filters, status: v === "all" ? undefined : (v as any) })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_track">On Track</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="behind">Behind</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabbed Views */}
      <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)}>
        <TabsList>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="by-pod">By Pod</TabsTrigger>
          <TabsTrigger value="by-owner">By Owner</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Cards Tab (original view) */}
            <TabsContent value="cards">
              {okrs && okrs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {okrs.map((okr) => (
                    <OKRCard key={okr.id} okr={okr} onClick={() => setSelectedOKR(okr)} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p className="text-lg font-medium">No OKRs found</p>
                  <p className="text-sm mb-4">
                    Create your first OKR to start tracking objectives.
                  </p>
                  <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create OKR
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Health Grid Tab */}
            <TabsContent value="health">
              {okrs && okrs.length > 0 ? (
                <OKRHealthGrid okrs={okrs} />
              ) : (
                <p className="text-center py-12 text-muted-foreground">
                  No OKRs to display.
                </p>
              )}
            </TabsContent>

            {/* By Pod Tab */}
            <TabsContent value="by-pod">
              {okrs && okrs.length > 0 ? (
                <TeamOKRsByPod okrs={okrs} pods={pods || []} />
              ) : (
                <p className="text-center py-12 text-muted-foreground">
                  No OKRs to display.
                </p>
              )}
            </TabsContent>

            {/* By Owner Tab */}
            <TabsContent value="by-owner">
              {okrs && okrs.length > 0 ? (
                (() => {
                  const allKeyResults = okrs.flatMap(
                    (okr) => (okr as any).key_results || [],
                  );
                  return allKeyResults.length > 0 ? (
                    <KeyResultsByOwner keyResults={allKeyResults} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <p className="text-lg font-medium">
                        Key results not available in list view
                      </p>
                      <p className="text-sm">
                        Key results are fetched per-OKR. Open an individual OKR to
                        see its key results and owner breakdown.
                      </p>
                    </div>
                  );
                })()
              ) : (
                <p className="text-center py-12 text-muted-foreground">
                  No OKRs to display.
                </p>
              )}
            </TabsContent>

            {/* Closed Tab */}
            <TabsContent value="closed">
              <ClosedOKRsTable okrs={okrs || []} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Dialogs */}
      <CreateOKRDialog open={showCreate} onOpenChange={setShowCreate} />
      {selectedOKR && (
        <OKRDetailDialog
          open={!!selectedOKR}
          onOpenChange={(open) => !open && setSelectedOKR(null)}
          okrId={selectedOKR.id}
        />
      )}
      {closingOKR && (
        <CloseOKRDialog
          okr={closingOKR}
          open={!!closingOKR}
          onOpenChange={(open) => !open && setClosingOKR(null)}
          onClose={handleCloseOKR}
          isClosing={updateOKR.isPending}
        />
      )}
    </div>
  );
}
