import { formatDistanceToNow } from "date-fns";
import { Trash2, FolderOpen } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SavedLaunchSession } from "../types";

interface SessionHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: SavedLaunchSession[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SessionHistorySheet({
  open,
  onOpenChange,
  history,
  onLoad,
  onDelete,
}: SessionHistorySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Session history</SheetTitle>
          <SheetDescription>Load a previous Launch Lab session from this browser.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-4">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No saved sessions yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border p-3 flex items-start justify-between gap-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {item.productName || item.context?.productName || "Untitled pitch"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(item.savedAt), { addSuffix: true })}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {item.overall != null && (
                        <Badge variant="secondary" className="text-[10px]">
                          Score {item.overall}
                        </Badge>
                      )}
                      {item.canvas && (
                        <Badge variant="outline" className="text-[10px]">
                          Canvas
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => onLoad(item.id)}>
                      <FolderOpen className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
