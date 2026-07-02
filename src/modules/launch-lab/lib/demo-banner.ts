import type { BannerPlatform } from "../types";

export interface DemoBannerContent {
  productName: string;
  headline: string;
  tagline: string;
  oneLiner: string;
}

export interface DemoBannerOptions extends DemoBannerContent {
  platform: BannerPlatform;
  variantIndex: number;
  width: number;
  height: number;
}

/** Aesthetic demo photos — cycles on regenerate. */
const DEMO_BACKGROUNDS: Record<BannerPlatform, string[]> = {
  linkedin: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80&auto=format&fit=crop",
  ],
  facebook: [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80&auto=format&fit=crop",
  ],
};

const GENERATION_STEPS = [
  { at: 15, label: "Analyzing brand voice…" },
  { at: 28, label: "Mapping audience cues…" },
  { at: 45, label: "Composing visual scene…" },
  { at: 62, label: "Rendering neural layers…" },
  { at: 78, label: "Enhancing color & depth…" },
  { at: 92, label: "Finalizing launch visual…" },
  { at: 100, label: "Complete" },
] as const;

export function getBackgroundCount(platform: BannerPlatform): number {
  return DEMO_BACKGROUNDS[platform].length;
}

export function simulateAiGeneration(
  onProgress: (percent: number, label: string) => void,
): Promise<void> {
  return new Promise((resolve) => {
    let step = 0;
    const tick = () => {
      if (step >= GENERATION_STEPS.length) {
        setTimeout(resolve, 350);
        return;
      }
      const { at, label } = GENERATION_STEPS[step];
      onProgress(at, label);
      step += 1;
      setTimeout(tick, 420 + Math.random() * 180);
    };
    onProgress(0, "Initializing AI pipeline…");
    setTimeout(tick, 300);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Background load failed"));
    img.src = url;
  });
}

function drawProceduralBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  platform: BannerPlatform,
  variant: number,
) {
  const palettes: Record<BannerPlatform, [string, string, string][]> = {
    linkedin: [
      ["#0f172a", "#1e3a5f", "#334155"],
      ["#1e1b4b", "#312e81", "#4338ca"],
      ["#0c4a6e", "#0369a1", "#0ea5e9"],
    ],
    facebook: [
      ["#7c2d12", "#c2410c", "#fb923c"],
      ["#831843", "#be185d", "#f472b6"],
      ["#854d0e", "#ca8a04", "#facc15"],
    ],
  };

  const [c1, c2, c3] = palettes[platform][variant % palettes[platform].length];
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, c1);
  gradient.addColorStop(0.55, c2);
  gradient.addColorStop(1, c3);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(
      width * (0.2 + i * 0.15),
      height * (0.3 + (i % 3) * 0.2),
      80 + i * 40,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

async function drawBackground(
  ctx: CanvasRenderingContext2D,
  platform: BannerPlatform,
  variantIndex: number,
  width: number,
  height: number,
) {
  const urls = DEMO_BACKGROUNDS[platform];
  const url = urls[variantIndex % urls.length];

  try {
    const img = await loadImage(url);
    const scale = Math.max(width / img.width, height / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.drawImage(img, (width - sw) / 2, (height - sh) / 2, sw, sh);
  } catch {
    drawProceduralBackground(ctx, width, height, platform, variantIndex);
  }

  const overlay = ctx.createLinearGradient(0, 0, 0, height);
  if (platform === "linkedin") {
    overlay.addColorStop(0, "rgba(15, 23, 42, 0.35)");
    overlay.addColorStop(0.5, "rgba(15, 23, 42, 0.2)");
    overlay.addColorStop(1, "rgba(15, 23, 42, 0.88)");
  } else {
    overlay.addColorStop(0, "rgba(124, 45, 18, 0.25)");
    overlay.addColorStop(0.5, "rgba(124, 45, 18, 0.15)");
    overlay.addColorStop(1, "rgba(88, 28, 12, 0.9)");
  }
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  platform: BannerPlatform,
  content: DemoBannerContent,
) {
  const pad = width * 0.07;
  const accent = platform === "linkedin" ? "#38bdf8" : "#fbbf24";
  const subtitle = content.tagline.trim() || content.oneLiner.trim() || "Ready to launch";

  ctx.fillStyle = accent;
  ctx.fillRect(pad, height * 0.58, 48, 4);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `600 ${Math.round(width * 0.022)}px system-ui, sans-serif`;
  ctx.fillText("LAUNCH VISUAL", pad, height * 0.54);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(width * 0.052)}px system-ui, sans-serif`;
  const titleLines = wrapText(ctx, content.productName, width - pad * 2, 2);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, pad, height * 0.66 + i * width * 0.055);
  });

  const headlineY = height * 0.66 + titleLines.length * width * 0.055 + width * 0.02;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `500 ${Math.round(width * 0.028)}px system-ui, sans-serif`;
  const headlineLines = wrapText(ctx, content.headline, width - pad * 2, 2);
  headlineLines.forEach((line, i) => {
    ctx.fillText(line, pad, headlineY + i * width * 0.034);
  });

  const tagY = headlineY + headlineLines.length * width * 0.034 + width * 0.025;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `italic ${Math.round(width * 0.022)}px system-ui, sans-serif`;
  const tagLines = wrapText(ctx, subtitle, width - pad * 2, 2);
  tagLines.forEach((line, i) => {
    ctx.fillText(line, pad, tagY + i * width * 0.028);
  });
}

export async function generateDemoBanner(options: DemoBannerOptions): Promise<string> {
  const { platform, variantIndex, width, height, ...content } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create banner canvas");

  await drawBackground(ctx, platform, variantIndex, width, height);
  drawTextOverlay(ctx, width, height, platform, content);

  return canvas.toDataURL("image/jpeg", 0.85);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
