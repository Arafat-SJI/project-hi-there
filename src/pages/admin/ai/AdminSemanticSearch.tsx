/**
 * Admin Semantic Search – AI-powered search across all documents using vector similarity.
 * Route: /admin/ai/semantic-search
 * Supports entity type filters, similarity threshold, result limit, and for meeting
 * transcripts: optional project name, project manager, client name filters.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Loader2,
  FileText,
  ClipboardList,
  Users,
  Briefcase,
  Calendar,
} from "lucide-react";
import { useAdminSemanticSearch } from "@/hooks/useAdminSemanticSearch";
import { useProjects } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import { truncateText } from "@/lib/utils";

const ENTITY_TYPES = [
  { id: "meeting_transcript", label: "Meeting Transcripts", icon: FileText },
  { id: "task", label: "Tasks", icon: ClipboardList },
  { id: "client", label: "Contacts", icon: Users },
  { id: "project", label: "Projects", icon: Briefcase },
  { id: "meeting", label: "Meetings", icon: Calendar },
] as const;

const RESULT_LIMITS = [5, 10, 20, 50] as const;
const EXAMPLE_QUERIES = [
  "Find all discussions about budget planning",
  "Show me project status updates from last month",
  "Search for action items related to technical debt",
  "Find meeting transcripts discussing API integration",
  "Show client feedback about the mobile app redesign",
];

export default function AdminSemanticSearch() {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [limit, setLimit] = useState(10);
  const [projectName, setProjectName] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [clientName, setClientName] = useState("");

  const { data: projects = [] } = useProjects({});
  const { data: clientsData } = useClients({ pageSize: 500 });
  const clients = clientsData ?? [];

  const {
    search,
    results,
    isSearching,
    isSuccess,
  } = useAdminSemanticSearch();

  const hasMeetingTranscriptSelected = selectedTypes.has("meeting_transcript");

  const handleSearch = () => {
    if (!query.trim()) return;
    const entityTypes =
      selectedTypes.size > 0 ? Array.from(selectedTypes) : undefined;
    search({
      query: query.trim(),
      limit: limit as 5 | 10 | 20 | 50,
      similarity_threshold: similarityThreshold,
      entity_types: entityTypes,
      project_name: hasMeetingTranscriptSelected ? projectName || undefined : undefined,
      project_manager: hasMeetingTranscriptSelected ? projectManager || undefined : undefined,
      client_name: hasMeetingTranscriptSelected ? clientName || undefined : undefined,
    });
  };

  const toggleEntityType = (id: string, checked: boolean) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Semantic Search
        </h1>
        <p className="text-muted-foreground">
          AI-powered search across all documents using vector similarity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Query</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for meetings, projects, tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="shrink-0"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>

          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="grid w-full max-w-[240px] grid-cols-2">
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="mt-4 space-y-4">
              <div>
                <Label className="text-sm font-medium">Entity Types</Label>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ENTITY_TYPES.map(({ id, label, icon: Icon }) => (
                    <div
                      key={id}
                      className="flex items-center space-x-2 rounded-md border p-3"
                    >
                      <Checkbox
                        id={id}
                        checked={selectedTypes.has(id)}
                        onCheckedChange={(checked) =>
                          toggleEntityType(id, !!checked)
                        }
                      />
                      <Label
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {hasMeetingTranscriptSelected && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <Label className="text-sm font-medium">
                    Meeting transcript filters (optional)
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Project
                      </Label>
                      <Select
                        value={projectName || "__all__"}
                        onValueChange={(v) =>
                          setProjectName(v === "__all__" ? "" : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All projects</SelectItem>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Project manager
                      </Label>
                      <Input
                        placeholder="Filter by manager name"
                        value={projectManager}
                        onChange={(e) => setProjectManager(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Client
                      </Label>
                      <Select
                        value={clientName || "__all__"}
                        onValueChange={(v) =>
                          setClientName(v === "__all__" ? "" : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All clients" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All clients</SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Similarity threshold: {(similarityThreshold * 100).toFixed(0)}%
                </Label>
                <Slider
                  min={0.5}
                  max={0.95}
                  step={0.05}
                  value={[similarityThreshold]}
                  onValueChange={([v]) => setSimilarityThreshold(v ?? 0.7)}
                  className="w-full max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Higher values return only closer matches.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Result limit</Label>
                <Select
                  value={String(limit)}
                  onValueChange={(v) => setLimit(Number(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESULT_LIMITS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {EXAMPLE_QUERIES.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => setQuery(q)}
                  className="text-left hover:text-foreground hover:underline"
                >
                  &quot;{q}&quot;
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isSuccess && !isSearching && (
        <Card>
          <CardHeader>
            <CardTitle>
              {results.length} Result{results.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matches found. Try a lower similarity threshold or different
                filters.
              </p>
            ) : (
              <div className="space-y-3">
                {results.map((row, idx) => (
                  <div
                    key={row.id ?? idx}
                    className="rounded-lg border p-4 text-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium capitalize text-muted-foreground">
                        {row.entity_type?.replace(/_/g, " ")}
                      </span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {(row.similarity * 100).toFixed(0)}% match
                      </span>
                    </div>
                    {(row.project_name ?? row.project_manager ?? row.client_name) && (
                      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {row.project_name && (
                          <span>Project: {row.project_name}</span>
                        )}
                        {row.project_manager && (
                          <span>Manager: {row.project_manager}</span>
                        )}
                        {row.client_name && (
                          <span>Client: {row.client_name}</span>
                        )}
                      </div>
                    )}
                    <p className="text-foreground">
                      {truncateText(row.content ?? "", 400)}
                    </p>
                    {row.metadata?.title && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {String(row.metadata.title)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
