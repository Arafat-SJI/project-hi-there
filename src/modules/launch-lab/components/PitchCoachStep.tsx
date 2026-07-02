import { useState } from "react";
import {
  Loader2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AICard } from "@/components/ui/ai-indicator";
import { PitchScoreGauges } from "./PitchScoreGauges";
import { PitchContextPanel } from "./PitchContextPanel";
import { PitchStatsBar } from "./PitchStatsBar";
import { PitchHeadlineCard } from "./PitchHeadlineCard";
import { PitchBeforeAfter } from "./PitchBeforeAfter";
import { WeakMomentsPanel } from "./WeakMomentsPanel";
import { StrengthsCard } from "./StrengthsCard";
import { PracticeQuestionsCard } from "./PracticeQuestionsCard";
import { ObjectionFlashcards } from "./ObjectionFlashcards";
import { SpeechPlaybackButton } from "./SpeechPlaybackButton";
import { AnalyzeLoadingOverlay } from "./AnalyzeLoadingOverlay";
import { useSpeechPlayback } from "../hooks/useSpeechPlayback";
import { SAMPLE_PITCHES, PITCH_READY_THRESHOLD } from "../constants";
import type { LaunchLabContext, PitchAnalysis } from "../types";
import { getScoreGrade } from "../lib/pitch-metrics";

interface PitchCoachStepProps {
  rawPitch: string;
  context: LaunchLabContext;
  analysis: PitchAnalysis | null;
  isAnalyzing: boolean;
  onPitchChange: (value: string) => void;
  onContextChange: (patch: Partial<LaunchLabContext>) => void;
  onAnalyze: () => void;
  onContinue: () => void;
}

export function PitchCoachStep({
  rawPitch,
  context,
  analysis,
  isAnalyzing,
  onPitchChange,
  onContextChange,
  onAnalyze,
  onContinue,
}: PitchCoachStepProps) {
  const [resultsTab, setResultsTab] = useState("scores");
  const speechPlayback = useSpeechPlayback();

  const pitchText = rawPitch ?? "";

  const canContinue =
    analysis &&
    (analysis.ready_for_planning ||
      analysis.overall >= PITCH_READY_THRESHOLD ||
      (analysis.improved_pitch?.length ?? 0) > 0);

  const grade = analysis ? getScoreGrade(analysis.overall) : null;

  return (
    <div className="relative space-y-6">
      {isAnalyzing && <AnalyzeLoadingOverlay scoped />}

      <PitchContextPanel context={context} onChange={onContextChange} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <AICard className="p-4 border-primary/20">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                Your idea
              </h2>
              <Select
                onValueChange={(key) => {
                  const sample = SAMPLE_PITCHES.find((s) => s.label === key);
                  if (sample) {
                    onPitchChange(sample.text);
                    onContextChange({ productName: sample.productName });
                  }
                }}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Load sample" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_PITCHES.map((s) => (
                    <SelectItem key={s.label} value={s.label}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Paste a pitch, new project idea, business plan, product roadmap, or any launch narrative…"
              className="min-h-[200px] resize-y font-mono text-sm"
              value={pitchText}
              onChange={(e) => onPitchChange(e.target.value)}
            />

            <div className="mt-3 space-y-3">
              <PitchStatsBar text={pitchText} />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={onAnalyze}
                  disabled={isAnalyzing || pitchText.trim().length < 20}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
                {pitchText.trim().length > 20 && (
                  <SpeechPlaybackButton
                    id="draft-idea"
                    text={rawPitch}
                    playback={speechPlayback}
                    variant="icon"
                  />
                )}
              </div>
            </div>
          </AICard>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!analysis && !isAnalyzing ? (
            <Card className="border-dashed min-h-[400px] flex items-center justify-center bg-gradient-to-br from-muted/30 to-background">
              <CardContent className="text-center text-muted-foreground py-16 max-w-sm">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary opacity-70" />
                </div>
                <p className="font-medium text-foreground mb-2">Ready to refine your idea</p>
                <p className="text-sm">
                  Set your context above, paste at least 20 characters — a pitch, project idea, or
                  plan — and analyze for scores, objections, and a polished version.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {analysis && !isAnalyzing ? (
            <>
              <PitchHeadlineCard analysis={analysis} />

              {grade && (
                <div className="flex items-center gap-2 text-sm">
                  <span className={`font-semibold ${grade.color}`}>{grade.label}</span>
                  {analysis.ready_for_planning && (
                    <span className="text-emerald-600 text-xs">✓ Ready for launch planning</span>
                  )}
                </div>
              )}

              <Tabs value={resultsTab} onValueChange={setResultsTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="scores">Scores</TabsTrigger>
                  <TabsTrigger value="improve">Improve</TabsTrigger>
                  <TabsTrigger value="objections">Objections</TabsTrigger>
                  <TabsTrigger value="practice">Question outcomes</TabsTrigger>
                </TabsList>

                <TabsContent value="scores" className="space-y-4 mt-4">
                  <PitchScoreGauges scores={analysis.scores} overall={analysis.overall} />
                  <StrengthsCard strengths={analysis.strengths ?? []} />
                </TabsContent>

                <TabsContent value="improve" className="space-y-4 mt-4">
                  <PitchBeforeAfter original={rawPitch} improved={analysis.improved_pitch} />
                  <WeakMomentsPanel moments={analysis.weak_moments ?? []} />
                  {(analysis.fixes?.length ?? 0) > 0 ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          Quick fixes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-2">
                          {analysis.fixes.map((fix) => (
                            <li key={fix} className="flex gap-2">
                              <span className="text-primary">•</span>
                              {fix}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : null}
                </TabsContent>

                <TabsContent value="objections" className="mt-4">
                  <ObjectionFlashcards objections={analysis.objections ?? []} />
                </TabsContent>

                <TabsContent value="practice" className="space-y-4 mt-4" forceMount>
                  <PracticeQuestionsCard questions={analysis.practice_questions ?? []} />
                  {analysis.improved_pitch && (
                    <SpeechPlaybackButton
                      id="polished-pitch"
                      text={analysis.improved_pitch}
                      playback={speechPlayback}
                      label="Listen to polished pitch"
                    />
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end pt-2 sticky bottom-4">
                <Button size="lg" className="shadow-lg" onClick={onContinue} disabled={!canContinue}>
                  Continue to Idea Canvas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
