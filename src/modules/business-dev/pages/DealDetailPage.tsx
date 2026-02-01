/**
 * Deal Detail Page - Tabbed view with activities and comments
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, Calendar, User, Building2, MessageSquare, Activity, Loader2, ChevronRight } from "lucide-react";
import { useDeal, useDealActivities, useDealComments, useAddDealComment, useUpdateDealStage } from "../hooks/useDeals";
import type { DealStage } from "../types";

const STAGE_CONFIG: Record<DealStage, { label: string; color: string }> = {
  lead: { label: "Lead", color: "#6b7280" },
  discovery: { label: "Discovery", color: "#3b82f6" },
  estimation: { label: "Estimation", color: "#8b5cf6" },
  proposal: { label: "Proposal", color: "#f59e0b" },
  won: { label: "Won", color: "#22c55e" },
  lost: { label: "Lost", color: "#ef4444" },
};

const STAGES: DealStage[] = ["lead", "discovery", "estimation", "proposal", "won", "lost"];

export default function DealDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [newComment, setNewComment] = useState("");

  const { data: deal, isLoading } = useDeal(slug!);
  const { data: activities = [] } = useDealActivities(deal?.id || "");
  const { data: comments = [] } = useDealComments(deal?.id || "");
  const addComment = useAddDealComment();
  const updateStage = useUpdateDealStage();

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Deal not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/deals")}>Back to Deals</Button>
      </div>
    );
  }

  const currentStageIdx = STAGES.indexOf(deal.stage);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addComment.mutate({ dealId: deal.id, content: newComment.trim() });
    setNewComment("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/deals")}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{deal.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge style={{ backgroundColor: `${STAGE_CONFIG[deal.stage]?.color}20`, color: STAGE_CONFIG[deal.stage]?.color, borderColor: STAGE_CONFIG[deal.stage]?.color }} variant="outline">
              {STAGE_CONFIG[deal.stage]?.label}
            </Badge>
            {deal.client && <span className="text-sm text-muted-foreground">{deal.client.name}</span>}
          </div>
        </div>
      </div>

      {/* Stage progress bar */}
      <div className="flex items-center gap-1">
        {STAGES.map((stage, idx) => {
          const cfg = STAGE_CONFIG[stage];
          const isActive = idx <= currentStageIdx;
          const isCurrent = stage === deal.stage;
          return (
            <button
              key={stage}
              className={`flex-1 h-8 rounded text-xs font-medium transition-colors flex items-center justify-center ${isCurrent ? "ring-2 ring-offset-1" : ""}`}
              style={{
                backgroundColor: isActive ? cfg.color : `${cfg.color}15`,
                color: isActive ? "#fff" : cfg.color,
                ringColor: isCurrent ? cfg.color : undefined,
              }}
              onClick={() => updateStage.mutate({ id: deal.id, stage })}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Deal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {deal.description && <p className="text-sm text-muted-foreground">{deal.description}</p>}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Value</p>
                      <p className="font-medium">{deal.value ? `${deal.currency} ${deal.value.toLocaleString()}` : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Probability</p>
                      <p className="font-medium">{deal.probability}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Expected Close</p>
                      <p className="font-medium">{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Owner</p>
                      <p className="font-medium">{deal.owner?.full_name || "Unassigned"}</p>
                    </div>
                  </div>
                  {deal.source && (
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Source</p>
                        <p className="font-medium">{deal.source}</p>
                      </div>
                    </div>
                  )}
                  {deal.contact && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Contact</p>
                        <p className="font-medium">{deal.contact.first_name} {deal.contact.last_name || ""}</p>
                      </div>
                    </div>
                  )}
                </div>
                {deal.closed_at && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-sm text-muted-foreground">
                      Closed on {new Date(deal.closed_at).toLocaleDateString()}
                      {deal.lost_reason && <> — Reason: {deal.lost_reason}</>}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activities yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((a) => (
                      <div key={a.id} className="text-sm border-l-2 pl-3 py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{a.activity_type}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-muted-foreground mt-1">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No activities recorded.</p>
          ) : (
            <div className="space-y-2">
              {activities.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-start gap-3 py-3 px-4">
                    <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{a.activity_type}</Badge>
                        {a.user && <span className="text-xs text-muted-foreground">{a.user.full_name}</span>}
                      </div>
                      <p className="text-sm mt-1">{a.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleDateString()}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
            />
            <Button size="sm" disabled={!newComment.trim()} onClick={handleSubmitComment}>
              <MessageSquare className="h-4 w-4 mr-1" />Post
            </Button>
          </div>
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No comments yet.</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <Card key={c.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{c.user?.full_name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
