export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadSeconds(text: string, wpm = 150): number {
  const words = countWords(text);
  return Math.max(1, Math.ceil((words / wpm) * 60));
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function getScoreGrade(overall: number): { label: string; color: string } {
  if (overall >= 85) return { label: "Investor ready", color: "text-emerald-500" };
  if (overall >= 70) return { label: "Strong draft", color: "text-blue-500" };
  if (overall >= 55) return { label: "Needs polish", color: "text-amber-500" };
  return { label: "Early stage", color: "text-muted-foreground" };
}
