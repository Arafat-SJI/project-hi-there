import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Brain, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AgentConversationList } from "@/components/ai/AgentConversationList";
import { AgentConversationView } from "@/components/ai/AgentConversationView";
import { useCreateConversation } from "@/hooks/useAgentConversations";

interface AIAgent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar: string | null;
  welcome_message: string | null;
  conversation_starters: string[] | null;
  is_enabled: boolean;
}

export default function AIChat() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // URL-driven state for agent and conversation selection
  const selectedAgentId = searchParams.get("agent") || "";
  const selectedConversationId = searchParams.get("conversation") || null;

  const createConversation = useCreateConversation();

  useEffect(() => {
    fetchAgents();
  }, []);

  // Auto-select first agent if none selected
  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSearchParams({ agent: agents[0].id });
    }
  }, [agents, selectedAgentId, setSearchParams]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id, name, slug, description, avatar, welcome_message, conversation_starters, is_enabled")
        .eq("is_enabled", true)
        .order("name");

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      console.error("Fetch agents error:", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    // When changing agent, clear conversation selection
    setSearchParams({ agent: agentId });
  };

  const handleConversationSelect = (conversationId: string | null) => {
    if (conversationId) {
      setSearchParams({ agent: selectedAgentId, conversation: conversationId });
    } else {
      setSearchParams({ agent: selectedAgentId });
    }
  };

  const handleNewConversation = async () => {
    if (!selectedAgentId) return;

    try {
      const conversation = await createConversation.mutateAsync({
        agent_id: selectedAgentId,
      });
      handleConversationSelect(conversation.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Chat</h1>
          <p className="text-muted-foreground">
            Chat with AI agents to get insights and assistance
          </p>
        </div>
        {agents.length > 0 && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            {agents.length} agents available
          </Badge>
        )}
      </div>

      {/* Agent Selector */}
      {agents.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Select AI Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAgentId} onValueChange={handleAgentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{agent.avatar || "🤖"}</span>
                      <div className="flex flex-col">
                        <span>{agent.name}</span>
                        {agent.description && (
                          <span className="text-xs text-muted-foreground">
                            {agent.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Main Chat Area */}
      {selectedAgentId ? (
        <Card className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Conversation List Panel */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <AgentConversationList
                agentId={selectedAgentId}
                agentName={selectedAgent?.name}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleConversationSelect}
                onNewConversation={handleNewConversation}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Chat Panel */}
            <ResizablePanel defaultSize={75}>
              {selectedConversationId ? (
                <AgentConversationView
                  conversationId={selectedConversationId}
                  agentId={selectedAgentId}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center p-8">
                  <div className="bg-muted/30 rounded-full p-6 mb-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedAgent?.name || "AI Assistant"}
                  </h3>
                  {selectedAgent?.description && (
                    <p className="text-muted-foreground max-w-md mb-4">
                      {selectedAgent.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Select a conversation from the list or start a new one
                  </p>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <Brain className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select an AI Agent</h3>
            <p className="text-muted-foreground">
              {loadingAgents
                ? "Loading agents..."
                : agents.length === 0
                ? "No agents available. Create one in the AI Agents page."
                : "Choose an agent from the dropdown above to start chatting"}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
