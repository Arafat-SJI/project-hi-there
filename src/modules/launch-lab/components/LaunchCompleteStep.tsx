import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowUpAZ,
  BadgeCheck,
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  PartyPopper,
  Search,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils";
import { useLaunchLabSharing } from "../hooks/useLaunchLabSharing";
import { deriveSessionTitle } from "../lib/session-title";
import { getScoreGrade } from "../lib/pitch-metrics";
import type { IdeaCanvasResult, LaunchLabSession, PitchAnalysis } from "../types";

interface LaunchCompleteStepProps {
  session: LaunchLabSession;
  pitchAnalysis: PitchAnalysis;
  canvas: IdeaCanvasResult;
  isOwner: boolean;
  onBack: () => void;
}

export function LaunchCompleteStep({
  session,
  pitchAnalysis,
  canvas,
  isOwner,
  onBack,
}: LaunchCompleteStepProps) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const title = deriveSessionTitle(session);
  const grade = getScoreGrade(pitchAnalysis.overall);
  const completedLabel = session.completedAt
    ? format(new Date(session.completedAt), "MMM d, yyyy · h:mm a")
    : format(new Date(), "MMM d, yyyy");

  const taskCount = canvas.clusters.next_steps.length;
  const milestoneCount = canvas.milestones?.length ?? 0;
  const checklistDone = session.checkedSteps.filter((id) =>
    canvas.clusters.next_steps.some((step) => step.id === id),
  ).length;

  const {
    shares,
    shareableUsers,
    isLoadingUsers,
    shareWithUser,
    isSharing,
    sharingUserId,
    removeShare,
    isRemovingShare,
    copyProjectLink,
    projectUrl,
  } = useLaunchLabSharing(session.id, isOwner);

  const shareIdByUserId = useMemo(
    () => new Map(shares.map((share) => [share.sharedWithUserId, share.id])),
    [shares],
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = shareableUsers;
    if (query) {
      list = list.filter(
        (user) =>
          (user.fullName ?? "").toLowerCase().includes(query) ||
          (user.email ?? "").toLowerCase().includes(query),
      );
    }
    return [...list].sort((a, b) => {
      const nameA = (a.fullName || a.email || "").toLowerCase();
      const nameB = (b.fullName || b.email || "").toLowerCase();
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [shareableUsers, search, sortAsc]);

  return (
    <div className="relative space-y-6 pb-16">
      <Card className="overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-primary/10 to-background">
        <CardContent className="p-8 sm:p-10 text-center space-y-5">
          <div className="inline-flex items-center justify-center rounded-full bg-emerald-500/15 p-4 ring-4 ring-emerald-500/20">
            <BadgeCheck className="h-14 w-14 text-emerald-600" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white px-4 py-1 text-sm tracking-wide">
              COMPLETED
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Your launch lab journey is complete — from pitch refinement through command center planning.
            </p>
            <p className="text-xs text-muted-foreground">Finished {completedLabel}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Pitch score" value={`${pitchAnalysis.overall}/100`} hint={grade.label} />
        <SummaryCard label="Canvas tasks" value={String(taskCount)} hint="Next steps mapped" />
        <SummaryCard label="Milestones" value={String(milestoneCount)} hint="30-day roadmap" />
        <SummaryCard
          label="Checklist"
          value={`${checklistDone}/${taskCount}`}
          hint="Actions checked off"
        />
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <PartyPopper className="h-5 w-5" />
            <h3 className="font-semibold">What you completed</h3>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              Idea Coach — pitch scored and refined
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              Idea Canvas — launch plan and clusters
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              Launch Command — flow, banners, and brief
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              Launch Complete — ready to share
            </li>
          </ul>
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Share this project</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy the project link or pick a teammate below to grant view access to this completed
              launch lab project.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input readOnly value={projectUrl} className="pl-9 font-mono text-xs" />
              </div>
              <Button type="button" variant="outline" onClick={copyProjectLink}>
                <Copy className="h-4 w-4 mr-1.5" />
                Copy link
              </Button>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Team members
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Filter by name or email"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={() => setSortAsc((value) => !value)}
                    title={sortAsc ? "Sort Z–A" : "Sort A–Z"}
                  >
                    {sortAsc ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading team members…
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {search.trim() ? "No users match your search." : "No other users available to share with."}
                </p>
              ) : (
                <ScrollArea className="h-[min(320px,50vh)] rounded-lg border">
                  <div className="divide-y">
                    {filteredUsers.map((user) => {
                      const shareId = shareIdByUserId.get(user.id);
                      const isShared = Boolean(shareId);
                      const displayName = user.fullName || user.email || "User";
                      const isPending = isSharing && sharingUserId === user.id;

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
                              <AvatarFallback className="text-xs">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{displayName}</p>
                              {user.email ? (
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              ) : null}
                            </div>
                          </div>
                          {isShared ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                Shared
                              </Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                disabled={isRemovingShare}
                                onClick={() => shareId && removeShare(shareId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isSharing}
                              onClick={() => shareWithUser(user.id)}
                            >
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Users className="h-4 w-4 mr-1.5" />
                                  Share
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-5 text-sm text-muted-foreground">
            This project was shared with you. You have view access to the completed launch lab work.
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        className="sticky bottom-4 z-10 w-fit shadow-md bg-background/95 backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Launch Command
      </Button>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="text-center">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-primary mt-1">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}
