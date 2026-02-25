/**
 * OKR Health Grid
 *
 * Grid of cells by pod + company. Each cell shows OKR count by health.
 * Clicking a pod switches to Team tab with that pod; clicking company to Company tab.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Layers } from "lucide-react";
import type { OKR, OKRStatus, EOSPod } from "../../types";

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-800",
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-amber-100 text-amber-800",
  behind: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-700",
  closed: "bg-gray-100 text-gray-600",
};

interface OKRHealthGridProps {
  okrs: OKR[];
  pods?: EOSPod[];
  onSelectPod?: (podId: string | null) => void;
  onSelectCompany?: () => void;
}

export function OKRHealthGrid({
  okrs,
  pods = [],
  onSelectPod,
  onSelectCompany,
}: OKRHealthGridProps) {
  const { byPod, company } = useMemo(() => {
    const byPod = new Map<
      string,
      { pod: EOSPod; okrs: OKR[]; onTrack: number; atRisk: number; total: number }
    >();
    const companyList: OKR[] = [];

    for (const okr of okrs) {
      const type = okr.okr_type || "personal";
      if (type === "company") {
        companyList.push(okr);
        continue;
      }
      if (type === "team" && okr.pod_id) {
        const pod = pods.find((p) => p.id === okr.pod_id);
        const entry = byPod.get(okr.pod_id);
        const onTrack =
          okr.status === "active" || okr.status === "on_track" ? 1 : 0;
        const atRisk =
          okr.status === "at_risk" || okr.status === "behind" ? 1 : 0;
        if (entry) {
          entry.okrs.push(okr);
          entry.onTrack += onTrack;
          entry.atRisk += atRisk;
          entry.total += 1;
        } else {
          byPod.set(okr.pod_id, {
            pod: pod || ({ id: okr.pod_id, name: "Unknown", color: "#94a3b8", is_active: true } as EOSPod),
            okrs: [okr],
            onTrack,
            atRisk,
            total: 1,
          });
        }
      }
    }

    return {
      byPod: Array.from(byPod.values()),
      company: companyList,
    };
  }, [okrs, pods]);

  const companyOnTrack = company.filter(
    (o) => o.status === "active" || o.status === "on_track"
  ).length;
  const companyAtRisk = company.filter(
    (o) => o.status === "at_risk" || o.status === "behind"
  ).length;

  if (byPod.length === 0 && company.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Layers className="h-8 w-8 mb-2" />
        <p>No OKRs to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {company.length > 0 && (
        <Card
          className={
            onSelectCompany
              ? "cursor-pointer hover:shadow-md transition-shadow hover:ring-2 hover:ring-primary/20"
              : ""
          }
          onClick={onSelectCompany}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Company</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{company.length} OKRs</Badge>
              <Badge className="bg-green-100 text-green-800">{companyOnTrack} on track</Badge>
              <Badge className="bg-amber-100 text-amber-800">{companyAtRisk} at risk</Badge>
            </div>
          </CardContent>
        </Card>
      )}
      {byPod.map(({ pod, total, onTrack, atRisk }) => (
        <Card
          key={pod.id}
          className={
            onSelectPod
              ? "cursor-pointer hover:shadow-md transition-shadow hover:ring-2 hover:ring-primary/20"
              : ""
          }
          onClick={() => onSelectPod?.(pod.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: pod.color }}
              />
              <span className="font-medium text-sm">{pod.name}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{total} OKRs</Badge>
              <Badge className="bg-green-100 text-green-800">{onTrack} on track</Badge>
              <Badge className="bg-amber-100 text-amber-800">{atRisk} at risk</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
