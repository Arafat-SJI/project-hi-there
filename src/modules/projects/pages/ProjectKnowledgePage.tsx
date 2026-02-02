/**
 * Project Knowledge Page
 *
 * Slimmed-down placeholder adapted from sj-control-main's ProjectKnowledge.
 * In this framework, it serves as a dedicated view for project-related
 * knowledge (documents, links, notes) and can be wired to the Knowledge module later.
 */

import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProjectKnowledgePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${slug}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Project Knowledge</h1>
          {slug && (
            <p className="text-sm text-muted-foreground">
              Knowledge, docs, and notes for project <span className="font-mono">{slug}</span>.
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Knowledge integration coming soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This page mirrors the <code>ProjectKnowledge</code> concept from{" "}
            <code>sj-control-main</code>, but is currently a placeholder in this framework.
          </p>
          <p>
            You can connect this view to the Knowledge module (project-scoped documents,
            semantic search, meeting transcripts, etc.) when your schema and use cases are ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

