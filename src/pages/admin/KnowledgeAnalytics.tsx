import { useKnowledgeEntries, useKnowledgeCategories } from "@/modules/knowledge/hooks/useKnowledge";
import { useEmbeddingStats } from "@/modules/knowledge/hooks/useKnowledgeAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileText,
  Eye,
  Clock,
  Sparkles,
  TrendingUp,
  FolderTree,
  Calendar,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useMemo } from "react";

export default function KnowledgeAnalytics() {
  const { data: entries = [], isLoading: entriesLoading } = useKnowledgeEntries({});
  const { data: categories = [] } = useKnowledgeCategories();
  const { data: embeddingStats, isLoading: statsLoading } = useEmbeddingStats();

  const analytics = useMemo(() => {
    // Most viewed articles
    const mostViewed = [...entries]
      .filter((e) => e.status === "published" && e.view_count)
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 10);

    // Recently updated
    const recentlyUpdated = [...entries]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);

    // Category distribution
    const categoryDist = categories.map((cat) => ({
      category: cat,
      count: entries.filter((e) => e.category_id === cat.id).length,
    }));

    // Content freshness (last 30 days, 60 days, 90+ days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const fresh = entries.filter((e) => new Date(e.updated_at) > thirtyDaysAgo).length;
    const moderate = entries.filter(
      (e) =>
        new Date(e.updated_at) > sixtyDaysAgo &&
        new Date(e.updated_at) <= thirtyDaysAgo
    ).length;
    const stale = entries.filter((e) => new Date(e.updated_at) <= sixtyDaysAgo).length;

    // Status breakdown
    const published = entries.filter((e) => e.status === "published").length;
    const draft = entries.filter((e) => e.status === "draft").length;
    const archived = entries.filter((e) => e.status === "archived").length;

    // Total views
    const totalViews = entries.reduce((sum, e) => sum + (e.view_count || 0), 0);

    // Average reading time (calculated from content length)
    const avgReadingTime =
      entries.reduce((sum, e) => sum + Math.ceil((e.content?.split(/\s+/).length || 0) / 200), 0) /
        (entries.length || 1);

    return {
      mostViewed,
      recentlyUpdated,
      categoryDist: categoryDist.filter((c) => c.count > 0),
      freshness: { fresh, moderate, stale },
      status: { published, draft, archived },
      totalViews,
      avgReadingTime: Math.round(avgReadingTime),
    };
  }, [entries, categories]);

  if (entriesLoading || statsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Knowledge Base Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Insights and metrics for your knowledge base
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Total Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.status.published} published, {analytics.status.draft} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all articles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.categoryDist.length} with content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Avg. Reading Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgReadingTime} min</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per article
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Embedding Stats */}
      {embeddingStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Embedding Coverage
            </CardTitle>
            <CardDescription>
              Status of AI-powered semantic search indexing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {embeddingStats.completed}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {embeddingStats.pending}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {embeddingStats.processing}
                </div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {embeddingStats.failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {embeddingStats.totalChunks.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Chunks</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Coverage</span>
                <span className="font-semibold">
                  {embeddingStats.total > 0
                    ? Math.round(
                        (embeddingStats.completed / embeddingStats.total) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${
                      embeddingStats.total > 0
                        ? (embeddingStats.completed / embeddingStats.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Freshness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Content Freshness
          </CardTitle>
          <CardDescription>
            When articles were last updated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold text-green-600">
                {analytics.freshness.fresh}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Updated in last 30 days
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.freshness.moderate}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Updated 30-60 days ago
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold text-red-600">
                {analytics.freshness.stale}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Updated 60+ days ago
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout for lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Viewed Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Most Viewed Articles
            </CardTitle>
            <CardDescription>Top 10 by view count</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.mostViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No view data available yet
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.mostViewed.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{entry.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {entry.view_count} views
                        </span>
                        {entry.knowledge_categories && (
                          <Badge variant="outline" className="text-xs">
                            {entry.knowledge_categories.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Updated */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recently Updated
            </CardTitle>
            <CardDescription>Latest 10 modifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentlyUpdated.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entry.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(entry.updated_at)}
                    </div>
                  </div>
                  {entry.knowledge_categories && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {entry.knowledge_categories.name}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Category Distribution
          </CardTitle>
          <CardDescription>
            Number of articles per category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.categoryDist.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No categories with content yet
            </p>
          ) : (
            <div className="space-y-4">
              {analytics.categoryDist
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div key={item.category.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {item.category.name}
                      </span>
                      <span className="text-muted-foreground">
                        {item.count} {item.count === 1 ? "article" : "articles"}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${
                            (item.count /
                              Math.max(
                                ...analytics.categoryDist.map((c) => c.count)
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
