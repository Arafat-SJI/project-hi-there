import type { BannerPlatform, SocialBannerItem, SocialBannersState } from "../types";
import { BANNER_PLATFORMS } from "../constants";
import { DEFAULT_ASPECT_BY_PLATFORM } from "./banner-aspects";
import { loadSessionBannerImages } from "./banner-image-store";

function emptyPlatformItem(platform: BannerPlatform): SocialBannerItem {  return {
    imageUrl: null,
    variantIndex: 0,
    aspectRatio: DEFAULT_ASPECT_BY_PLATFORM[platform],
    suggestedPost: null,
  };
}

export function createEmptySocialBanners(): SocialBannersState {
  return {
    hasGenerated: false,
    initialized: false,
    postsCreated: false,
    linkedin: emptyPlatformItem("linkedin"),
    facebook: emptyPlatformItem("facebook"),
    instagram: emptyPlatformItem("instagram"),
    x: emptyPlatformItem("x"),
  };
}

function normalizePlatformItem(
  platform: BannerPlatform,
  item: SocialBannerItem | undefined,
  stripImage = false,
): SocialBannerItem {
  const imageUrl =
    !stripImage && typeof item?.imageUrl === "string" && item.imageUrl.length > 0
      ? item.imageUrl
      : null;

  return {
    imageUrl,
    variantIndex: Number(item?.variantIndex) || 0,
    aspectRatio: item?.aspectRatio ?? DEFAULT_ASPECT_BY_PLATFORM[platform],
    suggestedPost: typeof item?.suggestedPost === "string" ? item.suggestedPost : null,
  };
}

function platformItemsFromValue(
  value: Partial<SocialBannersState>,
  stripImage: boolean,
): Record<BannerPlatform, SocialBannerItem> {
  return {
    linkedin: normalizePlatformItem("linkedin", value.linkedin, stripImage),
    facebook: normalizePlatformItem("facebook", value.facebook, stripImage),
    instagram: normalizePlatformItem("instagram", value.instagram, stripImage),
    x: normalizePlatformItem("x", value.x, stripImage),
  };
}

/** Strip base64 blobs before persisting to Supabase (images live in IndexedDB per session). */
export function stripSocialBannersForPersistence(
  value: SocialBannersState | null | undefined,
): SocialBannersState | null {
  const normalized = normalizeSocialBanners(value, true);
  return normalized;
}

export function normalizeSocialBanners(
  value: SocialBannersState | null | undefined,
  stripImage = false,
): SocialBannersState | null {
  if (!value || typeof value !== "object") return null;

  const items = platformItemsFromValue(value, stripImage);
  const hadLegacyImages = BANNER_PLATFORMS.some(
    (platform) =>
      typeof value[platform]?.imageUrl === "string" && value[platform]!.imageUrl!.length > 0,
  );

  return {
    hasGenerated: !!value.hasGenerated || hadLegacyImages,
    initialized: !!value.initialized || hadLegacyImages,
    postsCreated:
      !!value.postsCreated ||
      BANNER_PLATFORMS.some((platform) => !!items[platform].suggestedPost),
    ...items,
  };
}

export function hasAnyBannerImage(state: SocialBannersState | null | undefined): boolean {
  if (!state) return false;
  return BANNER_PLATFORMS.some(
    (platform) => typeof state[platform].imageUrl === "string" && state[platform].imageUrl!.length > 0,
  );
}

/** Merge IndexedDB images + aspect ratios into session banner state (per project). */
export async function hydrateSocialBannersWithStoredImages(
  sessionId: string,
  banners: SocialBannersState | null,
): Promise<SocialBannersState> {
  const base = banners ?? createEmptySocialBanners();
  const stored = await loadSessionBannerImages(sessionId);

  const next: SocialBannersState = { ...base };
  let anyImage = false;

  for (const platform of BANNER_PLATFORMS) {
    const record = stored[platform];
    if (!record?.imageUrl) continue;
    anyImage = true;
    next[platform] = {
      ...next[platform],
      imageUrl: record.imageUrl,
      aspectRatio: record.aspectRatio ?? next[platform].aspectRatio,
      variantIndex: record.variantIndex ?? next[platform].variantIndex,
    };
  }

  if (anyImage) {
    next.hasGenerated = true;
    next.initialized = true;
  }

  return next;
}

export function createEmptyPlatformRecord<T>(factory: () => T): Record<BannerPlatform, T> {
  return BANNER_PLATFORMS.reduce(
    (acc, platform) => {
      acc[platform] = factory();
      return acc;
    },
    {} as Record<BannerPlatform, T>,
  );
}
