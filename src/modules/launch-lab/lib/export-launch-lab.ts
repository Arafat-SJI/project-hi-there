import type { LaunchLabSession } from "../types";

export function buildLaunchLabMarkdown(session: LaunchLabSession): string {
  const { context, rawPitch, pitchAnalysis: analysis, canvas } = session;
  const productName = context.productName;

  const lines: string[] = [
    `# Launch Lab Export — ${productName || "Untitled"}`,
    "",
    `Generated: ${new Date().toLocaleString()}`,
    "",
  ];

  if (analysis) {
    lines.push("## Pitch scores", "");
    lines.push(`- **Overall:** ${analysis.overall}/100`);
    lines.push(`- Clarity: ${analysis.scores.clarity}`);
    lines.push(`- Structure: ${analysis.scores.structure}`);
    lines.push(`- Value: ${analysis.scores.value}`);
    lines.push(`- CTA: ${analysis.scores.cta}`);
    lines.push("");
    if (analysis.headline) lines.push(`**Headline:** ${analysis.headline}`, "");
    if (analysis.tagline) lines.push(`**Tagline:** ${analysis.tagline}`, "");
    if (analysis.one_liner) lines.push(`**One-liner:** ${analysis.one_liner}`, "");
    lines.push("## Polished pitch", "", analysis.improved_pitch, "");
  }

  lines.push("## Original pitch", "", rawPitch, "");

  if (canvas?.synthesis) {
    lines.push("## Launch plan", "", canvas.synthesis, "");
  }

  if (canvas?.clusters?.next_steps?.length) {
    lines.push("## Action checklist", "");
    canvas.clusters.next_steps.forEach((n, i) => {
      lines.push(`${i + 1}. [ ] ${n.title} — ${n.detail}`);
    });
  }

  return lines.join("\n");
}

export function downloadMarkdown(content: string, filename: string) {
  downloadTextFile(filename.endsWith(".md") ? filename : `${filename}.md`, content);
}

export function downloadTextFile(filename: string, content: string, mime = "text/markdown") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
