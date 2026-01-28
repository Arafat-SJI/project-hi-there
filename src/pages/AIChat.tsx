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
import { Brain, MessageSquare, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface AIAgent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_enabled: boolean;
}

export default function AIChat() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  const selectedAgentId = searchParams.get("agent") || "";

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSearchParams({ agent: agents[0].id });
    }
  }, [agents, selectedAgentId, setSearchParams]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id, name, slug, description, is_enabled")
        .eq("is_enabled", true)
        .order("name");

      if (error) throw error;
      setAgents((data || []) as AIAgent[]);
    } catch (error: unknown) {
      console.error("Fetch agents error:", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setSearchParams({ agent: agentId });
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
                      <span className="text-lg">🤖</span>
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

      {/* Notice about AI Chat not being fully configured */}
      <Card className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Chat Not Configured</h3>
          <p className="text-muted-foreground max-w-md">
            The AI Chat feature requires additional database tables (agent_conversations, agent_messages) 
            to be created. Please run the necessary migrations to enable this feature.
          </p>
        </div>
      </Card>
    </div>
  );
}
