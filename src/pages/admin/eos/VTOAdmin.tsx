/**
 * VTO Admin — Admin configuration for Vision/Traction Organizer sections.
 *
 * Allows admins to:
 * - View all VTO sections with current content preview
 * - Reset a section to default template
 * - Edit section title and sort order
 * - Bulk reset all sections
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Pencil, RotateCcw, Eye, FileText } from "lucide-react";
import { useVTO, useUpdateVTO } from "@/modules/eos/hooks/useVTO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { VTOSection } from "@/modules/eos/types";

const VTO_KEY = "eos-vto";

const DEFAULT_TEMPLATES: Record<string, Record<string, unknown>> = {
  core_values: { values: ["Integrity", "Innovation", "Teamwork", "Excellence", "Accountability"] },
  core_focus: { purpose: "", niche: "" },
  ten_year_target: { target: "" },
  marketing_strategy: { target_market: "", uniques: [], proven_process: "", guarantee: "" },
  three_year_picture: { revenue: "", profit: "", measurables: [] },
  one_year_plan: { revenue: "", profit: "", goals: [] },
  quarterly_rocks: { rocks: [] },
  issues_list: { issues: [] },
};

const SECTION_LABELS: Record<string, string> = {
  core_values: "Core Values",
  core_focus: "Core Focus",
  ten_year_target: "10-Year Target",
  marketing_strategy: "Marketing Strategy",
  three_year_picture: "3-Year Picture",
  one_year_plan: "1-Year Plan",
  quarterly_rocks: "Quarterly Rocks",
  issues_list: "Issues List",
};

function useResetVTOSection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ section }: { section: string }) => {
      const template = DEFAULT_TEMPLATES[section] || {};
      const { error } = await (supabase as any)
        .from("eos_vto")
        .update({
          content: template,
          updated_by: user!.id,
          updated_at: new Date().toISOString(),
        })
        .eq("section", section);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VTO_KEY] });
      toast.success("Section reset to default template");
    },
    onError: (error: Error) => {
      toast.error("Failed to reset section", { description: error.message });
    },
  });
}

function useUpdateVTOTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await (supabase as any)
        .from("eos_vto")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VTO_KEY] });
      toast.success("Title updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update title", { description: error.message });
    },
  });
}

function contentPreview(content: Record<string, unknown>): string {
  const values = Object.values(content);
  for (const v of values) {
    if (typeof v === "string" && v.length > 0) return v.substring(0, 80) + (v.length > 80 ? "…" : "");
    if (Array.isArray(v) && v.length > 0) return v.slice(0, 3).join(", ") + (v.length > 3 ? "…" : "");
  }
  return "Empty";
}

export default function VTOAdmin() {
  const { data: sections, isLoading } = useVTO();
  const resetSection = useResetVTOSection();
  const updateTitle = useUpdateVTOTitle();

  const [editSection, setEditSection] = useState<VTOSection | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [previewSection, setPreviewSection] = useState<VTOSection | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filledSections = (sections || []).filter(
    (s) => contentPreview(s.content as Record<string, unknown>) !== "Empty"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">VTO Admin</h1>
        <p className="text-muted-foreground">
          Manage Vision/Traction Organizer section templates and content.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Sections</p>
            <p className="text-2xl font-bold">{(sections || []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Filled Sections</p>
            <p className="text-2xl font-bold text-green-600">{filledSections}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Empty Sections</p>
            <p className="text-2xl font-bold text-amber-600">
              {(sections || []).length - filledSections}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sections Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            VTO Sections
          </CardTitle>
          <CardDescription>
            Each section maps to a part of the Vision/Traction Organizer. Resetting returns the section to the default template.
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Section Key</TableHead>
              <TableHead>Display Title</TableHead>
              <TableHead>Content Preview</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sections || []).map((section) => (
              <TableRow key={section.id}>
                <TableCell>
                  <Badge variant="outline">{section.sort_order}</Badge>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{section.section}</code>
                </TableCell>
                <TableCell className="font-medium">
                  {section.title || SECTION_LABELS[section.section] || section.section}
                </TableCell>
                <TableCell className="max-w-xs">
                  <span className="text-sm text-muted-foreground truncate block">
                    {contentPreview(section.content as Record<string, unknown>)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {section.updated_at
                    ? new Date(section.updated_at).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewSection(section)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditSection(section);
                        setEditTitle(section.title || SECTION_LABELS[section.section] || "");
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetTarget(section.section)}
                    >
                      <RotateCcw className="h-4 w-4 text-amber-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Title Dialog */}
      <Dialog open={!!editSection} onOpenChange={() => setEditSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section Title</DialogTitle>
            <DialogDescription>
              Update the display title for "{editSection?.section}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Display Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSection(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateTitle.isPending}
              onClick={() => {
                if (editSection) {
                  updateTitle.mutate(
                    { id: editSection.id, title: editTitle },
                    { onSuccess: () => setEditSection(null) }
                  );
                }
              }}
            >
              {updateTitle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewSection} onOpenChange={() => setPreviewSection(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {previewSection?.title || SECTION_LABELS[previewSection?.section || ""] || previewSection?.section}
            </DialogTitle>
            <DialogDescription>Full content preview</DialogDescription>
          </DialogHeader>
          <pre className="bg-muted rounded-md p-4 text-xs overflow-auto max-h-96">
            {JSON.stringify(previewSection?.content, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>

      {/* Reset Confirm */}
      <AlertDialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset section to default?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all content in "{SECTION_LABELS[resetTarget || ""] || resetTarget}" with the default template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resetTarget) {
                  resetSection.mutate(
                    { section: resetTarget },
                    { onSuccess: () => setResetTarget(null) }
                  );
                }
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
