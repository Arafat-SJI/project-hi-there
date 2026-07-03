import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { LaunchLabStep } from "../types";

interface LaunchLabStepperProps {
  step: LaunchLabStep;
  canAccessStep2: boolean;
  canAccessStep3: boolean;
  canAccessStep4: boolean;
  onStepClick?: (step: LaunchLabStep) => void;
}

const STEPS = [
  { id: 1 as const, title: "Idea Coach", description: "Score & refine your input" },
  { id: 2 as const, title: "Idea Canvas", description: "Build your launch plan" },
  { id: 3 as const, title: "Launch Command", description: "Graphical launch overview" },
  { id: 4 as const, title: "Complete", description: "Finished & share" },
];

export function LaunchLabStepper({
  step,
  canAccessStep2,
  canAccessStep3,
  canAccessStep4,
  onStepClick,
}: LaunchLabStepperProps) {
  const canAccess = (target: LaunchLabStep) => {
    if (target === 1) return true;
    if (target === 2) return canAccessStep2;
    if (target === 3) return canAccessStep3;
    return canAccessStep4;
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 sm:gap-2 mb-2">
        {STEPS.map((s, index) => {
          const isComplete = step > s.id;
          const isActive = step === s.id;
          const isLocked = !canAccess(s.id) && step < s.id;
          const isClickable = !!onStepClick && canAccess(s.id) && !isActive;

          return (
            <div key={s.id} className="flex flex-1 items-center gap-1 sm:gap-2 min-w-0">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(s.id)}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isActive && !isComplete && "border-primary bg-primary/10 text-primary",
                  !isActive && !isComplete && "border-muted-foreground/30 text-muted-foreground",
                  isLocked && "opacity-50",
                  isClickable && "hover:border-primary/70 cursor-pointer",
                  !isClickable && "cursor-default",
                )}
                aria-label={`Go to ${s.title}`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : s.id}
              </button>
              <div className="min-w-0 hidden xl:block">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{s.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 sm:mx-2 rounded min-w-[8px]",
                    step > s.id ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground xl:hidden">
        Step {step} of 4 — {STEPS[step - 1].title}
      </p>
    </div>
  );
}
