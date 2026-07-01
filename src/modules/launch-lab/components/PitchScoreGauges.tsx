import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PitchScores } from "../types";
import { getScoreGrade } from "../lib/pitch-metrics";

interface PitchScoreGaugesProps {
  scores: PitchScores;
  overall: number;
}

const SCORE_LABELS: { key: keyof PitchScores; label: string; color: string }[] = [
  { key: "clarity", label: "Clarity", color: "hsl(var(--primary))" },
  { key: "structure", label: "Structure", color: "hsl(262 83% 58%)" },
  { key: "value", label: "Value prop", color: "hsl(142 76% 36%)" },
  { key: "cta", label: "Call to action", color: "hsl(38 92% 50%)" },
];

function ScoreGauge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const data = [{ name: label, value, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="h-[100px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={8}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={4} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <span className="text-2xl font-bold -mt-16 relative z-10">{value}</span>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export function PitchScoreGauges({ scores, overall }: PitchScoreGaugesProps) {
  const grade = getScoreGrade(overall);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between gap-2">
          <span>
            Pitch scores
            <span className={`ml-2 text-sm font-normal ${grade.color}`}>{grade.label}</span>
          </span>
          <span className="text-4xl font-bold text-primary tabular-nums">{overall}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SCORE_LABELS.map(({ key, label, color }) => (
            <ScoreGauge key={key} label={label} value={scores[key]} color={color} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
