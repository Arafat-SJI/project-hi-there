import { Clock, FileText, Mic } from "lucide-react";
import { countWords, estimateReadSeconds, formatDuration } from "../lib/pitch-metrics";

interface PitchStatsBarProps {
  text: string;
}

export function PitchStatsBar({ text }: PitchStatsBarProps) {
  const words = countWords(text);
  const seconds = estimateReadSeconds(text);
  const chars = text.length;

  const items = [
    { icon: FileText, label: "Words", value: words.toString() },
    { icon: Clock, label: "Read time", value: formatDuration(seconds) },
    { icon: Mic, label: "Chars", value: chars.toString() },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground"
        >
          <Icon className="h-3 w-3" />
          <span className="font-medium text-foreground">{value}</span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
