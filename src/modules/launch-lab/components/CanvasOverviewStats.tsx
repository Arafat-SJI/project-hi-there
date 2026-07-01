import { StickyNote, Layers, Target } from "lucide-react";
import type { IdeaCanvasResult } from "../types";

interface CanvasOverviewStatsProps {
  canvas: IdeaCanvasResult;
}

export function CanvasOverviewStats({ canvas }: CanvasOverviewStatsProps) {
  const clusters = canvas.clusters;
  const noteCount =
    (clusters?.problems?.length ?? 0) +
    (clusters?.ideas?.length ?? 0) +
    (clusters?.risks?.length ?? 0) +
    (clusters?.next_steps?.length ?? 0);
  const clusterCount = 4;
  const kpiCount = canvas.kpis?.length ?? 0;

  const stats = [
    { icon: StickyNote, label: "Sticky notes", value: noteCount, color: "text-amber-500" },
    { icon: Layers, label: "Clusters", value: clusterCount, color: "text-violet-500" },
    { icon: Target, label: "KPIs", value: kpiCount, color: "text-blue-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="rounded-xl border bg-card p-3 text-center">
          <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
          <p className="text-xl font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        </div>
      ))}
    </div>
  );
}
