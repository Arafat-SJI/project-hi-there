import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LaunchLabStepper } from "../components/LaunchLabStepper";
import { LaunchLabHero } from "../components/LaunchLabHero";
import { LaunchLabToolbar } from "../components/LaunchLabToolbar";
import { SessionHistorySheet } from "../components/SessionHistorySheet";
import { PitchCoachStep } from "../components/PitchCoachStep";
import { IdeaCanvasStep } from "../components/IdeaCanvasStep";
import { useLaunchLabSession } from "../hooks/useLaunchLabSession";
import { useAnalyzePitch, useGenerateCanvas } from "../hooks/useLaunchLabAgent";
import { PITCH_READY_THRESHOLD } from "../constants";
import { LaunchLabDeployAlert, LaunchLabSecretAlert } from "../components/LaunchLabDeployAlert";
import { useLaunchLabHealth } from "../hooks/useLaunchLabHealth";

export default function LaunchLabPage() {
  const {
    session,
    history,
    setRawPitch,
    setPitchAnalysis,
    setCanvas,
    setContext,
    toggleCheckedStep,
    goToStep,
    resetSession,
    saveToHistory,
    loadFromHistory,
    deleteFromHistory,
  } = useLaunchLabSession();

  const [historyOpen, setHistoryOpen] = useState(false);
  const { data: health, isLoading: healthLoading } = useLaunchLabHealth();
  const analyzePitch = useAnalyzePitch();
  const generateCanvas = useGenerateCanvas();
  const canvasRequested = useRef(false);

  const canAccessStep2 =
    !!session.pitchAnalysis &&
    (session.pitchAnalysis.ready_for_planning ||
      session.pitchAnalysis.overall >= PITCH_READY_THRESHOLD ||
      session.pitchAnalysis.improved_pitch.length > 0);

  const improvedPitch =
    session.pitchAnalysis?.improved_pitch?.trim() || session.rawPitch.trim();

  const handleAnalyze = () => {
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
    if (session.step === 2 && !session.canvas && !generateCanvas.isPending && !canvasRequested.current) {
      canvasRequested.current = true;
      handleGenerateCanvas();
    }
    if (session.step === 1) {
      canvasRequested.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.step]);

  const handleReset = () => {
    if (window.confirm("Reset Launch Lab? This clears your current session.")) {
      resetSession();
    }
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6 animate-in fade-in duration-300">
      <LaunchLabDeployAlert health={health} isLoading={healthLoading} />
      <LaunchLabSecretAlert health={health} />

      <LaunchLabHero
        step={session.step}
        overall={session.pitchAnalysis?.overall ?? null}
        productName={session.context.productName}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LaunchLabStepper step={session.step} canAccessStep2={canAccessStep2} />
        <LaunchLabToolbar
          session={session}
          onReset={handleReset}
          onOpenHistory={() => setHistoryOpen(true)}
          onSaveHistory={saveToHistory}
        />
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
      ) : (
        <IdeaCanvasStep
          improvedPitch={improvedPitch}
          canvas={session.canvas}
          isGenerating={generateCanvas.isPending}
          checkedSteps={session.checkedSteps}
          onToggleStep={toggleCheckedStep}
          onBack={() => goToStep(1)}
          onGenerate={handleGenerateCanvas}
        />
      )}

      <SessionHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        onLoad={loadFromHistory}
        onDelete={deleteFromHistory}
      />
    </div>
  );
}
