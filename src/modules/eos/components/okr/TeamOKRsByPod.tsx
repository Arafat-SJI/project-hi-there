/**
 * Team OKRs By Pod
 *
 * Groups OKRs by pod with collapsible sections, displaying each OKR's
 * status, progress, and owner under its pod header.
 */

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import type { OKR, EOSPod, OKRStatus } from "../../types";

const statusColors: Record<OKRStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-800",
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-amber-100 text-amber-800",
  behind: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

interface PodSection {
  pod: EOSPod | null;
  label: string;
  color: string;
  okrs: OKR[];
}

interface TeamOKRsByPodProps {
  okrs: OKR[];
  pods: EOSPod[];
}

export function TeamOKRsByPod({ okrs, pods }: TeamOKRsByPodProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(pods.map((p) => p.id).concat(["unassigned"]))
  );

  const sections = useMemo(() => {
    const podMap = new Map<string, EOSPod>();
    for (const pod of pods) {
      podMap.set(pod.id, pod);
    }

    const grouped = new Map<string, OKR[]>();
    const unassigned: OKR[] = [];

    for (const okr of okrs) {
      if (okr.pod_id && podMap.has(okr.pod_id)) {
        const existing = grouped.get(okr.pod_id);
        if (existing) {
          existing.push(okr);
        } else {
          grouped.set(okr.pod_id, [okr]);
        }
      } else {
        unassigned.push(okr);
      }
    }

    const result: PodSection[] = pods
      .filter((pod) => pod.is_active)
      .map((pod) => ({
        pod,
        label: pod.name,
        color: pod.color,
        okrs: grouped.get(pod.id) || [],
      }));

    if (unassigned.length > 0) {
      result.push({
        pod: null,
        label: "Unassigned",
        color: "#94a3b8",
        okrs: unassigned,
      });
    }

    return result;
  }, [okrs, pods]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Layers className="h-8 w-8 mb-2" />
        <p>No OKRs to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const sectionId = section.pod?.id || "unassigned";
        const isOpen = expandedSections.has(sectionId);

        return (
          <Collapsible
            key={sectionId}
            open={isOpen}
            onOpenChange={() => toggleSection(sectionId)}
          >
            <div className="rounded-lg border">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-4 py-3 h-auto hover:bg-muted/50"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  <span
                    className="inline-block h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: section.color }}
                  />
                  <span className="font-medium text-sm">{section.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {section.okrs.length}{" "}
                    {section.okrs.length === 1 ? "OKR" : "OKRs"}
                  </span>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                {section.okrs.length === 0 ? (
                  <div className="px-4 pb-3 text-sm text-muted-foreground">
                    No OKRs assigned to this pod
                  </div>
                ) : (
                  <div className="px-4 pb-3 space-y-3">
                    {section.okrs.map((okr) => (
                      <div
                        key={okr.id}
                        className="flex items-center gap-3 rounded-md border p-3"
                      >
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium truncate">
                              {okr.title}
                            </p>
                            <Badge
                              variant="secondary"
                              className={`shrink-0 ${statusColors[okr.status] || ""}`}
                            >
                              {okr.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={okr.progress}
                              className="h-1.5 flex-1"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {Math.round(okr.progress)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {okr.owner?.full_name || "No owner"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
