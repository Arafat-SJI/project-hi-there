import { Download, FileText, History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadMarkdown, buildLaunchLabMarkdown } from "../lib/export-launch-lab";
import type { LaunchLabSessionState } from "../types";

interface LaunchLabToolbarProps {
  session: LaunchLabSessionState;
  onReset: () => void;
  onOpenHistory: () => void;
  onSaveHistory: () => void;
}

export function LaunchLabToolbar({ session, onReset, onOpenHistory, onSaveHistory }: LaunchLabToolbarProps) {
  const exportMd = () => {
    const md = buildLaunchLabMarkdown(session);
    const name = session.context.productName || "launch-lab";
    downloadMarkdown(md, `${name.toLowerCase().replace(/\s+/g, "-")}-export.md`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onOpenHistory}>
        <History className="h-3.5 w-3.5 mr-1.5" />
        History
      </Button>
      <Button variant="outline" size="sm" onClick={onSaveHistory}>
        <FileText className="h-3.5 w-3.5 mr-1.5" />
        Save session
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportMd}>Download Markdown</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
        Reset
      </Button>
    </div>
  );
}
