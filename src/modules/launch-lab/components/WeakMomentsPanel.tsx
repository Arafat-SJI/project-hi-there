import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PitchWeakMoment } from "../types";

interface WeakMomentsPanelProps {
  moments: PitchWeakMoment[];
}

export function WeakMomentsPanel({ moments }: WeakMomentsPanelProps) {
  if (!moments?.length) return null;

  return (
    <Card className="border-amber-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Weak moments to fix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {moments.map((m, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2 bg-amber-500/5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium italic">&ldquo;{m.excerpt}&rdquo;</p>
              <Badge variant="outline" className="shrink-0 text-amber-600 border-amber-500/40">
                {m.severity || "medium"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{m.issue}</p>
            {m.suggestion && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                <span className="font-medium">Fix:</span> {m.suggestion}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
