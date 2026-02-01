/**
 * OKRs Page
 *
 * Lists OKRs with filter/search support and creation dialog.
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
import { Loader2, Plus, Search } from "lucide-react";
import { useOKRs } from "../hooks/useOKRs";
import { OKRCard } from "../components/okr/OKRCard";
import { CreateOKRDialog } from "../components/okr/CreateOKRDialog";
import { OKRDetailDialog } from "./OKRDetailDialog";
import type { OKRFilters, OKR } from "../types";

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

export default function OKRsPage() {
  const [filters, setFilters] = useState<OKRFilters>({ quarter: getCurrentQuarter() });
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOKR, setSelectedOKR] = useState<OKR | null>(null);
  const { data: okrs, isLoading } = useOKRs(filters);

  return (
    <div className="space-y-6">
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

      {/* OKR Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : okrs && okrs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {okrs.map((okr) => (
            <OKRCard key={okr.id} okr={okr} onClick={() => setSelectedOKR(okr)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No OKRs found</p>
          <p className="text-sm mb-4">Create your first OKR to start tracking objectives.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create OKR
          </Button>
        </div>
      )}

      <CreateOKRDialog open={showCreate} onOpenChange={setShowCreate} />
      {selectedOKR && (
        <OKRDetailDialog
          open={!!selectedOKR}
          onOpenChange={(open) => !open && setSelectedOKR(null)}
          okrId={selectedOKR.id}
        />
      )}
    </div>
  );
}
