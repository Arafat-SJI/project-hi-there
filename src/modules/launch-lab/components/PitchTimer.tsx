import { useState, useEffect, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [30, 60, 90, 120];

export function PitchTimer() {
  const [seconds, setSeconds] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(seconds);
  }, [seconds]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const urgent = remaining <= 10 && running;

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          Pitch timer
        </span>
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setSeconds(p);
                setRemaining(p);
                setRunning(false);
              }}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                seconds === p ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
              )}
            >
              {p}s
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "text-3xl font-mono font-bold tabular-nums w-16",
            urgent && "text-red-500 animate-pulse",
          )}
        >
          {remaining}s
        </div>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full transition-all duration-1000", urgent ? "bg-red-500" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setRunning(!running)}>
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
