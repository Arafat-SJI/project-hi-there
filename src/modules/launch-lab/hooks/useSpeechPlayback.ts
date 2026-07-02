import { useCallback, useEffect, useRef, useState } from "react";

type PlaybackState = "idle" | "playing" | "paused";

export interface SpeechPlaybackControls {
  activeId: string | null;
  playbackState: PlaybackState;
  toggle: (id: string, text: string) => void;
  getState: (id: string) => PlaybackState;
  clearPlayback: () => void;
}

function getSynth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis
    : null;
}

export function useSpeechPlayback(): SpeechPlaybackControls {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");

  const activeIdRef = useRef<string | null>(null);
  const playbackStateRef = useRef<PlaybackState>("idle");
  const sessionRef = useRef(0);
  const pendingPauseRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const syncState = useCallback((id: string | null, state: PlaybackState) => {
    activeIdRef.current = id;
    playbackStateRef.current = state;
    setActiveId(id);
    setPlaybackState(state);
  }, []);

  const resetPlayback = useCallback(
    (session: number) => {
      if (sessionRef.current !== session) return;
      utteranceRef.current = null;
      pendingPauseRef.current = false;
      syncState(null, "idle");
    },
    [syncState],
  );

  const clearPlayback = useCallback(() => {
    const synth = getSynth();
    sessionRef.current += 1;
    pendingPauseRef.current = false;
    utteranceRef.current = null;
    synth?.cancel();
    syncState(null, "idle");
  }, [syncState]);

  const ensureVoicesReady = useCallback((callback: () => void) => {
    const synth = getSynth();
    if (!synth) return;

    if (synth.getVoices().length > 0) {
      callback();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", finish);
      callback();
    };

    synth.addEventListener("voiceschanged", finish);
    window.setTimeout(finish, 300);
  }, []);

  const startSpeaking = useCallback(
    (id: string, text: string) => {
      const synth = getSynth();
      const trimmed = text.trim();
      if (!synth || !trimmed) return;

      const session = sessionRef.current + 1;
      sessionRef.current = session;
      pendingPauseRef.current = false;

      synth.cancel();
      syncState(id, "playing");

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.rate = 0.95;
      utteranceRef.current = utterance;

      utterance.onstart = () => {
        if (sessionRef.current !== session) return;
        syncState(id, "playing");
        if (pendingPauseRef.current) {
          synth.pause();
          syncState(id, "paused");
          pendingPauseRef.current = false;
        }
      };

      utterance.onend = () => {
        resetPlayback(session);
      };

      utterance.onerror = (event) => {
        // cancel() triggers "interrupted" — ignore stale sessions only
        if (sessionRef.current !== session) return;
        if (event.error === "interrupted") return;
        resetPlayback(session);
      };

      ensureVoicesReady(() => {
        if (sessionRef.current !== session) return;
        synth.speak(utterance);

        // Chrome occasionally queues speech in a paused state
        if (synth.paused) {
          synth.resume();
        }
      });
    },
    [ensureVoicesReady, resetPlayback, syncState],
  );

  const toggle = useCallback(
    (id: string, text: string) => {
      const synth = getSynth();
      if (!synth) return;

      const currentId = activeIdRef.current;
      const currentState = playbackStateRef.current;

      if (currentId === id) {
        if (currentState === "playing") {
          if (synth.speaking && !synth.paused) {
            synth.pause();
            pendingPauseRef.current = false;
            syncState(id, "paused");
          } else {
            pendingPauseRef.current = true;
            syncState(id, "paused");
          }
          return;
        }

        if (currentState === "paused") {
          pendingPauseRef.current = false;
          if (synth.speaking) {
            synth.resume();
            syncState(id, "playing");
            return;
          }
          startSpeaking(id, text);
          return;
        }
      }

      startSpeaking(id, text);
    },
    [startSpeaking, syncState],
  );

  const getState = useCallback(
    (id: string): PlaybackState => {
      if (activeId !== id) return "idle";
      return playbackState;
    },
    [activeId, playbackState],
  );

  useEffect(() => {
    const synth = getSynth();
    if (!synth) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && playbackStateRef.current === "playing") {
        synth.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      sessionRef.current += 1;
      synth.cancel();
    };
  }, []);

  return { activeId, playbackState, toggle, getState, clearPlayback };
}
