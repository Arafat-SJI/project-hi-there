import type { CanvasNote } from "../types";
import { CLUSTER_META } from "../constants";
import { cn } from "@/lib/utils";

type ClusterKey = keyof typeof CLUSTER_META;

interface StickyClusterProps {
  clusterKey: ClusterKey;
  notes: CanvasNote[];
  className?: string;
}

export function StickyCluster({ clusterKey, notes, className }: StickyClusterProps) {
  const meta = CLUSTER_META[clusterKey];

  return (
    <div className={cn("flex flex-col gap-2 min-h-[200px]", className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-1.5">
        <span>{meta.emoji}</span>
        {meta.label}
        <span className="text-foreground">({notes.length})</span>
      </h3>
      <div
        className={cn(
          "flex flex-col gap-2 flex-1 rounded-xl p-2 bg-gradient-to-b",
          meta.header,
          "to-transparent",
        )}
      >
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground italic p-3 rounded-lg border border-dashed">
            No items yet
          </p>
        ) : (
          notes.map((note, index) => (
            <div
              key={note.id}
              className={cn(
                "rounded-lg border p-3 shadow-sm animate-in fade-in slide-in-from-bottom-2",
                meta.color,
              )}
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
            >
              <p className="font-medium text-sm">{note.title}</p>
              {note.detail ? (
                <p className="text-xs text-muted-foreground mt-1">{note.detail}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
