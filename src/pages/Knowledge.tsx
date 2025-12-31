import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useKnowledgeEntries,
  useDeleteKnowledgeEntry,
} from "@/hooks/useKnowledge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  FileText,
  Upload,
} from "lucide-react";
import { formatDate, truncateText } from "@/lib/utils";

export default function Knowledge() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filters = {
    search,
    category: category !== "all" ? category : undefined,
  };

  const { data: entries, isLoading } = useKnowledgeEntries(filters);
  const deleteEntry = useDeleteKnowledgeEntry();

  const handleDelete = () => {
    if (deleteId) {
      deleteEntry.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getEmbeddingBadge = (status?: string) => {
    const config: Record<
      string,
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      pending: { variant: "default", label: "Pending" },
      processing: { variant: "default", label: "Processing" },
      completed: { variant: "secondary", label: "Indexed" },
      failed: { variant: "destructive", label: "Failed" },
    };

    const badge = config[status || "pending"];
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Manage your documents and knowledge entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/knowledge/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Link>
          </Button>
          <Button asChild>
            <Link to="/knowledge/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find knowledge entries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge base..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="meeting">Meeting Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Entries Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Loading knowledge entries...</p>
          </div>
        ) : !entries || entries.length === 0 ? (
          <div className="col-span-full flex h-32 flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground">No knowledge entries found</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/knowledge/new">
                <Plus className="mr-2 h-4 w-4" />
                Add your first entry
              </Link>
            </Button>
          </div>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2">{entry.title}</CardTitle>
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
                <CardDescription className="flex items-center gap-2">
                  {entry.category && (
                    <Badge variant="outline">{entry.category}</Badge>
                  )}
                  {getEmbeddingBadge(entry.embedding_status)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {truncateText(entry.content, 150)}
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(entry.created_at)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={`/knowledge/${entry.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/knowledge/${entry.id}/edit`}>
                        <Edit className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(entry.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this knowledge entry? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
