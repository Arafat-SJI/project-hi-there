import type { BannerAspectRatio, BannerPlatform } from "../types";

export const BANNER_ASPECT_PRESETS: Record<
  BannerAspectRatio,
  { width: number; height: number; label: string }
> = {
  "1.91:1": { width: 1200, height: 627, label: "LinkedIn wide (1.91:1)" },
  "1.9:1": { width: 1200, height: 630, label: "Facebook wide (1.9:1)" },
  "16:9": { width: 1920, height: 1080, label: "Widescreen (16:9)" },
  "4:5": { width: 1080, height: 1350, label: "Portrait (4:5)" },
  "1:1": { width: 1080, height: 1080, label: "Square (1:1)" },
  "4:3": { width: 1200, height: 900, label: "Standard (4:3)" },
  "3:2": { width: 1200, height: 800, label: "Photo (3:2)" },
};

export const BANNER_ASPECT_OPTIONS = Object.entries(BANNER_ASPECT_PRESETS).map(
  ([value, preset]) => ({
    value: value as BannerAspectRatio,
    label: preset.label,
  }),
);

export const DEFAULT_ASPECT_BY_PLATFORM: Record<BannerPlatform, BannerAspectRatio> = {
  linkedin: "1.91:1",
  facebook: "1.9:1",
};

export function dimensionsForAspect(ratio: BannerAspectRatio) {
  const preset = BANNER_ASPECT_PRESETS[ratio];
  return { width: preset.width, height: preset.height };
}
