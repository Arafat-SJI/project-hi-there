import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import {
  useKnowledgeEntry,
  useDeleteKnowledgeEntry,
  useIsBookmarked,
  useToggleBookmark,
  useIncrementViewCount,
  useRelatedEntries,
  useTriggerEmbedding,
} from "@/hooks/useKnowledge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Eye,
  Clock,
  Bookmark,
  BookmarkCheck,
  Share2,
  Check,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Home,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function KnowledgeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const { data: entry, isLoading } = useKnowledgeEntry(id || "");
  const { data: isBookmarked = false } = useIsBookmarked(id || "");
  const { data: relatedEntries = [] } = useRelatedEntries(id || "", 4);

  const deleteEntry = useDeleteKnowledgeEntry();
  const toggleBookmark = useToggleBookmark();
  const incrementView = useIncrementViewCount();
  const triggerEmbedding = useTriggerEmbedding();

  // Increment view count on page load
  useEffect(() => {
    if (id) {
      incrementView.mutate(id);
    }
  }, [id]);

  // Extract headings for table of contents
  const tableOfContents = useMemo(() => {
    if (!entry?.content) return [];

    const headings: Array<{ id: string; text: string; level: number }> = [];
    const lines = entry.content.split("\n");

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = `heading-${index}`;
        headings.push({ id, text, level });
      }
    });

    return headings;
  }, [entry?.content]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteEntry.mutateAsync(id);
      navigate("/knowledge");
    } catch (error: any) {
      console.error("Delete error:", error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const handleReEmbed = () => {
    if (id) {
      triggerEmbedding.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg font-semibold">Knowledge entry not found</p>
        <Button variant="outline" onClick={() => navigate("/knowledge")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  const getEmbeddingBadge = () => {
    switch (entry.embedding_status) {
      case "completed":
        return (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Indexed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="default" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Indexing Failed</Badge>;
      default:
        return <Badge variant="outline">Pending Index</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/knowledge"
          className="flex items-center gap-1 hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          <span>Knowledge Base</span>
        </Link>
        {entry.knowledge_categories && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              to={`/knowledge/category/${entry.knowledge_categories.slug}`}
              className="hover:text-foreground"
            >
              {entry.knowledge_categories.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-xs">
          {entry.title}
        </span>
      </nav>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">{entry.title}</h1>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-3">
              {entry.knowledge_categories && (
                <Badge variant="outline">
                  {entry.knowledge_categories.name}
                </Badge>
              )}
              {entry.status && <Badge variant="secondary">{entry.status}</Badge>}
              {getEmbeddingBadge()}
              {entry.reading_time_minutes && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {entry.reading_time_minutes} min read
                </span>
              )}
              {entry.view_count !== null && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  {entry.view_count} views
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleBookmark.mutate(id || "")}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isBookmarked ? "Remove bookmark" : "Bookmark this article"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? "Link copied!" : "Copy link"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="outline" asChild>
              <Link to={`/knowledge/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>

            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteEntry.isPending}
            >
              {deleteEntry.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>

        {/* Summary */}
        {entry.summary && (
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <p className="text-base text-muted-foreground leading-relaxed">
                {entry.summary}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Article Content */}
        <div className="space-y-6">
          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Content with Markdown */}
          <Card>
            <CardContent className="pt-6">
              <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-code:text-primary">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 id={`heading-${node?.position?.start.line}`} {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 id={`heading-${node?.position?.start.line}`} {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 id={`heading-${node?.position?.start.line}`} {...props} />
                    ),
                  }}
                >
                  {entry.content}
                </ReactMarkdown>
              </article>
            </CardContent>
          </Card>

          {/* Embedding Status & Actions */}
          {entry.embedding_status !== "completed" && (
            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Indexing Status
                </CardTitle>
                <CardDescription>
                  {entry.embedding_status === "pending" &&
                    "This article is pending AI indexing for semantic search."}
                  {entry.embedding_status === "processing" &&
                    "AI indexing is currently in progress..."}
                  {entry.embedding_status === "failed" &&
                    "AI indexing failed. You can retry indexing below."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReEmbed}
                  disabled={
                    triggerEmbedding.isPending ||
                    entry.embedding_status === "processing"
                  }
                >
                  {triggerEmbedding.isPending ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-3 w-3" />
                  )}
                  {entry.embedding_status === "failed"
                    ? "Retry Indexing"
                    : "Re-index Now"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Related Articles */}
          {relatedEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Articles</CardTitle>
                <CardDescription>
                  Similar content you might find useful
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedEntries.map((related: any) => (
                  <Link
                    key={related.id}
                    to={`/knowledge/${related.id}`}
                    className="block rounded-lg border p-3 transition-all hover:bg-accent"
                  >
                    <div className="font-medium">{related.title}</div>
                    {related.summary && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {related.summary}
                      </p>
                    )}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Table of Contents */}
          {tableOfContents.length > 0 && (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-1 text-sm">
                  {tableOfContents.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={`block py-1 transition-colors hover:text-foreground ${
                        heading.level === 1 ? "font-semibold" : ""
                      } ${
                        heading.level === 2 ? "pl-2" : ""
                      } ${
                        heading.level === 3 ? "pl-4 text-xs" : ""
                      } ${
                        heading.level > 3 ? "pl-6 text-xs" : ""
                      } text-muted-foreground`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </CardContent>
            </Card>
          )}

          {/* Article Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Article Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium">Published</div>
                  <div className="text-muted-foreground">
                    {formatDate(entry.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-muted-foreground">
                    {formatDate(entry.updated_at)}
                  </div>
                </div>
              </div>
              {entry.last_embedded_at && (
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <div className="font-medium">AI Indexed</div>
                    <div className="text-muted-foreground">
                      {formatDate(entry.last_embedded_at)}
                    </div>
                  </div>
                </div>
              )}
              {entry.embedding_count && (
                <div className="pt-2 text-xs text-muted-foreground">
                  {entry.embedding_count} embedding chunks
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{entry.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
