/**
 * OKR helper utilities.
 *
 * Lightweight utilities used across OKR pages/components.
 */

import type { KeyResultRow, UpdateFrequency } from "@/types/okr";

export function calculateKeyResultProgress(keyResult: KeyResultRow): number {
  const start = Number(keyResult.start_value ?? 0);
  const current = Number(keyResult.current_value ?? 0);
  const target = Number(keyResult.target_value ?? 0);

  if (target === start) return current >= target ? 100 : 0;
  const raw = ((current - start) / (target - start)) * 100;
  return Number(Math.max(0, Math.min(100, raw)).toFixed(2));
}

export function calculateOKRProgress(keyResults: KeyResultRow[]): number {
  if (!keyResults.length) return 0;
  const total = keyResults.reduce((sum, keyResult) => sum + calculateKeyResultProgress(keyResult), 0);
  return Number((total / keyResults.length).toFixed(2));
}

export function getFrequencyMilliseconds(frequency: UpdateFrequency): number {
  switch (frequency) {
    case "daily":
      return 24 * 60 * 60 * 1000;
    case "biweekly":
      return 14 * 24 * 60 * 60 * 1000;
    case "monthly":
      return 30 * 24 * 60 * 60 * 1000;
    case "weekly":
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export function isOverdue(lastUpdatedAt: string | null, frequency: UpdateFrequency): boolean {
  if (!lastUpdatedAt) return true;
  const updatedMs = new Date(lastUpdatedAt).getTime();
  if (Number.isNaN(updatedMs)) return true;
  return Date.now() - updatedMs > getFrequencyMilliseconds(frequency);
}
