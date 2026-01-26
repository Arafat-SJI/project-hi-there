import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { queryKeys, invalidateKeys } from "@/lib/cache";

export interface StreamingState {
  isStreaming: boolean;
  streamedContent: string;
  toolCalls: ToolCall[];
  error: string | null;
  tokenCount: number;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: "pending" | "executing" | "completed" | "failed";
  result?: unknown;
  startedAt: Date;
  completedAt?: Date;
}

export interface StreamEvent {
  type: "start" | "token" | "tool_use" | "tool_result" | "complete" | "error";
  data: unknown;
}

interface UseAgentChatStreamOptions {
  onToken?: (token: string) => void;
  onToolUse?: (tool: ToolCall) => void;
  onComplete?: (fullMessage: string) => void;
  onError?: (error: string) => void;
}

export function useAgentChatStream(options: UseAgentChatStreamOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamedContent: "",
    toolCalls: [],
    error: null,
    tokenCount: 0,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  const sendMessage = useCallback(
    async ({
      conversationId,
      agentId,
      message,
      modelId,
    }: {
      conversationId: string;
      agentId: string;
      message: string;
      modelId?: string;
    }) => {
      if (!user) {
        toast.error("You must be logged in to send messages");
        return;
      }

      // Reset state
      setState({
        isStreaming: true,
        streamedContent: "",
        toolCalls: [],
        error: null,
        tokenCount: 0,
      });

      abortControllerRef.current = new AbortController();

      try {
        // First, insert the user message
        const { error: insertError } = await supabase
          .from("agent_messages")
          .insert({
            conversation_id: conversationId,
            role: "user",
            content: message,
          });

        if (insertError) throw insertError;

        // Get Supabase URL and key for SSE request
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        // Get auth token
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        // Build SSE URL
        const params = new URLSearchParams({
          conversation_id: conversationId,
          agent_id: agentId,
          message: message,
          user_id: user.id,
        });

        if (modelId) {
          params.append("model_id", modelId);
        }

        const sseUrl = `${supabaseUrl}/functions/v1/agent-chat-stream?${params.toString()}`;

        // Use fetch with ReadableStream for SSE
        const response = await fetch(sseUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseKey,
          },
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        if (!reader) {
          throw new Error("No response body");
        }

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("event:")) {
              // Event type line, next data line will be the payload
              continue;
            }

            if (line.startsWith("data:")) {
              const data = line.slice(5).trim();

              if (data === "[DONE]") {
                // Stream complete
                setState((prev) => ({
                  ...prev,
                  isStreaming: false,
                }));
                options.onComplete?.(fullContent);

                // Invalidate queries to refresh data
                invalidateKeys.messages(queryClient, conversationId);
                invalidateKeys.conversations(queryClient, agentId);
                continue;
              }

              try {
                const event = JSON.parse(data) as StreamEvent;

                switch (event.type) {
                  case "token":
                    const token = event.data as string;
                    fullContent += token;
                    setState((prev) => ({
                      ...prev,
                      streamedContent: fullContent,
                      tokenCount: prev.tokenCount + 1,
                    }));
                    options.onToken?.(token);
                    break;

                  case "tool_use":
                    const toolCall = event.data as ToolCall;
                    setState((prev) => ({
                      ...prev,
                      toolCalls: [...prev.toolCalls, toolCall],
                    }));
                    options.onToolUse?.(toolCall);
                    break;

                  case "tool_result":
                    const { id, result, status } = event.data as {
                      id: string;
                      result: unknown;
                      status: ToolCall["status"];
                    };
                    setState((prev) => ({
                      ...prev,
                      toolCalls: prev.toolCalls.map((tc) =>
                        tc.id === id
                          ? { ...tc, result, status, completedAt: new Date() }
                          : tc
                      ),
                    }));
                    break;

                  case "error":
                    const errorMsg = event.data as string;
                    setState((prev) => ({
                      ...prev,
                      isStreaming: false,
                      error: errorMsg,
                    }));
                    options.onError?.(errorMsg);
                    toast.error(errorMsg);
                    break;

                  case "complete":
                    const completeData = event.data as {
                      fullMessage: string;
                      metadata?: Record<string, unknown>;
                    };
                    fullContent = completeData.fullMessage;
                    setState((prev) => ({
                      ...prev,
                      streamedContent: fullContent,
                      isStreaming: false,
                    }));
                    options.onComplete?.(fullContent);

                    // Invalidate queries
                    invalidateKeys.messages(queryClient, conversationId);
                    invalidateKeys.conversations(queryClient, agentId);
                    break;
                }
              } catch (parseError) {
                // Not valid JSON, might be a partial message
                console.debug("Skipping non-JSON data:", data);
              }
            }
          }
        }
      } catch (error: unknown) {
        if ((error as Error).name === "AbortError") {
          // User cancelled, don't show error
          setState((prev) => ({ ...prev, isStreaming: false }));
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Stream error";
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorMessage,
        }));
        options.onError?.(errorMessage);
        toast.error(errorMessage);
      }
    },
    [user, queryClient, options]
  );

  return {
    ...state,
    sendMessage,
    stopStreaming,
  };
}

// Non-streaming fallback hook that mimics streaming UI
export function useAgentChatWithTypingEffect() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamedContent: "",
    toolCalls: [],
    error: null,
    tokenCount: 0,
  });

  const sendMessage = useCallback(
    async ({
      conversationId,
      agentId,
      message,
      modelId,
    }: {
      conversationId: string;
      agentId: string;
      message: string;
      modelId?: string;
    }) => {
      if (!user) {
        toast.error("You must be logged in to send messages");
        return;
      }

      setState({
        isStreaming: true,
        streamedContent: "",
        toolCalls: [],
        error: null,
        tokenCount: 0,
      });

      try {
        // Insert user message
        await supabase.from("agent_messages").insert({
          conversation_id: conversationId,
          role: "user",
          content: message,
        });

        // Call non-streaming API
        const { data, error } = await supabase.functions.invoke(
          "agent-conversation-chat",
          {
            body: {
              conversation_id: conversationId,
              agent_id: agentId,
              message,
              user_id: user.id,
              model_id: modelId,
            },
          }
        );

        if (error) throw error;

        // Simulate typing effect
        const fullResponse = data.response as string;
        let currentIndex = 0;

        const typeInterval = setInterval(() => {
          if (currentIndex < fullResponse.length) {
            const chunkSize = Math.min(
              3 + Math.floor(Math.random() * 5), // 3-7 chars at a time
              fullResponse.length - currentIndex
            );
            currentIndex += chunkSize;

            setState((prev) => ({
              ...prev,
              streamedContent: fullResponse.slice(0, currentIndex),
              tokenCount: currentIndex,
            }));
          } else {
            clearInterval(typeInterval);
            setState((prev) => ({
              ...prev,
              isStreaming: false,
            }));

            // Insert assistant message
            supabase.from("agent_messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullResponse,
              model_used: data.model_used,
              provider_used: data.provider_used,
              tokens_input: data.tokens_input,
              tokens_output: data.tokens_output,
              latency_ms: data.latency_ms,
            });

            // Invalidate queries
            invalidateKeys.messages(queryClient, conversationId);
            invalidateKeys.conversations(queryClient, agentId);
          }
        }, 20); // ~50 chars per second
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send message";
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorMessage,
        }));
        toast.error(errorMessage);
      }
    },
    [user, queryClient]
  );

  const stopStreaming = useCallback(() => {
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return {
    ...state,
    sendMessage,
    stopStreaming,
  };
}
