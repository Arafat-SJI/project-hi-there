import { Quote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PitchAnalysis } from "../types";
import { getScoreGrade } from "../lib/pitch-metrics";

interface PitchHeadlineCardProps {
  analysis: PitchAnalysis;
}

export function PitchHeadlineCard({ analysis }: PitchHeadlineCardProps) {
  const grade = getScoreGrade(analysis.overall);

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-transparent to-violet-500/10">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">{analysis.headline || "Your pitch analysis"}</CardTitle>
          <Badge className="bg-primary/20 text-primary border-0">{grade.label}</Badge>
          <Badge variant="outline">{analysis.overall}/100</Badge>
        </div>
        {analysis.tagline && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Quote className="h-3.5 w-3.5" />
            {analysis.tagline}
          </p>
        )}
      </CardHeader>
      {analysis.one_liner && (
        <CardContent className="pt-0">
          <p className="text-sm font-medium rounded-lg bg-background/80 border px-3 py-2">
            {analysis.one_liner}
          </p>
          {analysis.target_audience_fit && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium text-foreground">Audience fit:</span> {analysis.target_audience_fit}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
