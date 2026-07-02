import type { BannerPlatform, SocialBannerItem, SocialBannersState } from "../types";
import { DEFAULT_ASPECT_BY_PLATFORM } from "./banner-aspects";

function emptyPlatformItem(platform: BannerPlatform): SocialBannerItem {
  return {
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
  };
}

export function normalizeSocialBanners(
  value: SocialBannersState | null | undefined,
): SocialBannersState | null {
  if (!value || typeof value !== "object") return null;

  const linkedin = value.linkedin;
  const facebook = value.facebook;
  if (!linkedin || !facebook) return null;

  return {
    hasGenerated: !!value.hasGenerated,
    initialized: !!value.initialized,
    postsCreated: !!value.postsCreated || !!linkedin.suggestedPost || !!facebook.suggestedPost,
    linkedin: {
      imageUrl: typeof linkedin.imageUrl === "string" ? linkedin.imageUrl : null,
      variantIndex: Number(linkedin.variantIndex) || 0,
      aspectRatio: linkedin.aspectRatio ?? DEFAULT_ASPECT_BY_PLATFORM.linkedin,
      suggestedPost: typeof linkedin.suggestedPost === "string" ? linkedin.suggestedPost : null,
    },
    facebook: {
      imageUrl: typeof facebook.imageUrl === "string" ? facebook.imageUrl : null,
      variantIndex: Number(facebook.variantIndex) || 0,
      aspectRatio: facebook.aspectRatio ?? DEFAULT_ASPECT_BY_PLATFORM.facebook,
      suggestedPost: typeof facebook.suggestedPost === "string" ? facebook.suggestedPost : null,
    },
  };
}
