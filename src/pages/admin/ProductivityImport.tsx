import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  FileSpreadsheet,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { env } from "@/shared/config/env";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FileWithPreview {
  file: File;
  id: string;
  preview: { name: string; size: number; type: string };
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  result?: { success: boolean; message: string; imported?: number; errors?: string[] };
}

export default function ProductivityImport() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${env.supabase.url}/functions/v1/import-productivity-csv`,
        {
          method: "POST",
          headers: {
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            apikey: env.supabase.anonKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: (data, file) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: "success" as const, progress: 100, result: data }
            : f
        )
      );
      toast.success(`Imported ${data.imported || 0} productivity records`);
    },
    onError: (error: Error, file) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: "error" as const, error: error.message }
            : f
        )
      );
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "text/csv" || f.name.endsWith(".csv")
    );
    addFiles(dropped);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  }, []);

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        preview: { name: file.name, size: file.size, type: file.type },
        status: "pending" as const,
        progress: 0,
      })),
    ]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${["Bytes", "KB", "MB", "GB"][i]}`;
  };

  const handleImport = async (f: FileWithPreview) => {
    if (f.status === "uploading") return;
    setFiles((prev) =>
      prev.map((x) => (x.id === f.id ? { ...x, status: "uploading" as const, progress: 50 } : x))
    );
    await importMutation.mutateAsync(f.file);
  };

  const handleImportAll = () => {
    files.filter((f) => f.status === "pending").forEach(handleImport);
  };

  const pendingFiles = files.filter((f) => f.status === "pending");
  const successFiles = files.filter((f) => f.status === "success");
  const errorFiles = files.filter((f) => f.status === "error");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Productivity Data Import</h1>
        <p className="text-muted-foreground">Upload CSV files to import employee productivity data</p>
      </div>

      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertTitle>CSV Format</AlertTitle>
        <AlertDescription>
          Required columns: week, email, name. Optional: department, location, productive_time_hr,
          productivity_percentage, present_days, computer_activities_hr, etc. Week format: YYYY-W## or MMM DD.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV Files</CardTitle>
          <CardDescription>Drag and drop or click to browse</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onClick={() => document.getElementById("productivity-file-input")?.click()}
          >
            <input
              id="productivity-file-input"
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">{isDragging ? "Drop here" : "Drag and drop CSV files"}</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold">Files ({files.length})</h3>
                  {pendingFiles.length > 0 && (
                    <Button onClick={handleImportAll} size="sm" disabled={importMutation.isPending}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import All ({pendingFiles.length})
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 text-sm">
                  <Badge variant="outline">{pendingFiles.length} pending</Badge>
                  <Badge variant="outline" className="text-green-600">{successFiles.length} success</Badge>
                  {errorFiles.length > 0 && (
                    <Badge variant="outline" className="text-red-600">{errorFiles.length} error</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {files.map((f) => (
                  <Card key={f.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="font-medium truncate">{f.preview.name}</p>
                          <p className="text-sm text-muted-foreground">{formatBytes(f.preview.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {f.status === "pending" && (
                          <Button size="sm" onClick={() => handleImport(f)} disabled={importMutation.isPending}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                          </Button>
                        )}
                        {f.status === "uploading" && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Importing...</span>
                          </div>
                        )}
                        {f.status === "success" && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">{f.result?.imported ?? 0} imported</span>
                          </div>
                        )}
                        {f.status === "error" && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">Failed</span>
                          </div>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => removeFile(f.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {f.status === "uploading" && <Progress value={f.progress} className="mt-3 h-2" />}
                    {f.status === "error" && f.error && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertDescription>{f.error}</AlertDescription>
                      </Alert>
                    )}
                    {f.status === "success" && f.result?.errors && f.result.errors.length > 0 && (
                      <Alert className="mt-3">
                        <AlertDescription>
                          {f.result.message}
                          <ul className="mt-2 list-disc list-inside text-sm">
                            {f.result.errors.slice(0, 5).map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {successFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">
                    {successFiles.reduce((s, f) => s + (f.result?.imported ?? 0), 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold">{successFiles.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
