import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { LaunchLabStep } from "../types";

interface LaunchLabStepperProps {
  step: LaunchLabStep;
  canAccessStep2: boolean;
}

const STEPS = [
  { id: 1 as const, title: "Pitch Coach", description: "Score & refine your pitch" },
  { id: 2 as const, title: "Idea Canvas", description: "Build your launch plan" },
];

export function LaunchLabStepper({ step, canAccessStep2 }: LaunchLabStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        {STEPS.map((s, index) => {
          const isComplete = step > s.id;
          const isActive = step === s.id;
          const isLocked = s.id === 2 && !canAccessStep2 && step < 2;

          return (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isActive && !isComplete && "border-primary bg-primary/10 text-primary",
                  !isActive && !isComplete && "border-muted-foreground/30 text-muted-foreground",
                  isLocked && "opacity-50",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <div className="min-w-0 hidden sm:block">
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
                    "h-0.5 flex-1 mx-2 rounded",
                    step > s.id ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground sm:hidden">
        Step {step} of 2 — {STEPS[step - 1].title}
      </p>
    </div>
  );
}
