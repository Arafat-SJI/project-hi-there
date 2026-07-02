import { ArrowLeft, ArrowRight, Loader2, LayoutGrid, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { StickyCluster } from "./StickyCluster";
import { LaunchPlanCard } from "./LaunchPlanCard";
import { CanvasOverviewStats } from "./CanvasOverviewStats";
import { LaunchKpiCards } from "./LaunchKpiCards";
import { LaunchMilestonesTimeline } from "./LaunchMilestonesTimeline";
import { ElevatorHooksCard } from "./ElevatorHooksCard";
import { LaunchChecklist } from "./LaunchChecklist";
import { AnalyzeLoadingOverlay } from "./AnalyzeLoadingOverlay";
import type { IdeaCanvasResult } from "../types";

interface IdeaCanvasStepProps {
  improvedPitch: string;
  canvas: IdeaCanvasResult | null;
  isGenerating: boolean;
  checkedSteps: string[];
  onToggleStep: (id: string) => void;
  onBack: () => void;
  onGenerate: () => void;
  onContinue: () => void;
  canContinue: boolean;
}

export function IdeaCanvasStep({
  improvedPitch,
  canvas,
  isGenerating,
  checkedSteps,
  onToggleStep,
  onBack,
  onGenerate,
  onContinue,
  canContinue,
}: IdeaCanvasStepProps) {
  const checklistSteps =
    canvas?.clusters?.next_steps?.map((n) => ({
      id: n.id,
      label: n.detail ? `${n.title} — ${n.detail}` : n.title,
    })) ?? [];

  return (
    <div className="relative space-y-6 min-h-[320px] pb-16">
      {isGenerating && !canvas && (
        <AnalyzeLoadingOverlay scoped message="Building your idea canvas and 30-day launch plan…" />
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LayoutGrid className="h-4 w-4 mr-1" />
              Regenerate board
            </>
          )}
        </Button>
      </div>

      <Collapsible defaultOpen={false}>
        <Card className="border-dashed">
          <CollapsibleTrigger className="w-full">
            <div className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-t-lg">
              <span className="font-medium text-sm">Source input</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {improvedPitch}
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {canvas && (
        <>
          <CanvasOverviewStats canvas={canvas} />

          {canvas.elevator_hooks && canvas.elevator_hooks.length > 0 && (
            <ElevatorHooksCard hooks={canvas.elevator_hooks} />
          )}
        </>
      )}

      <Tabs defaultValue="canvas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="plan">Launch plan</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="milestones">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="mt-4">
          {isGenerating && !canvas?.clusters ? (
            <Card className="min-h-[280px] flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Mapping problems, ideas, risks & next steps…</p>
            </Card>
          ) : canvas?.clusters ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StickyCluster clusterKey="problems" notes={canvas.clusters.problems} />
              <StickyCluster clusterKey="ideas" notes={canvas.clusters.ideas} />
              <StickyCluster clusterKey="risks" notes={canvas.clusters.risks} />
              <StickyCluster clusterKey="next_steps" notes={canvas.clusters.next_steps} />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          {canvas?.synthesis ? (
            <LaunchPlanCard synthesis={canvas.synthesis} />
          ) : (
            <EmptyTab message="Launch plan will appear after canvas generation." />
          )}
        </TabsContent>

        <TabsContent value="checklist" className="mt-4 space-y-4">
          <LaunchChecklist steps={checklistSteps} checked={checkedSteps} onToggle={onToggleStep} />
          {checklistSteps.length > 0 &&
            checkedSteps.length === checklistSteps.length &&
            checklistSteps.every((s) => checkedSteps.includes(s.id)) && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="flex items-center gap-3 py-4">
                  <PartyPopper className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="font-medium">All launch steps checked!</p>
                    <p className="text-sm text-muted-foreground">You&apos;re ready to execute your plan.</p>
                  </div>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent value="kpis" className="mt-4">
          {canvas?.kpis?.length ? (
            <LaunchKpiCards kpis={canvas.kpis} />
          ) : (
            <EmptyTab message="KPIs will be generated with your canvas." />
          )}
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          {canvas?.milestones?.length ? (
            <LaunchMilestonesTimeline milestones={canvas.milestones} />
          ) : (
            <EmptyTab message="30-day milestones will appear after generation." />
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Idea Coach
        </Button>
        {canContinue ? (
          <Button size="lg" className="shadow-lg" onClick={onContinue}>
            Open Launch Command
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
