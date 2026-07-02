import { useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Share2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LaunchFlowBoard } from "./LaunchFlowBoard";
import { SocialBannerGenerator } from "./SocialBannerGenerator";
import { resolveLaunchBoard, isLaunchBoardEmpty } from "../lib/launch-board";
import type { IdeaCanvasResult, LaunchBoardState, PitchAnalysis } from "../types";
import { getScoreGrade } from "../lib/pitch-metrics";

interface LaunchCommandStepProps {
  productName: string;
  pitchAnalysis: PitchAnalysis;
  canvas: IdeaCanvasResult;
  checkedSteps: string[];
  launchBoard: LaunchBoardState | null;
  onLaunchBoardChange: (board: LaunchBoardState) => void;
  onBack: () => void;
}

export function LaunchCommandStep({
  productName,
  pitchAnalysis,
  canvas,
  checkedSteps,
  launchBoard,
  onLaunchBoardChange,
  onBack,
}: LaunchCommandStepProps) {
  const nextStepIds = new Set(canvas.clusters.next_steps.map((step) => step.id));
  const checklistDone = checkedSteps.filter((id) => nextStepIds.has(id)).length;
  const checklistTotal = canvas.clusters.next_steps.length;
  const checklistPct = checklistTotal
    ? Math.round((checklistDone / checklistTotal) * 100)
    : 0;
  const launchReadiness = Math.round((pitchAnalysis.overall + checklistPct) / 2);
  const grade = getScoreGrade(launchReadiness);
  const displayName = productName.trim() && productName !== "Untitled" ? productName : "Your launch";

  const board = useMemo(
    () => resolveLaunchBoard(canvas, launchBoard),
    [canvas, launchBoard],
  );

  useEffect(() => {
    if (isLaunchBoardEmpty(launchBoard) && board.nodes.length > 0) {
      onLaunchBoardChange(board);
    }
  }, [board, launchBoard, onLaunchBoardChange]);

  const milestoneCount = canvas.milestones?.length ?? 0;
  const taskCount = canvas.clusters.next_steps.length;
  const kpiCount = canvas.kpis?.length ?? 0;

  return (
    <div className="relative space-y-6 pb-16">
      <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/15 via-violet-500/10 to-background">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-primary">
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Launch Command</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {pitchAnalysis.headline || `${displayName} command center`}
              </h2>
              {pitchAnalysis.tagline ? (
                <p className="text-muted-foreground max-w-2xl">{pitchAnalysis.tagline}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge className="bg-primary/15 text-primary border-primary/20">
                  Readiness {launchReadiness}
                </Badge>
                <Badge variant="outline" className={grade.color}>
                  {grade.label}
                </Badge>
                <Badge variant="outline">{milestoneCount} weeks</Badge>
                <Badge variant="outline">{taskCount} tasks</Badge>
                {kpiCount > 0 ? <Badge variant="outline">{kpiCount} KPIs</Badge> : null}
              </div>
            </div>
            <div className="rounded-xl border bg-background/80 p-4 min-w-[200px]">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" />
                  Checklist
                </span>
                <span>
                  {checklistDone}/{checklistTotal}
                </span>
              </div>
              <Progress value={checklistPct} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="flow" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="flow" className="gap-1.5 text-xs sm:text-sm">
            <GitBranch className="h-3.5 w-3.5" />
            Launch flow
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-1.5 text-xs sm:text-sm">
            <Share2 className="h-3.5 w-3.5" />
            Social banners
          </TabsTrigger>
          <TabsTrigger value="brief" className="gap-1.5 text-xs sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Launch brief
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="mt-0">
          <LaunchFlowBoard board={board} onBoardChange={onLaunchBoardChange} />
        </TabsContent>

        <TabsContent value="banners" className="mt-0">
          <SocialBannerGenerator productName={displayName} pitchAnalysis={pitchAnalysis} />
        </TabsContent>

        <TabsContent value="brief" className="mt-0 space-y-4">
          {canvas.synthesis ? (
            <Card>
              <CardContent className="p-4 pt-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {canvas.synthesis}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {canvas.elevator_hooks && canvas.elevator_hooks.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {canvas.elevator_hooks.slice(0, 2).map((hook, index) => (
                <Card
                  key={`${hook}-${index}`}
                  className="border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-background"
                >
                  <CardContent className="p-4">
                    <p className="text-sm font-medium leading-relaxed">&ldquo;{hook}&rdquo;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {canvas.kpis && canvas.kpis.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {canvas.kpis.slice(0, 3).map((kpi, index) => (
                <Card key={`${kpi.label}-${index}`} className="text-center">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-lg font-bold text-primary">{kpi.target}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        className="sticky bottom-4 z-10 w-fit shadow-md bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Idea Canvas
      </Button>
    </div>
  );
}
