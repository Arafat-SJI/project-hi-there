import { useState, useRef, useEffect, FormEvent } from "react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  Bot,
  Loader2,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import {
  useAgentMessages,
  useAgentConversation,
  useSendMessage,
  AgentMessage,
} from "@/hooks/useAgentConversations";
import {
  useAgentChatModels,
  persistAgentChatModelChoice,
} from "@/hooks/useAIModelPolicy";
import { ModelSelect } from "@/components/ai/ModelSelect";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgentConversationViewProps {
  conversationId: string;
  agentId: string;
}

export function AgentConversationView({
  conversationId,
  agentId,
}: AgentConversationViewProps) {
  const { profile } = useAuth();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: conversationLoading } =
    useAgentConversation(conversationId);
  const { data: messages, isLoading: messagesLoading } =
    useAgentMessages(conversationId);
  const sendMessage = useSendMessage();

  const {
    visibleModels,
    resolvedModelId,
    showPicker,
    isLoading: modelsLoading,
    policy,
  } = useAgentChatModels();

  useEffect(() => {
    if (resolvedModelId) {
      setSelectedModel(resolvedModelId);
    }
  }, [resolvedModelId]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    if (policy?.selection_mode === "user_choice") {
      persistAgentChatModelChoice(modelId);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const messageContent = input;
    setInput("");

    try {
      await sendMessage.mutateAsync({
        conversation_id: conversationId,
        agent_id: agentId,
        content: messageContent,
        model_id: selectedModel || resolvedModelId || undefined,
        memory_enabled: (agent as any)?.memory_enabled ?? false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send message. Please try again.";
      toast.error(message);
      setInput(messageContent);
    }
  };

  const handleCopyMessage = async (message: AgentMessage) => {
    await navigator.clipboard.writeText(message.content);
    setCopiedMessageId(message.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleConversationStarter = (starter: string) => {
    setInput(starter);
  };

  const agent = conversation?.ai_agents;
  const conversationStarters = (agent as any)?.conversation_starters || [];
  const welcomeMessage = (agent as any)?.welcome_message;

  const isLoading = conversationLoading || messagesLoading || modelsLoading;
  const hasMessages = messages && messages.length > 0;
  const activeModel =
    visibleModels.find((m) => m.id === selectedModel) ??
    visibleModels.find((m) => m.id === resolvedModelId);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {agent?.avatar || <Bot className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-semibold">{agent?.name || "AI Assistant"}</h2>
              {conversation?.title && (
                <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                  {conversation.title}
                </p>
              )}
            </div>
          </div>

          {showPicker && selectedModel && (
            <ModelSelect
              models={visibleModels}
              value={selectedModel}
              onChange={handleModelChange}
            />
          )}

          {!showPicker && activeModel && (
            <p className="text-sm text-muted-foreground shrink-0">
              Using {activeModel.provider_name} — {activeModel.name}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Welcome message if no messages yet */}
            {!hasMessages && (
              <div className="flex flex-col items-center justify-center py-8">
                <Avatar className="h-16 w-16 mb-4">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {agent?.avatar || <Bot className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold mb-2">
                  {agent?.name || "AI Assistant"}
                </h3>
                {welcomeMessage && (
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    {welcomeMessage}
                  </p>
                )}
                {agent?.description && !welcomeMessage && (
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    {agent.description}
                  </p>
                )}

                {/* Conversation starters */}
                {conversationStarters.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {conversationStarters.map((starter: string, i: number) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-sm"
                        onClick={() => handleConversationStarter(starter)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {starter}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Message list */}
            {messages?.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "group flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {agent?.avatar || <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "relative max-w-[80%] rounded-lg p-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-table:text-xs prose-headings:mb-1 prose-headings:mt-2 prose-strong:font-semibold">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-70">
                      {format(new Date(message.created_at), "h:mm a")}
                    </p>

                    {message.role === "assistant" && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyMessage(message)}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Token/latency info for assistant messages */}
                  {message.role === "assistant" &&
                    (message.tokens_output || message.latency_ms) && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {message.tokens_output && (
                          <span>{message.tokens_output} tokens</span>
                        )}
                        {message.tokens_output && message.latency_ms && (
                          <span>·</span>
                        )}
                        {message.latency_ms && (
                          <span>{(message.latency_ms / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                    )}

                  {message.role === "assistant" &&
                    message.metadata &&
                    (message.metadata.mcp_tool_error ||
                      message.metadata.mcp_tools_called) && (
                      <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        {Array.isArray(message.metadata.mcp_tools_called) &&
                        message.metadata.mcp_tools_called.length > 0 ? (
                          <span>
                            MCP: {message.metadata.mcp_tools_called.join(", ")}
                          </span>
                        ) : null}
                        {typeof message.metadata.mcp_tool_error === "string" ? (
                          <span className="block truncate">
                            {message.metadata.mcp_tool_error}
                          </span>
                        ) : null}
                      </div>
                    )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      {getInitials(profile?.full_name || "U")}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Loading indicator for pending message */}
            {sendMessage.isPending && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {agent?.avatar || <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={sendMessage.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={sendMessage.isPending || !input.trim()}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
