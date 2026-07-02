import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import type {
  CanvasAgentResponse,
  CanvasGenerateInput,
  PitchAgentResponse,
  PitchAnalyzeInput,
  SocialPostAgentResponse,
  SocialPostGenerateInput,
} from "../types";

export function useAnalyzePitch() {
  return useMutation({
    mutationFn: async (input: PitchAnalyzeInput) => {
      const data = await invokeEdgeFunction<PitchAgentResponse>("launch-lab-agent", {
        mode: "pitch",
        ...input,
      });
      return data;
    },
    onError: (error: Error) => {
      toast.error("Pitch analysis failed", { description: error.message });
    },
  });
}

export function useGenerateCanvas() {
  return useMutation({
    mutationFn: async (input: CanvasGenerateInput) => {
      const data = await invokeEdgeFunction<CanvasAgentResponse>("launch-lab-agent", {
        mode: "canvas",
        ...input,
      });
      return data;
    },
    onError: (error: Error) => {
      toast.error("Canvas generation failed", { description: error.message });
    },
  });
}

export function useGenerateSocialPost() {
  return useMutation({
    mutationFn: async (input: SocialPostGenerateInput) => {
      const data = await invokeEdgeFunction<SocialPostAgentResponse>("launch-lab-agent", {
        mode: "social-post",
        ...input,
      });
      return data;
    },
    onError: (error: Error) => {
      toast.error("Could not generate post copy", { description: error.message });
    },
  });
}
