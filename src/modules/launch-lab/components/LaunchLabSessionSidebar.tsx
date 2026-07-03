import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { PanelLeftClose, Plus, Rocket, Share2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deriveSessionTitle, formatSessionTitleDisplay } from "../lib/session-title";
import type { SavedLaunchSession } from "../types";

interface LaunchLabSessionSidebarProps {
  sessions: SavedLaunchSession[];
  sharedSessions?: SavedLaunchSession[];
  activeSessionId: string;
  onNew?: () => void;
  onSelect: (id: string) => void;
  onPrefetch?: (id: string) => void;
  onDelete?: (id: string) => void;
  onHide?: () => void;
  className?: string;
}

function sessionTitle(entry: SavedLaunchSession) {
  return formatSessionTitleDisplay(deriveSessionTitle(entry));
}

function sessionTitleFull(entry: SavedLaunchSession) {
  return deriveSessionTitle(entry);
}

function safeFormatDistance(savedAt: string | undefined): string {
  if (!savedAt) return "just now";
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "just now";
  return formatDistanceToNow(date, { addSuffix: true });
}

function hasCanvas(entry: SavedLaunchSession): boolean {
  return !!entry.canvas?.clusters;
}

function sessionScore(entry: SavedLaunchSession): number | null {
  return entry.overall ?? entry.pitchAnalysis?.overall ?? null;
}

function sessionStatus(entry: SavedLaunchSession): string {
  if (entry.step === 4 || entry.completedAt) return "Completed";
  const score = sessionScore(entry);
  if (score != null) return `Score ${score}`;
  if (hasCanvas(entry)) return "Canvas ready";
  if (entry.pitchAnalysis) return "Pitch analyzed";
  if ((entry.rawPitch ?? "").trim().length > 0) return "Draft pitch";
  return "Empty draft";
}

function SessionRow({
  entry,
  isActive,
  onSelect,
  onPrefetch,
  onDelete,
  showSharedBadge,
}: {
  entry: SavedLaunchSession;
  isActive: boolean;
  onSelect: (id: string) => void;
  onPrefetch?: (id: string) => void;
  onDelete?: (id: string) => void;
  showSharedBadge?: boolean;
}) {
  const timeLabel = entry.isShared && entry.sharedAt
    ? safeFormatDistance(entry.sharedAt)
    : safeFormatDistance(entry.savedAt);

  return (
    <div
      className={cn(
        "group relative rounded-lg border transition-colors",
        isActive
          ? "border-primary/40 bg-primary/10"
          : "border-transparent hover:border-border hover:bg-muted/60",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(entry.id)}
        onMouseEnter={() => onPrefetch?.(entry.id)}
        onFocus={() => onPrefetch?.(entry.id)}
        className="w-full px-3 py-2.5 text-left pr-9"
        title={sessionTitleFull(entry)}
      >
        <p className="truncate text-sm font-medium">{sessionTitle(entry)}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {sessionStatus(entry)} · {timeLabel}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {showSharedBadge ? (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-0.5">
              <Share2 className="h-2.5 w-2.5" />
              Shared
            </Badge>
          ) : null}
          {sessionScore(entry) != null && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {sessionScore(entry)}
            </Badge>
          )}
          {hasCanvas(entry) && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              Canvas
            </Badge>
          )}
          {entry.pitchAnalysis && !hasCanvas(entry) && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              Pitch
            </Badge>
          )}
          {entry.step === 4 || entry.completedAt ? (
            <Badge className="h-5 px-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-600">
              Done
            </Badge>
          ) : null}
        </div>
      </button>
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1.5 h-7 w-7 opacity-0 text-muted-foreground hover:text-destructive group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          aria-label={`Delete ${sessionTitleFull(entry)}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

export function LaunchLabSessionSidebar({
  sessions,
  sharedSessions = [],
  activeSessionId,
  onNew,
  onSelect,
  onPrefetch,
  onDelete,
  onHide,
  className,
}: LaunchLabSessionSidebarProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingEntry = pendingDeleteId
    ? sessions.find((s) => s.id === pendingDeleteId)
    : undefined;
  const pendingTitle = pendingEntry ? sessionTitleFull(pendingEntry) : "this session";

  const handleConfirmDelete = () => {
    if (!pendingDeleteId || !onDelete) return;
    onDelete(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const handleDeleteRequest = (id: string) => {
    setPendingDeleteId(id);
  };

  return (
    <>
    <aside
      className={cn(
        "flex w-[260px] shrink-0 flex-col border-r bg-sidebar/50",
        className,
      )}
    >
      <div className="border-b p-3">
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <Rocket className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm font-semibold truncate">Launch Lab</span>
          </div>
          {onHide && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              onClick={onHide}
              aria-label="Hide sessions sidebar"
              title="Hide sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        {onNew ? (
          <Button className="w-full justify-start gap-2" size="sm" onClick={onNew}>
            <Plus className="h-4 w-4" />
            New Launch Lab
          </Button>
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-2">
          <section className="space-y-1">
            <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              My projects
            </p>
            {sessions.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                {onNew ? "No projects yet. Start with New Launch Lab." : "No projects of your own."}
              </p>
            ) : (
              sessions.map((entry) => (
                <SessionRow
                  key={entry.id}
                  entry={entry}
                  isActive={entry.id === activeSessionId}
                  onSelect={onSelect}
                  onPrefetch={onPrefetch}
                  onDelete={onDelete ? handleDeleteRequest : undefined}
                />
              ))
            )}
          </section>

          {sharedSessions.length > 0 ? (
            <section className="space-y-1 border-t pt-3">
              <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Shared
              </p>
              {sharedSessions.map((entry) => (
                <SessionRow
                  key={entry.id}
                  entry={entry}
                  isActive={entry.id === activeSessionId}
                  onSelect={onSelect}
                  onPrefetch={onPrefetch}
                  showSharedBadge
                />
              ))}
            </section>
          ) : null}
        </div>
      </ScrollArea>
    </aside>

    <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Launch Lab session?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{pendingTitle}&rdquo; will be removed from this browser. Your pitch, scores,
            and canvas for this session cannot be recovered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirmDelete}
          >
            Delete session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
