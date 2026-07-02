import { Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SpeechPlaybackControls } from "../hooks/useSpeechPlayback";

interface SpeechPlaybackButtonProps {
  id: string;
  text: string;
  playback: SpeechPlaybackControls;
  variant?: "icon" | "button";
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function SpeechPlaybackButton({
  id,
  text,
  playback,
  variant = "button",
  label = "Listen",
  className,
  disabled = false,
}: SpeechPlaybackButtonProps) {
  const state = playback.activeId === id ? playback.playbackState : "idle";
  const isPlaying = state === "playing";
  const isPaused = state === "paused";
  const isActive = isPlaying || isPaused;

  const title = isPlaying ? "Pause" : isPaused ? "Resume" : "Play aloud";
  const Icon = isPlaying ? Pause : isPaused ? Play : Volume2;

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        title={title}
        aria-label={title}
        onClick={() => playback.toggle(id, text)}
        disabled={disabled || !text.trim()}
        className={cn(isActive && "border-primary/50 bg-primary/5", className)}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => playback.toggle(id, text)}
      disabled={disabled || !text.trim()}
      className={cn(isActive && "border-primary/50 bg-primary/5", className)}
    >
      <Icon className="h-4 w-4 mr-2" />
      {isPlaying ? "Pause" : isPaused ? "Resume" : label}
    </Button>
  );
}
