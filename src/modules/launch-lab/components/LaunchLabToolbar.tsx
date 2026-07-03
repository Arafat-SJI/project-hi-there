import { useState } from "react";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadLaunchLabPdf, getExportableSteps } from "../lib/export-launch-lab-pdf";
import type { LaunchLabSessionState } from "../types";

interface LaunchLabToolbarProps {
  session: LaunchLabSessionState;
  onReset: () => void;
}

export function LaunchLabToolbar({ session, onReset }: LaunchLabToolbarProps) {
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    const steps = getExportableSteps(session);
    if (steps.length === 0) {
      toast.error("Nothing to export yet — analyze your pitch in Idea Coach first.");
      return;
    }

    setExporting(true);
    try {
      await downloadLaunchLabPdf(session);
      toast.success("PDF downloaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not export PDF";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={exportPdf}
        disabled={exporting}
      >
        {exporting ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5 mr-1.5" />
        )}
        Export PDF
      </Button>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8">
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
        Reset
      </Button>
    </div>
  );
}
