import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { LaunchLabStepper } from "../components/LaunchLabStepper";
import { LaunchLabHero } from "../components/LaunchLabHero";
import { LaunchLabToolbar } from "../components/LaunchLabToolbar";
import { LaunchLabSessionsLayout, LaunchLabSessionsTrigger } from "../components/LaunchLabSessionsLayout";
import { LaunchLabSessionSidebar } from "../components/LaunchLabSessionSidebar";
import { PitchCoachStep } from "../components/PitchCoachStep";
import { IdeaCanvasStep } from "../components/IdeaCanvasStep";
import { LaunchCommandStep } from "../components/LaunchCommandStep";
import { useLaunchLabSession } from "../hooks/useLaunchLabSession";
import { useAnalyzePitch, useGenerateCanvas } from "../hooks/useLaunchLabAgent";
import { PITCH_READY_THRESHOLD } from "../constants";
import { LaunchLabDeployAlert, LaunchLabSecretAlert } from "../components/LaunchLabDeployAlert";
import { useLaunchLabHealth } from "../hooks/useLaunchLabHealth";
import type { PitchAnalysis, SocialBannersState } from "../types";
import { deriveSessionTitle, suggestProductNameFromSession } from "../lib/session-title";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

export default function LaunchLabPage() {
  const {
    session,
    sessions,
    isLoading,
    isError,
    sidebarVisible,
    persistSidebarVisible,
    setRawPitch,
    setPitchAnalysis,
    setCanvas,
    setLaunchBoard,
    setSocialBanners,
    setContext,
    toggleCheckedStep,
    goToStep,
    newSession,
    selectSession,
    deleteSession,
    resetSession,
    persistSessionNow,
  } = useLaunchLabSession();

  const isMobile = useIsMobile();
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { data: health, isLoading: healthLoading } = useLaunchLabHealth();
  const analyzePitch = useAnalyzePitch();
  const generateCanvas = useGenerateCanvas();
  const canvasRequested = useRef(false);

  const canAccessStep2 =
    !!session?.pitchAnalysis &&
    (session.pitchAnalysis.ready_for_planning ||
      session.pitchAnalysis.overall >= PITCH_READY_THRESHOLD ||
      (session.pitchAnalysis.improved_pitch?.length ?? 0) > 0);

  const canAccessStep3 = !!session?.canvas?.clusters;

  const improvedPitch =
    session?.pitchAnalysis?.improved_pitch?.trim() || (session?.rawPitch ?? "").trim();

  const handleSocialBannersChange = useCallback(
    (socialBanners: SocialBannersState) => {
      if (!session) return;
      const nextSession = { ...session, socialBanners };
      setSocialBanners(socialBanners);
      if (socialBanners.linkedin.imageUrl || socialBanners.facebook.imageUrl || socialBanners.postsCreated) {
        persistSessionNow(nextSession);
      }
    },
    [persistSessionNow, session, setSocialBanners],
  );

  const handleStepClick = (target: 1 | 2 | 3) => {
    if (!session) return;
    if (target === 2 && !canAccessStep2) return;
    if (target === 3 && !canAccessStep3) return;
    goToStep(target);
  };

  const handleAnalyze = () => {
    if (!session) return;
    const { context, rawPitch } = session;
    analyzePitch.mutate(
      {
        pitch: rawPitch,
        pitch_type: context.pitchType,
        audience: context.audience,
        industry: context.industry,
        product_name: context.productName || undefined,
      },
      {
        onSuccess: (data) => {
          const analysis: PitchAnalysis = {
            scores: data.scores,
            overall: data.overall,
            ready_for_planning: data.ready_for_planning,
            improved_pitch: data.improved_pitch,
            fixes: data.fixes ?? [],
            objections: data.objections ?? [],
            weak_moments: data.weak_moments ?? [],
            headline: data.headline,
            tagline: data.tagline,
            one_liner: data.one_liner,
            strengths: data.strengths,
            practice_questions: data.practice_questions,
            target_audience_fit: data.target_audience_fit,
          };
          setPitchAnalysis(analysis);

          const suggestedName = suggestProductNameFromSession({
            context: session.context,
            pitchAnalysis: analysis,
            rawPitch: session.rawPitch,
          });
          if (suggestedName) {
            setContext({ productName: suggestedName });
          }

          if (analysis.overall >= 85) {
            toast.success("Investor-ready pitch!", {
              description: "Strong scores — you're ready for the canvas step.",
            });
          }
        },
      },
    );
  };

  const handleGenerateCanvas = () => {
    if (!session) return;
    const { context } = session;
    generateCanvas.mutate(
      {
        improved_pitch: improvedPitch,
        pitch_type: context.pitchType,
        audience: context.audience,
        industry: context.industry,
        product_name: context.productName || undefined,
      },
      {
        onSuccess: (data) => {
          setCanvas({
            clusters: data.clusters,
            synthesis: data.synthesis ?? "",
            kpis: data.kpis,
            milestones: data.milestones,
            elevator_hooks: data.elevator_hooks,
          });
        },
      },
    );
  };

  useEffect(() => {
    if (!session) return;
    if (session.step === 3 && !canAccessStep3) {
      goToStep(canAccessStep2 ? 2 : 1);
    }
  }, [session, session?.step, canAccessStep3, canAccessStep2, goToStep]);

  useEffect(() => {
    if (!session) return;
    if (
      session.step === 2 &&
      session.pitchAnalysis &&
      !session.canvas &&
      !generateCanvas.isPending &&
      !canvasRequested.current
    ) {
      canvasRequested.current = true;
      handleGenerateCanvas();
    }
    if (session.step === 1) {
      canvasRequested.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, session?.step, session?.id, session?.pitchAnalysis, session?.canvas]);

  const handleResetRequest = () => {
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    resetSession();
    setResetDialogOpen(false);
  };

  const handleNewSession = () => {
    newSession();
    setMobileSessionsOpen(false);
  };

  const handleSelectSession = (id: string) => {
    selectSession(id);
    setMobileSessionsOpen(false);
  };

  const setSidebarOpen = (open: boolean) => {
    persistSidebarVisible(open);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarVisible);
  };

  if (isError) {
    return (
      <div className="container max-w-6xl px-4 py-12 sm:px-6 text-center space-y-3">
        <p className="text-muted-foreground">Could not load your Launch Lab sessions.</p>
        <p className="text-sm text-muted-foreground">Make sure you are logged in and try refreshing the page.</p>
      </div>
    );
  }

  if (isLoading || !session) {
    return (
      <div className="container max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const sidebarProps = {
    sessions,
    activeSessionId: session.id,
    onNew: handleNewSession,
    onSelect: handleSelectSession,
    onDelete: deleteSession,
  };

  return (
    <LaunchLabSessionsLayout
      visible={sidebarVisible}
      isMobile={isMobile}
      onToggle={setSidebarOpen}
      sidebarProps={sidebarProps}
    >
      <div className="container max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          {(isMobile || !sidebarVisible) && (
            <div className="flex items-center">
              <LaunchLabSessionsTrigger
                onClick={isMobile ? () => setMobileSessionsOpen(true) : toggleSidebar}
              />
            </div>
          )}

          <LaunchLabDeployAlert health={health} isLoading={healthLoading} />
          <LaunchLabSecretAlert health={health} />

          <LaunchLabHero
            step={session.step}
            overall={session.pitchAnalysis?.overall ?? null}
            productName={deriveSessionTitle(session)}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <LaunchLabStepper
              step={session.step}
              canAccessStep2={canAccessStep2}
              canAccessStep3={canAccessStep3}
              onStepClick={handleStepClick}
            />
            <LaunchLabToolbar session={session} onReset={handleResetRequest} />
          </div>

          {session.step === 1 ? (
            <PitchCoachStep
              rawPitch={session.rawPitch}
              context={session.context}
              analysis={session.pitchAnalysis}
              isAnalyzing={analyzePitch.isPending}
              onPitchChange={setRawPitch}
              onContextChange={setContext}
              onAnalyze={handleAnalyze}
              onContinue={() => goToStep(2)}
            />
          ) : session.step === 2 ? (
            <IdeaCanvasStep
              improvedPitch={improvedPitch}
              canvas={session.canvas}
              isGenerating={generateCanvas.isPending}
              checkedSteps={session.checkedSteps}
              onToggleStep={toggleCheckedStep}
              onBack={() => goToStep(1)}
              onGenerate={handleGenerateCanvas}
              onContinue={() => goToStep(3)}
              canContinue={canAccessStep3}
            />
          ) : session.pitchAnalysis && session.canvas ? (
            <LaunchCommandStep
              productName={deriveSessionTitle(session)}
              pitchAnalysis={session.pitchAnalysis}
              userPitch={improvedPitch}
              canvas={session.canvas}
              context={session.context}
              checkedSteps={session.checkedSteps}
              launchBoard={session.launchBoard}
              onLaunchBoardChange={setLaunchBoard}
              socialBanners={session.socialBanners}
              onSocialBannersChange={handleSocialBannersChange}
              onBack={() => goToStep(2)}
            />
          ) : null}
        </div>

      <Sheet open={mobileSessionsOpen} onOpenChange={setMobileSessionsOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Launch Lab sessions</SheetTitle>
          </SheetHeader>
          <LaunchLabSessionSidebar {...sidebarProps} className="flex h-full w-full border-0" />
        </SheetContent>
      </Sheet>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this Launch Lab session?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears the current pitch, analysis, and canvas for &ldquo;
              {deriveSessionTitle(session)}&rdquo;. The session stays in your sidebar as an empty
              draft unless you delete it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmReset}
            >
              Reset session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LaunchLabSessionsLayout>
  );
}
