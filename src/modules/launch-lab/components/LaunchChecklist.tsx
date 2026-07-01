import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ChecklistStep {
  id: string;
  label: string;
}

interface LaunchChecklistProps {
  steps: ChecklistStep[];
  checked: string[];
  onToggle: (id: string) => void;
}

export function LaunchChecklist({ steps, checked, onToggle }: LaunchChecklistProps) {
  if (!steps?.length) return null;

  const done = steps.filter((s) => checked.includes(s.id)).length;
  const pct = Math.round((done / steps.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Launch checklist</CardTitle>
        <span className="text-xs text-muted-foreground">
          {done}/{steps.length} · {pct}%
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="h-1.5 rounded-full bg-muted mb-3 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        {steps.map((step) => {
          const isChecked = checked.includes(step.id);
          return (
            <label
              key={step.id}
              className={cn(
                "flex items-start gap-3 rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors",
                isChecked && "opacity-60",
              )}
            >
              <Checkbox checked={isChecked} onCheckedChange={() => onToggle(step.id)} className="mt-0.5" />
              <span className={cn("text-sm flex-1", isChecked && "line-through")}>{step.label}</span>
              {isChecked ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
}
