import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Download, Facebook, Linkedin, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useGenerateSocialPost } from "../hooks/useLaunchLabAgent";
import { BANNER_ASPECT_OPTIONS, dimensionsForAspect } from "../lib/banner-aspects";
import {
  downloadDataUrl,
  generateDemoBanner,
  simulateAiGeneration,
} from "../lib/demo-banner";
import { createEmptySocialBanners } from "../lib/social-banners";
import type {
  BannerAspectRatio,
  BannerPlatform,
  LaunchLabContext,
  PitchAnalysis,
  SocialBannersState,
} from "../types";

const PLATFORM_LABELS: Record<BannerPlatform, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

function resolvePostCopy(
  suggestedPost: string | null,
  pitchAnalysis: PitchAnalysis,
  userPitch: string,
): { text: string; source: "gemini" | "pitch" } {
  if (suggestedPost?.trim()) {
    return { text: suggestedPost.trim(), source: "gemini" };
  }

  const improved = pitchAnalysis.improved_pitch?.trim();
  if (improved) return { text: improved, source: "pitch" };

  const raw = userPitch.trim();
  if (raw) return { text: raw, source: "pitch" };

  const parts = [
    pitchAnalysis.headline?.trim(),
    pitchAnalysis.tagline?.trim() || pitchAnalysis.one_liner?.trim(),
  ].filter(Boolean);

  if (parts.length > 0) {
    return { text: parts.join("\n\n"), source: "pitch" };
  }

  return { text: "", source: "pitch" };
}

interface SocialBannerGeneratorProps {
  productName: string;
  pitchAnalysis: PitchAnalysis;
  userPitch: string;
  context: LaunchLabContext;
  socialBanners: SocialBannersState | null;
  onSocialBannersChange: (banners: SocialBannersState) => void;
  isTabActive: boolean;
}

type GeneratingState = Record<BannerPlatform, boolean>;
type ProgressState = Record<BannerPlatform, { progress: number; label: string }>;

function AiGeneratingOverlay({
  platform,
  aspectRatio,
  progress,
  label,
  failed,
  onRetry,
}: {
  platform: BannerPlatform;
  aspectRatio: BannerAspectRatio;
  progress: number;
  label: string;
  failed?: boolean;
  onRetry?: () => void;
}) {
  const { width, height } = dimensionsForAspect(aspectRatio);

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-violet-500/30 shadow-inner shadow-violet-500/10"
      style={{ aspectRatio: `${width}/${height}` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-700/50 via-violet-950 to-cyan-700/40" />
      <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/35 blur-3xl animate-pulse" />
      <div
        className="absolute -right-12 bottom-0 h-48 w-48 rounded-full bg-cyan-400/30 blur-3xl animate-pulse"
        style={{ animationDelay: "0.8s" }}
      />
      <div
        className="absolute left-1/2 top-1/4 h-36 w-36 -translate-x-1/2 rounded-full bg-amber-400/25 blur-2xl animate-pulse"
        style={{ animationDelay: "0.4s" }}
      />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(236,72,153,0.45),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.35),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(167,139,250,0.4),transparent_50%)]" />
      </div>

      <div
        className="absolute inset-0 opacity-20 animate-pulse"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)",
        }}
      />

      <div
        className="absolute left-0 right-0 h-28 bg-gradient-to-b from-fuchsia-300/25 via-violet-300/15 to-transparent animate-[banner-scan_2s_ease-in-out_infinite]"
        style={{ top: `${(progress % 80) + 10}%` }}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="relative">
          <Wand2 className="h-11 w-11 text-fuchsia-300 animate-pulse" />
          <Sparkles className="absolute -right-2 -top-2 h-5 w-5 text-amber-300 animate-bounce" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-violet-100">
            AI generating {PLATFORM_LABELS[platform]} visual
          </p>
          <p className="text-xs text-violet-200/80 font-mono">{label}</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <p className="text-4xl font-bold tabular-nums bg-gradient-to-r from-fuchsia-200 via-violet-100 to-cyan-200 bg-clip-text text-transparent">
            {progress}%
          </p>
          <Progress value={progress} className="h-2 bg-violet-950/80" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        {failed && onRetry ? (
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SocialBannerGenerator({
  productName,
  pitchAnalysis,
  userPitch,
  context,
  socialBanners,
  onSocialBannersChange,
  isTabActive,
}: SocialBannerGeneratorProps) {
  const generatePost = useGenerateSocialPost();
  const bannersRef = useRef<SocialBannersState>(socialBanners ?? createEmptySocialBanners());

  const postsFetchStartedRef = useRef(false);

  const autoGenStartedRef = useRef(false);

  const [activePlatform, setActivePlatform] = useState<BannerPlatform>("linkedin");
  const [generating, setGenerating] = useState<GeneratingState>({
    linkedin: false,
    facebook: false,
  });
  const [progress, setProgress] = useState<ProgressState>({
    linkedin: { progress: 0, label: "" },
    facebook: { progress: 0, label: "" },
  });
  const [postLoading, setPostLoading] = useState<Record<BannerPlatform, boolean>>({
    linkedin: false,
    facebook: false,
  });
  const [generationFailed, setGenerationFailed] = useState<Record<BannerPlatform, boolean>>({
    linkedin: false,
    facebook: false,
  });

  const banners = socialBanners ?? createEmptySocialBanners();

  useEffect(() => {
    bannersRef.current = socialBanners ?? createEmptySocialBanners();
    // Session loaded from DB with saved images — never auto-regenerate on refresh
    if (socialBanners?.linkedin.imageUrl || socialBanners?.facebook.imageUrl) {
      autoGenStartedRef.current = true;
    }
    if (socialBanners?.postsCreated) {
      postsFetchStartedRef.current = true;
    }
  }, [socialBanners]);

  const patchBanners = useCallback(
    (patch: (current: SocialBannersState) => SocialBannersState) => {
      const next = patch(bannersRef.current);
      bannersRef.current = next;
      onSocialBannersChange(next);
    },
    [onSocialBannersChange],
  );

  const postInput = useCallback(
    (platform: BannerPlatform) => ({
      platform,
      product_name: productName,
      headline: pitchAnalysis.headline,
      tagline: pitchAnalysis.tagline,
      one_liner: pitchAnalysis.one_liner,
      pitch_type: context.pitchType,
      audience: context.audience,
      industry: context.industry,
    }),
    [
      context.audience,
      context.industry,
      context.pitchType,
      pitchAnalysis.headline,
      pitchAnalysis.one_liner,
      pitchAnalysis.tagline,
      productName,
    ],
  );

  /** Gemini posts are created once on first banner run — never on regenerate. */
  const ensurePostsCreated = useCallback(async () => {
    const state = bannersRef.current;
    if (state.postsCreated || postsFetchStartedRef.current) return;

    const needsPosts = (["linkedin", "facebook"] as BannerPlatform[]).filter(
      (platform) => !state[platform].suggestedPost,
    );
    if (needsPosts.length === 0) {
      patchBanners((current) => ({ ...current, postsCreated: true }));
      return;
    }

    postsFetchStartedRef.current = true;
    patchBanners((current) => ({ ...current, postsCreated: true }));

    for (const platform of needsPosts) {
      setPostLoading((prev) => ({ ...prev, [platform]: true }));
    }

    await Promise.all(
      needsPosts.map(async (platform) => {
        try {
          const result = await generatePost.mutateAsync(postInput(platform));
          patchBanners((current) => ({
            ...current,
            [platform]: { ...current[platform], suggestedPost: result.post_copy },
          }));
        } catch {
          // toast handled by mutation
        } finally {
          setPostLoading((prev) => ({ ...prev, [platform]: false }));
        }
      }),
    );
  }, [generatePost, patchBanners, postInput]);

  const runImageGeneration = useCallback(
    async (platform: BannerPlatform, options: { bumpVariant?: boolean; showGimmick?: boolean }) => {
      const { bumpVariant = false, showGimmick = true } = options;
      const current = bannersRef.current;
      const item = current[platform];
      const variantIndex = bumpVariant ? item.variantIndex + 1 : item.variantIndex;
      const { width, height } = dimensionsForAspect(item.aspectRatio);

      setGenerating((prev) => ({ ...prev, [platform]: true }));
      setGenerationFailed((prev) => ({ ...prev, [platform]: false }));
      setProgress((prev) => ({
        ...prev,
        [platform]: { progress: 0, label: "Initializing AI pipeline…" },
      }));

      try {
        const gimmickPromise = showGimmick
          ? simulateAiGeneration((percent, label) => {
              setProgress((prev) => ({
                ...prev,
                [platform]: { progress: percent, label },
              }));
            })
          : Promise.resolve();

        const [imageUrl] = await Promise.all([
          generateDemoBanner({
            platform,
            variantIndex,
            width,
            height,
            productName,
            headline: pitchAnalysis.headline ?? "",
            tagline: pitchAnalysis.tagline ?? "",
            oneLiner: pitchAnalysis.one_liner ?? "",
          }),
          gimmickPromise,
        ]);

        patchBanners((state) => {
          const updated = {
            ...state,
            initialized: true,
            hasGenerated: true,
            [platform]: {
              ...state[platform],
              imageUrl,
              variantIndex,
            },
          };
          return updated;
        });
      } catch (error) {
        setGenerationFailed((prev) => ({ ...prev, [platform]: true }));
        toast.error(error instanceof Error ? error.message : "Could not compose visual");
      } finally {
        setGenerating((prev) => ({ ...prev, [platform]: false }));
      }
    },
    [
      patchBanners,
      pitchAnalysis.headline,
      pitchAnalysis.one_liner,
      pitchAnalysis.tagline,
      productName,
    ],
  );

  const generateAllFirstTime = useCallback(() => {
    void ensurePostsCreated();
    (["linkedin", "facebook"] as BannerPlatform[]).forEach((platform) => {
      if (!bannersRef.current[platform].imageUrl) {
        void runImageGeneration(platform, { showGimmick: true });
      }
    });
  }, [ensurePostsCreated, runImageGeneration]);

  useEffect(() => {
    if (!isTabActive) return;

    const state = bannersRef.current;

    const hasStoredImages = !!(state.linkedin.imageUrl || state.facebook.imageUrl);
    if (hasStoredImages || state.hasGenerated) return;

    if (autoGenStartedRef.current) return;
    autoGenStartedRef.current = true;
    generateAllFirstTime();
  }, [isTabActive, socialBanners, generateAllFirstTime]);

  const handleAspectChange = useCallback(
    async (platform: BannerPlatform, aspectRatio: BannerAspectRatio) => {
      const item = bannersRef.current[platform];
      const { width, height } = dimensionsForAspect(aspectRatio);

      setGenerating((prev) => ({ ...prev, [platform]: true }));
      setGenerationFailed((prev) => ({ ...prev, [platform]: false }));
      setProgress((prev) => ({
        ...prev,
        [platform]: { progress: 15, label: "Resizing canvas…" },
      }));

      try {
        const gimmickPromise = simulateAiGeneration((percent, label) => {
          setProgress((prev) => ({
            ...prev,
            [platform]: { progress: percent, label },
          }));
        });

        const [imageUrl] = await Promise.all([
          generateDemoBanner({
            platform,
            variantIndex: item.variantIndex,
            width,
            height,
            productName,
            headline: pitchAnalysis.headline ?? "",
            tagline: pitchAnalysis.tagline ?? "",
            oneLiner: pitchAnalysis.one_liner ?? "",
          }),
          gimmickPromise,
        ]);

        patchBanners((state) => ({
          ...state,
          [platform]: { ...state[platform], aspectRatio, imageUrl },
        }));
      } catch (error) {
        setGenerationFailed((prev) => ({ ...prev, [platform]: true }));
        toast.error(error instanceof Error ? error.message : "Could not update aspect ratio");
      } finally {
        setGenerating((prev) => ({ ...prev, [platform]: false }));
      }
    },
    [patchBanners, pitchAnalysis.headline, pitchAnalysis.one_liner, pitchAnalysis.tagline, productName],
  );

  const copyPost = (platform: BannerPlatform) => {
    const item = banners[platform];
    const { text } = resolvePostCopy(item.suggestedPost, pitchAnalysis, userPitch);
    if (!text) return;
    void navigator.clipboard.writeText(text);
    toast.success(`${PLATFORM_LABELS[platform]} post copied`);
  };

  const downloadBanner = (platform: BannerPlatform) => {
    const imageUrl = banners[platform].imageUrl;
    if (!imageUrl) return;
    const filename = `${productName.replace(/\s+/g, "-").toLowerCase()}-${platform}-banner.jpg`;
    downloadDataUrl(imageUrl, filename);
  };

  const renderPreview = (platform: BannerPlatform) => {
    const item = banners[platform];
    const { width, height } = dimensionsForAspect(item.aspectRatio);

    if (item.imageUrl && !generating[platform]) {
      return (
        <img
          src={item.imageUrl}
          alt={`${productName} launch visual for ${PLATFORM_LABELS[platform]}`}
          className="w-full h-auto rounded-lg shadow-lg object-cover animate-in fade-in duration-500"
          style={{ aspectRatio: `${width}/${height}` }}
        />
      );
    }

    const displayProgress = generating[platform]
      ? progress[platform].progress
      : progress[platform].progress || 5;
    const displayLabel =
      generating[platform] && progress[platform].label
        ? progress[platform].label
        : "Initializing AI pipeline…";

    return (
      <AiGeneratingOverlay
        platform={platform}
        aspectRatio={item.aspectRatio}
        progress={displayProgress}
        label={displayLabel}
        failed={generationFailed[platform] && !generating[platform]}
        onRetry={
          generationFailed[platform] && !generating[platform]
            ? () => runImageGeneration(platform, { showGimmick: true })
            : undefined
        }
      />
    );
  };

  return (
    <Card className="border-violet-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Social launch visuals
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Styled launch banners with your product details. Post copy below is written by Gemini.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activePlatform}
          onValueChange={(v) => setActivePlatform(v as BannerPlatform)}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="linkedin" className="gap-1.5">
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="facebook" className="gap-1.5">
              <Facebook className="h-3.5 w-3.5" />
              Facebook
            </TabsTrigger>
          </TabsList>

          {(["linkedin", "facebook"] as BannerPlatform[]).map((platform) => {
            const item = banners[platform];
            const dims = dimensionsForAspect(item.aspectRatio);
            const postDisplay = resolvePostCopy(item.suggestedPost, pitchAnalysis, userPitch);

            return (
              <TabsContent key={platform} value={platform} className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs text-muted-foreground">Aspect ratio</label>
                  <Select
                    value={item.aspectRatio}
                    onValueChange={(v) => void handleAspectChange(platform, v as BannerAspectRatio)}
                    disabled={generating[platform]}
                  >
                    <SelectTrigger className="w-[220px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BANNER_ASPECT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl border overflow-hidden bg-muted/30 p-2">
                  {renderPreview(platform)}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    {dims.width}×{dims.height}px
                  </Badge>
                  <Badge variant="outline">{item.aspectRatio}</Badge>
                  <Badge variant="outline">Launch visual</Badge>
                  {item.imageUrl ? (
                    <Badge variant="secondary">Variant {(item.variantIndex % 3) + 1}/3</Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => downloadBanner(platform)}
                    disabled={!item.imageUrl || generating[platform]}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => runImageGeneration(platform, { bumpVariant: true, showGimmick: true })}
                    disabled={generating[platform]}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>

                {item.imageUrl && !generating[platform] ? (
                  <Card className="border-violet-500/15 bg-violet-500/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          Suggested {PLATFORM_LABELS[platform]} post
                        </p>
                        <Badge variant="outline" className="text-[10px]">
                          {postDisplay.source === "gemini" ? "Generated by Gemini" : "From your pitch"}
                        </Badge>
                      </div>
                      {postLoading[platform] && !item.suggestedPost ? (
                        <p className="text-xs text-muted-foreground">
                          Gemini is writing a tailored post…
                        </p>
                      ) : null}
                      {postDisplay.text ? (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {postDisplay.text}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Add a pitch in Step 1 to use as post copy.
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!postDisplay.text}
                        onClick={() => copyPost(platform)}
                      >
                        <Copy className="h-3.5 w-3.5 mr-2" />
                        Copy post
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>

      <style>{`
        @keyframes banner-scan {
          0%, 100% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </Card>
  );
}
