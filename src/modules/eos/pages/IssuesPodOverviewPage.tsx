/**
 * Issues Pod Overview Page
 *
 * Dashboard showing all pods with their issue counts and stats.
 * Each pod card links to its dedicated issues view.
 * Also shows unassigned issues at the bottom.
 * Route: /eos/issues/pod-overview
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Users, AlertTriangle, Inbox } from "lucide-react";
import { useEOSIssuesByPod } from "../hooks/useEOSIssuesByPod";
import { useUpdateIssue, useDeleteIssue } from "../hooks/useEOSIssues";
import { IssuesTable } from "../components/issues/IssuesTable";
import { IssuesNavTabs } from "../components/issues/IssuesNavTabs";

export default function IssuesPodOverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useEOSIssuesByPod();
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalIssues = data?.totalIssues || 0;
  const totalPods = data?.groups.length || 0;
  const unassignedCount = data?.unassigned.length || 0;
  const criticalCount =
    data?.groups.reduce((sum, g) => sum + g.stats.critical, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Issues by Pod</h1>
        <p className="text-muted-foreground">
          Overview of issues across all pods
        </p>
      </div>
      <IssuesNavTabs />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Issues</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalIssues}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <span className="text-sm text-muted-foreground">Total Pods</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalPods}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Unassigned Issues</span>
            </div>
            <p className="text-2xl font-bold mt-1">{unassignedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Critical Issues</span>
            </div>
            <p className="text-2xl font-bold mt-1">{criticalCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pod Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Pods</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.groups.map((group) => (
            <Card
              key={group.pod.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate(`/eos/issues/pod/${group.pod.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: group.pod.color }}
                  />
                  {group.pod.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {group.stats.total} total
                  </Badge>
                  {group.stats.open > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {group.stats.open} open
                    </Badge>
                  )}
                  {group.stats.in_progress > 0 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {group.stats.in_progress} in progress
                    </Badge>
                  )}
                  {group.stats.solved > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {group.stats.solved} solved
                    </Badge>
                  )}
                  {group.stats.critical > 0 && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {group.stats.critical} critical
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Unassigned Issues */}
      {data?.unassigned && data.unassigned.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Unassigned Issues ({data.unassigned.length})
          </h2>
          <div className="rounded-lg border bg-card">
            <IssuesTable
              issues={data.unassigned}
              onStatusChange={(id, status) => updateIssue.mutate({ id, data: { status } })}
              onDelete={(id) => deleteIssue.mutate(id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
