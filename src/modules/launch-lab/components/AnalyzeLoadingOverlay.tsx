import { Loader2, Sparkles } from "lucide-react";

interface AnalyzeLoadingOverlayProps {
  message?: string;
}

export function AnalyzeLoadingOverlay({ message = "Gemini is analyzing your pitch…" }: AnalyzeLoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center space-y-4 p-8 rounded-2xl border bg-card shadow-xl max-w-sm mx-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="font-medium">{message}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Scoring clarity, market fit, traction…
        </div>
      </div>
    </div>
  );
}
