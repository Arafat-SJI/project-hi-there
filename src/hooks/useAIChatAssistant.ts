import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ChatOptions {
  agent_slug?: string;
  include_history?: boolean;
  max_tokens?: number;
  temperature?: number;
  model_id?: string;
}

export function useAIChatAssistant(initialMessage?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessage) {
      return [
        {
          id: "1",
          role: "assistant",
          content: initialMessage,
          timestamp: new Date(),
        },
      ];
    }
    return [
      {
        id: "1",
        role: "assistant",
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);

  const sendMessage = useCallback(
    async (content: string, options: ChatOptions = {}) => {
      if (!content.trim() || !user) {
        toast.error("Please enter a message");
        return null;
      }

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Call ai-chat-assistant edge function
        const { data, error } = await supabase.functions.invoke("ai-chat-assistant", {
          body: {
            message: content,
            session_id: sessionId,
            user_id: user.id,
            include_history: options.include_history ?? true,
            agent_slug: options.agent_slug,
            max_tokens: options.max_tokens,
            temperature: options.temperature,
            model_id: options.model_id,
          },
        });

        if (error) throw error;

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || "Sorry, I couldn't generate a response.",
          timestamp: new Date(),
          metadata: data.metadata,
        };

        setMessages((prev) => [...prev, aiMessage]);
        return aiMessage;
      } catch (error: any) {
        console.error("AI Chat error:", error);

        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${
            error.message ||
            "Failed to connect to AI assistant. Please ensure the edge function is deployed and OPENAI_API_KEY is configured."
          }`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);

        toast.error("Failed to get AI response. Check deployment status.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, sessionId]
  );

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    sendMessage,
    clearHistory,
    removeMessage,
  };
}
