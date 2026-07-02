import { useCallback, useRef, useState } from "react";
import { Download, Facebook, Linkedin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { PitchAnalysis } from "../types";

type BannerPlatform = "linkedin" | "facebook";

const BANNER_SPECS: Record<
  BannerPlatform,
  { width: number; height: number; label: string; aspect: string }
> = {
  linkedin: { width: 1200, height: 627, label: "LinkedIn", aspect: "1.91:1" },
  facebook: { width: 1200, height: 630, label: "Facebook", aspect: "1.9:1" },
};

interface SocialBannerGeneratorProps {
  productName: string;
  pitchAnalysis: PitchAnalysis;
}

function drawBanner(
  canvas: HTMLCanvasElement,
  platform: BannerPlatform,
  productName: string,
  pitchAnalysis: PitchAnalysis,
) {
  const spec = BANNER_SPECS[platform];
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = spec.width;
  canvas.height = spec.height;

  const gradient = ctx.createLinearGradient(0, 0, spec.width, spec.height);
  gradient.addColorStop(0, "#4f46e5");
  gradient.addColorStop(0.45, "#7c3aed");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, spec.width, spec.height);

  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(
      spec.width * (0.1 + i * 0.18),
      spec.height * (0.2 + (i % 3) * 0.25),
      120 + i * 30,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const headline = pitchAnalysis.headline || productName || "Launch announcement";
  const tagline = pitchAnalysis.tagline || pitchAnalysis.one_liner || "";
  const score = pitchAnalysis.overall;

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText("LAUNCHING SOON", 72, 80);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px system-ui, sans-serif";
  wrapText(ctx, headline, 72, 170, spec.width - 144, 72);

  if (tagline) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "32px system-ui, sans-serif";
    wrapText(ctx, tagline, 72, 320, spec.width - 144, 42);
  }

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  roundRect(ctx, 72, spec.height - 120, 200, 56, 12);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.fillText(`Score ${score}`, 96, spec.height - 84);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "24px system-ui, sans-serif";
  ctx.fillText(productName, 72, spec.height - 36);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "20px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`Optimized for ${spec.label}`, spec.width - 72, spec.height - 36);
  ctx.textAlign = "left";
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[i] + " ";
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function BannerPreview({
  platform,
  productName,
  pitchAnalysis,
  onCanvasReady,
}: {
  platform: BannerPlatform;
  productName: string;
  pitchAnalysis: PitchAnalysis;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}) {
  const spec = BANNER_SPECS[platform];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border overflow-hidden bg-muted/30 p-2">
        <canvas
          ref={(el) => {
            if (el) {
              drawBanner(el, platform, productName, pitchAnalysis);
              onCanvasReady(el);
            }
          }}
          className="w-full h-auto rounded-lg shadow-lg"
          style={{ aspectRatio: `${spec.width}/${spec.height}` }}
        />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">{spec.width}×{spec.height}px</Badge>
        <Badge variant="outline">{spec.aspect}</Badge>
        <Badge variant="outline">{spec.label} post</Badge>
      </div>
    </div>
  );
}

export function SocialBannerGenerator({
  productName,
  pitchAnalysis,
}: SocialBannerGeneratorProps) {
  const [activePlatform, setActivePlatform] = useState<BannerPlatform>("linkedin");
  const canvasStore = useRef<Record<BannerPlatform, HTMLCanvasElement | null>>({
    linkedin: null,
    facebook: null,
  });

  const handleCanvasReady = useCallback((platform: BannerPlatform, canvas: HTMLCanvasElement) => {
    canvasStore.current[platform] = canvas;
  }, []);

  const downloadBanner = (platform: BannerPlatform) => {
    const canvas = canvasStore.current[platform];
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${productName.replace(/\s+/g, "-").toLowerCase()}-${platform}-banner.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Card className="border-violet-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Social launch banners
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Auto-generated from your headline and tagline — download and post on LinkedIn or Facebook.
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

          {(["linkedin", "facebook"] as BannerPlatform[]).map((platform) => (
            <TabsContent key={platform} value={platform} className="space-y-4">
              <BannerPreview
                platform={platform}
                productName={productName}
                pitchAnalysis={pitchAnalysis}
                onCanvasReady={(canvas) => handleCanvasReady(platform, canvas)}
              />
              <Button type="button" onClick={() => downloadBanner(platform)} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Download {BANNER_SPECS[platform].label} banner
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
