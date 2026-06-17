import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, Eye, Play, Pause, XCircle } from "lucide-react";
import {
  useKbSourceConfigs,
  useUpsertKbSourceConfig,
  useChunkPreview,
  useGlobalRerankerSettings,
  useUpdateGlobalReranker,
} from "@/hooks/useKbSourceConfig";
import { useStartKbReembed, useKbReembedJob, useKbReembedControl } from "@/hooks/useKbBulkReembed";
import type { ChunkStrategy, RerankerProvider } from "@/types/knowledgeRag";

const STRATEGIES: { value: ChunkStrategy; label: string }[] = [
  { value: "fixed", label: "Fixed Chunking" },
  { value: "sentence-window", label: "Sentence Window" },
  { value: "heading-aware", label: "Heading Aware" },
  { value: "parent-child", label: "Parent-Child" },
];

const RERANKERS: RerankerProvider[] = ["cohere", "voyage", "bge", "custom"];

export default function KnowledgeSourceConfig() {
  const { data, isLoading } = useKbSourceConfigs();
  const { data: globalReranker } = useGlobalRerankerSettings();
  const upsert = useUpsertKbSourceConfig();
  const updateGlobal = useUpdateGlobalReranker();
  const preview = useChunkPreview();
  const startReembed = useStartKbReembed();
  const reembedControl = useKbReembedControl();

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const { data: activeJob } = useKbReembedJob(activeJobId);

  const selected = data?.find((d) => d.source.id === selectedSourceId);
  const cfg = selected?.config;

  const [form, setForm] = useState({
    chunk_size: 1000,
    chunk_overlap: 100,
    chunk_strategy: "fixed" as ChunkStrategy,
    sample_text: "# Sample Document\n\nThis is sample content for chunk preview.",
    reranker_provider: "cohere" as RerankerProvider,
    reranker_threshold: 0.75,
    reranker_max_results: 10,
    reranker_enabled: false,
    reranker_override_global: false,
  });

  const [globalForm, setGlobalForm] = useState({
    reranker_provider: "cohere" as RerankerProvider,
    reranker_threshold: 0.75,
    reranker_max_results: 10,
    reranker_enabled: false,
  });

  const loadSource = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    const item = data?.find((d) => d.source.id === sourceId);
    if (item?.config) {
      setForm((f) => ({
        ...f,
        chunk_size: item.config!.chunk_size,
        chunk_overlap: item.config!.chunk_overlap,
        chunk_strategy: item.config!.chunk_strategy,
        reranker_provider: item.config!.reranker_provider ?? "cohere",
        reranker_threshold: item.config!.reranker_threshold,
        reranker_max_results: item.config!.reranker_max_results,
        reranker_enabled: item.config!.reranker_enabled,
        reranker_override_global: item.config!.reranker_override_global,
      }));
    }
  };

  useEffect(() => {
    if (globalReranker) setGlobalForm(globalReranker);
  }, [globalReranker]);

  const handleSave = () => {
    if (!selectedSourceId) return;
    upsert.mutate({
      source_id: selectedSourceId,
      chunk_size: form.chunk_size,
      chunk_overlap: form.chunk_overlap,
      chunk_strategy: form.chunk_strategy,
      reranker_provider: form.reranker_provider,
      reranker_threshold: form.reranker_threshold,
      reranker_max_results: form.reranker_max_results,
      reranker_enabled: form.reranker_enabled,
      reranker_override_global: form.reranker_override_global,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Knowledge Source Configuration
        </h1>
        <p className="text-muted-foreground mt-1">Per-source chunking and reranker settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Reranker Defaults</CardTitle>
          <CardDescription>Organization-wide defaults; sources can override</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={globalForm.reranker_provider} onValueChange={(v) => setGlobalForm((g) => ({ ...g, reranker_provider: v as RerankerProvider }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RERANKERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Threshold</Label>
            <Input type="number" step="0.01" value={globalForm.reranker_threshold} onChange={(e) => setGlobalForm((g) => ({ ...g, reranker_threshold: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Max Results</Label>
            <Input type="number" value={globalForm.reranker_max_results} onChange={(e) => setGlobalForm((g) => ({ ...g, reranker_max_results: Number(e.target.value) }))} />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2">
              <Switch checked={globalForm.reranker_enabled} onCheckedChange={(c) => setGlobalForm((g) => ({ ...g, reranker_enabled: c }))} />
              <Label>Enabled</Label>
            </div>
            <Button onClick={() => updateGlobal.mutate(globalForm)} disabled={updateGlobal.isPending}>Save Global</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Sources</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data ?? []).map(({ source, config }) => (
              <Button
                key={source.id}
                variant={selectedSourceId === source.id ? "default" : "outline"}
                className="w-full justify-between"
                onClick={() => loadSource(source.id)}
              >
                <span>{source.name}</span>
                <Badge variant="outline">{config?.chunk_strategy ?? "fixed"}</Badge>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{selected?.source.name ?? "Select a source"}</CardTitle>
            <CardDescription>Chunking and reranker configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedSourceId ? (
              <p className="text-sm text-muted-foreground">Select a source to configure</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Chunk Size</Label>
                    <Input type="number" value={form.chunk_size} onChange={(e) => setForm((f) => ({ ...f, chunk_size: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Chunk Overlap</Label>
                    <Input type="number" value={form.chunk_overlap} onChange={(e) => setForm((f) => ({ ...f, chunk_overlap: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Strategy</Label>
                    <Select value={form.chunk_strategy} onValueChange={(v) => setForm((f) => ({ ...f, chunk_strategy: v as ChunkStrategy }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STRATEGIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preview Sample Text</Label>
                  <Textarea rows={4} value={form.sample_text} onChange={(e) => setForm((f) => ({ ...f, sample_text: e.target.value }))} />
                  <Button variant="outline" size="sm" onClick={() => preview.mutate({
                    sample_text: form.sample_text,
                    chunk_size: form.chunk_size,
                    chunk_overlap: form.chunk_overlap,
                    chunk_strategy: form.chunk_strategy,
                  })} disabled={preview.isPending}>
                    <Eye className="h-4 w-4 mr-1" /> Preview Chunks
                  </Button>
                  {preview.data && (
                    <div className="rounded border p-3 text-sm space-y-1">
                      <p>Estimated chunks: <strong>{preview.data.estimated_chunks}</strong></p>
                      <p>Estimated cost: <strong>${preview.data.estimated_cost.toFixed(6)}</strong></p>
                      {preview.data.preview.map((c) => (
                        <pre key={c.chunk_index} className="text-xs bg-muted p-2 rounded mt-1 whitespace-pre-wrap">{c.content}</pre>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.reranker_override_global} onCheckedChange={(c) => setForm((f) => ({ ...f, reranker_override_global: c }))} />
                    <Label>Override global reranker</Label>
                  </div>
                  {form.reranker_override_global && (
                    <div className="grid gap-4 md:grid-cols-4">
                      <Select value={form.reranker_provider} onValueChange={(v) => setForm((f) => ({ ...f, reranker_provider: v as RerankerProvider }))}>
                        <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
                        <SelectContent>{RERANKERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" step="0.01" value={form.reranker_threshold} onChange={(e) => setForm((f) => ({ ...f, reranker_threshold: Number(e.target.value) }))} />
                      <Input type="number" value={form.reranker_max_results} onChange={(e) => setForm((f) => ({ ...f, reranker_max_results: Number(e.target.value) }))} />
                      <div className="flex items-center gap-2">
                        <Switch checked={form.reranker_enabled} onCheckedChange={(c) => setForm((f) => ({ ...f, reranker_enabled: c }))} />
                        <Label>Enabled</Label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSave} disabled={upsert.isPending}>Save Configuration</Button>
                  <Button variant="secondary" onClick={() => startReembed.mutate(selectedSourceId, { onSuccess: (job) => setActiveJobId(job.id) })} disabled={startReembed.isPending}>
                    Re-Embed All
                  </Button>
                </div>

                {activeJob && (
                  <div className="rounded border p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Status: <Badge>{activeJob.status}</Badge></span>
                      <span>{activeJob.processed_documents}/{activeJob.total_documents} processed ({activeJob.failed_documents} failed)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => reembedControl.mutate({ action: "pause", job_id: activeJob.id })}><Pause className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => reembedControl.mutate({ action: "resume", job_id: activeJob.id })}><Play className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => reembedControl.mutate({ action: "cancel", job_id: activeJob.id })}><XCircle className="h-3 w-3" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
