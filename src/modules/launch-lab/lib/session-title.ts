import type { PitchAnalysis, LaunchLabContext } from "../types";

export const SESSION_TITLE_DISPLAY_MAX = 25;

function safeStr(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Sidebar/list label: max 25 chars, then `...` */
export function formatSessionTitleDisplay(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "Untitled";
  if (trimmed.length <= SESSION_TITLE_DISPLAY_MAX) return trimmed;
  return `${trimmed.slice(0, SESSION_TITLE_DISPLAY_MAX - 3)}...`;
}

function truncateTitle(text: string, max = 48): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function firstPitchSnippet(rawPitch: string): string {
  const line = rawPitch.split(/\n/).find((part) => part.trim().length > 0)?.trim() ?? "";
  if (!line) return "";

  const buildingMatch = line.match(/\b(?:building|built|creating|launching)\s+([A-Za-z0-9][A-Za-z0-9\s'-]{1,40})/i);
  if (buildingMatch?.[1]) {
    return truncateTitle(buildingMatch[1].replace(/\s+,.*$/, "").trim(), 32);
  }

  return truncateTitle(line);
}

export function deriveSessionTitle(input: {
  productName?: string;
  context?: Partial<LaunchLabContext>;
  pitchAnalysis?: PitchAnalysis | null;
  rawPitch?: string;
}): string {
  const fromContext = safeStr(input.context?.productName).trim();
  if (fromContext) return truncateTitle(fromContext, 48);

  const fromStored = safeStr(input.productName).trim();
  if (fromStored && fromStored !== "Untitled") return truncateTitle(fromStored, 48);

  const headline = safeStr(input.pitchAnalysis?.headline).trim();
  if (headline) return truncateTitle(headline, 48);

  const tagline = safeStr(input.pitchAnalysis?.tagline).trim();
  if (tagline) return truncateTitle(tagline, 48);

  const oneLiner = safeStr(input.pitchAnalysis?.one_liner).trim();
  if (oneLiner) return truncateTitle(oneLiner, 48);

  const fromPitch = firstPitchSnippet(safeStr(input.rawPitch));
  if (fromPitch) return fromPitch;

  return "Untitled";
}

export function suggestProductNameFromSession(input: {
  context?: Partial<LaunchLabContext>;
  pitchAnalysis?: PitchAnalysis | null;
  rawPitch?: string;
}): string | null {
  if (safeStr(input.context?.productName).trim()) return null;

  const headline = safeStr(input.pitchAnalysis?.headline).trim();
  if (headline) {
    const words = headline.split(/\s+/).slice(0, 5).join(" ");
    return truncateTitle(words, 40);
  }

  const fromPitch = firstPitchSnippet(safeStr(input.rawPitch));
  return fromPitch || null;
}
