import { Download, RotateCcw } from "lucide-react";
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
}

export function LaunchLabToolbar({ session, onReset }: LaunchLabToolbarProps) {
  const exportMd = () => {
    const md = buildLaunchLabMarkdown(session);
    const name = session.context.productName || "launch-lab";
    downloadMarkdown(md, `${name.toLowerCase().replace(/\s+/g, "-")}-export.md`);
  };

  return (
    <div className="flex items-center justify-end gap-2 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportMd}>Download Markdown</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8">
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
        Reset
      </Button>
    </div>
  );
}
