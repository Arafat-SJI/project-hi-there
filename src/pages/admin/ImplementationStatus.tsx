/**
 * Implementation Status — Admin dashboard for tracking module progress.
 *
 * Audience: Product Managers, Developers, QA
 * Data source: src/shared/data/implementationStatus.ts
 *
 * Update the data file after each batch of work.
 * QA marks checklist items as tested directly in the data file.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Ban,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Database,
  FileCode,
  Route,
  Navigation,
  Layers,
  Server,
  BookOpen,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import {
  implementationStatus,
  getStatusColor,
  getStatusLabel,
  getModuleProgress,
  getQAProgress,
  type ModuleStatus,
  type ItemStatus,
} from "@/shared/data/implementationStatus";

function StatusBadge({ status }: { status: ItemStatus }) {
  const color = getStatusColor(status);
  return (
    <Badge
      variant="outline"
      className="text-xs font-medium"
      style={{ borderColor: color, color }}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}

function StatusIcon({ status }: { status: ItemStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "qa-ready":
      return <FlaskConical className="h-4 w-4 text-blue-500" />;
    case "in-progress":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "planned":
      return <Circle className="h-4 w-4 text-purple-500" />;
    case "blocked":
      return <Ban className="h-4 w-4 text-red-500" />;
    case "not-started":
      return <Circle className="h-4 w-4 text-gray-400" />;
  }
}

function OverviewCards() {
  const totalModules = implementationStatus.length;
  const totalPages = implementationStatus.reduce((sum, m) => sum + m.pages.length, 0);
  const qaReadyPages = implementationStatus.reduce(
    (sum, m) => sum + m.pages.filter((p) => p.status === "qa-ready").length,
    0
  );
  const totalQA = implementationStatus.reduce((sum, m) => sum + m.qaChecklist.length, 0);
  const testedQA = implementationStatus.reduce(
    (sum, m) => sum + m.qaChecklist.filter((q) => q.tested).length,
    0
  );
  const totalTables = implementationStatus.reduce((sum, m) => sum + m.database.tables, 0);
  const totalEdgeFns = implementationStatus.reduce((sum, m) => sum + m.edgeFunctions.length, 0);
  const edgeFnDone = implementationStatus.reduce(
    (sum, m) => sum + m.edgeFunctions.filter((e) => e.status === "done").length,
    0
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span className="text-sm">Modules</span>
          </div>
          <p className="text-2xl font-bold mt-1">{totalModules}</p>
          <p className="text-xs text-muted-foreground">All phases scoped</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileCode className="h-4 w-4" />
            <span className="text-sm">Pages QA-Ready</span>
          </div>
          <p className="text-2xl font-bold mt-1">
            {qaReadyPages} <span className="text-sm font-normal text-muted-foreground">/ {totalPages}</span>
          </p>
          <Progress value={(qaReadyPages / totalPages) * 100} className="h-1.5 mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FlaskConical className="h-4 w-4" />
            <span className="text-sm">QA Checks</span>
          </div>
          <p className="text-2xl font-bold mt-1">
            {testedQA} <span className="text-sm font-normal text-muted-foreground">/ {totalQA}</span>
          </p>
          <Progress value={totalQA > 0 ? (testedQA / totalQA) * 100 : 0} className="h-1.5 mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Database className="h-4 w-4" />
            <span className="text-sm">Database</span>
          </div>
          <p className="text-2xl font-bold mt-1">{totalTables} tables</p>
          <p className="text-xs text-muted-foreground">
            Edge functions: {edgeFnDone}/{totalEdgeFns}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ModuleCard({ module }: { module: ModuleStatus }) {
  const [expanded, setExpanded] = useState(false);
  const progress = getModuleProgress(module);
  const qa = getQAProgress(module);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Phase {module.phase}
              </Badge>
              <CardTitle className="text-base">{module.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{module.summary}</p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <div className="text-right">
              <p className="text-lg font-bold">{progress}%</p>
              <p className="text-xs text-muted-foreground">built</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                {qa.tested}/{qa.total}
              </p>
              <p className="text-xs text-muted-foreground">tested</p>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mt-3" />
      </CardHeader>

      <CardContent className="pt-0">
        {/* Foundation row */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-muted-foreground" />
            <StatusBadge status={module.database.status} />
            <span className="text-xs text-muted-foreground">{module.database.tables} tables</span>
          </div>
          <div className="flex items-center gap-1">
            <FileCode className="h-3 w-3 text-muted-foreground" />
            <StatusBadge status={module.types.status} />
            <span className="text-xs text-muted-foreground">types</span>
          </div>
          <div className="flex items-center gap-1">
            <Route className="h-3 w-3 text-muted-foreground" />
            <StatusBadge status={module.routes.status} />
            <span className="text-xs text-muted-foreground">routes</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-muted-foreground" />
            <StatusBadge status={module.navigation.status} />
            <span className="text-xs text-muted-foreground">nav</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              Collapse <ChevronUp className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              Expand details <ChevronDown className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>

        {expanded && (
          <div className="mt-4 space-y-6">
            {/* Pages */}
            {module.pages.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Pages</h4>
                <div className="space-y-1">
                  {module.pages.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <StatusIcon status={p.status} />
                      <span className="flex-1">{p.name}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hooks */}
            {module.hooks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Hooks</h4>
                <div className="space-y-1">
                  {module.hooks.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <StatusIcon status={h.status} />
                      <span className="flex-1">{h.name}</span>
                      <StatusBadge status={h.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Components */}
            {module.components.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Components</h4>
                <div className="space-y-1">
                  {module.components.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <StatusIcon status={c.status} />
                      <span className="flex-1">{c.name}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edge Functions */}
            {module.edgeFunctions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Server className="h-4 w-4" /> Edge Functions
                </h4>
                <div className="space-y-1">
                  {module.edgeFunctions.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <StatusIcon status={e.status} />
                      <span className="flex-1">{e.name}</span>
                      <StatusBadge status={e.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QA Checklist */}
            {module.qaChecklist.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" /> QA Checklist
                </h4>
                <div className="space-y-1">
                  {module.qaChecklist.map((q, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {q.tested ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-300 shrink-0" />
                      )}
                      <span className={`flex-1 ${q.tested ? "line-through text-muted-foreground" : ""}`}>
                        {q.description}
                      </span>
                      {q.approvedBy && (
                        <span className="text-xs text-muted-foreground">by {q.approvedBy}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {module.nextSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Next Steps (for developers)</h4>
                <ul className="space-y-1">
                  {module.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Blockers */}
            {module.blockers && module.blockers.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <h4 className="text-sm font-semibold text-destructive mb-1">Blockers</h4>
                <ul className="space-y-1">
                  {module.blockers.map((b, i) => (
                    <li key={i} className="text-sm text-destructive">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QASummaryTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">QA Testing Summary</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>Total Checks</TableHead>
            <TableHead>Tested</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Coverage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {implementationStatus.map((module) => {
            const qa = getQAProgress(module);
            const pct = qa.total > 0 ? Math.round((qa.tested / qa.total) * 100) : 0;
            return (
              <TableRow key={module.id}>
                <TableCell className="font-medium">{module.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Phase {module.phase}</Badge>
                </TableCell>
                <TableCell>{qa.total}</TableCell>
                <TableCell>
                  <span className={qa.tested > 0 ? "text-green-600 font-medium" : ""}>{qa.tested}</span>
                </TableCell>
                <TableCell>
                  <span className={qa.total - qa.tested > 0 ? "text-amber-600 font-medium" : ""}>
                    {qa.total - qa.tested}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 w-20" />
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function DatabaseSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Database Tables by Module</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Tables</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {implementationStatus
            .filter((m) => m.database.tables > 0)
            .map((module) => (
              <TableRow key={module.id}>
                <TableCell className="font-medium">{module.name}</TableCell>
                <TableCell>{module.database.tables}</TableCell>
                <TableCell>
                  <StatusBadge status={module.database.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-sm truncate">
                  {module.database.notes}
                </TableCell>
              </TableRow>
            ))}
          <TableRow className="font-bold">
            <TableCell>Total</TableCell>
            <TableCell>
              {implementationStatus.reduce((sum, m) => sum + m.database.tables, 0)}
            </TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}

// ─── Global documentation (cross-cutting, not module-specific) ─────────────
const GLOBAL_DOCS = [
  { section: "Getting Started", items: [
    { title: "Getting Started Guide", path: "docs/00-getting-started/README.md", description: "Setup instructions, prerequisites, and initial configuration" },
    { title: "Environment Variables", path: "docs/00-getting-started/environment-variables.md", description: "All required and optional environment variables" },
    { title: "Self-Host Quickstart", path: "docs/00-getting-started/self-host-quickstart.md", description: "Quick setup for self-hosted deployments" },
  ]},
  { section: "Architecture", items: [
    { title: "Architecture Overview", path: "docs/01-architecture/00-architecture-overview.md", description: "V2 architecture: 4-layer framework, component hierarchy, AI strategy" },
    { title: "System Architecture", path: "docs/01-architecture/system-architecture.md", description: "Infrastructure, data flow, and system design" },
    { title: "Implementation Plan", path: "docs/IMPLEMENTATION_PLAN.md", description: "Chief Architect review: gap analysis, 8 phases, status per phase" },
  ]},
  { section: "Development", items: [
    { title: "Development Guide", path: "docs/03-development/README.md", description: "Development workflow and conventions" },
    { title: "Testing Guide", path: "docs/03-development/testing.md", description: "Testing strategy and test runner setup" },
    { title: "Release Process", path: "docs/03-development/release-process.md", description: "Release workflow, versioning, and checklist" },
  ]},
  { section: "Deployment", items: [
    { title: "Deployment Guide", path: "docs/04-deployment/README.md", description: "Deployment overview and strategies" },
    { title: "Production Checklist", path: "docs/04-deployment/production-checklist.md", description: "Pre-production verification checklist" },
    { title: "Production Guide", path: "docs/04-deployment/production-guide.md", description: "Production environment configuration" },
  ]},
  { section: "Integrations", items: [
    { title: "Integrations Overview", path: "docs/05-integrations/README.md", description: "Third-party integration architecture" },
    { title: "API Reference", path: "docs/05-integrations/api-reference.md", description: "REST API endpoints and authentication" },
    { title: "Data Flows", path: "docs/05-integrations/data-flows.md", description: "Data sync patterns and flow diagrams" },
  ]},
  { section: "AI Features", items: [
    { title: "AI Features Overview", path: "docs/06-ai-features/README.md", description: "AI capabilities, models, and RAG pipeline" },
  ]},
  { section: "Edge Functions", items: [
    { title: "Edge Functions Catalog", path: "docs/08-edge-functions/catalog.md", description: "All planned edge functions by module" },
    { title: "Edge Functions Deployment", path: "docs/08-edge-functions/deployment.md", description: "Deployment workflow for Supabase edge functions" },
    { title: "Secrets Management", path: "docs/08-edge-functions/secrets.md", description: "Managing secrets for edge function runtime" },
  ]},
  { section: "Backlog", items: [
    { title: "Product Backlog", path: "docs/backlog/product-backlog.md", description: "Full product backlog with prioritized items" },
  ]},
];

function DocsTab() {
  return (
    <div className="space-y-6">
      {/* Global docs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Project Documentation</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Cross-cutting documentation — architecture, deployment, integrations, and development guides.
            All files live in <code className="bg-muted px-1 rounded text-xs">docs/</code>.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {GLOBAL_DOCS.map((group) => (
            <div key={group.section}>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                {group.section}
              </h4>
              <div className="space-y-1.5 ml-6">
                {group.items.map((doc) => (
                  <div key={doc.path} className="flex items-start gap-2 text-sm group">
                    <FileCode className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{doc.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                      <code className="text-xs text-muted-foreground/70">{doc.path}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Per-module blueprint docs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Module Blueprints</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Each module has a detailed blueprint specifying pages, components, hooks, DB tables, and edge functions.
            These are the specifications developers follow for implementation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {implementationStatus.map((module) => {
            if (module.docs.length === 0) return null;
            const progress = getModuleProgress(module);
            return (
              <div key={module.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Phase {module.phase}</Badge>
                    <span className="font-medium text-sm">{module.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1.5 w-16" />
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                </div>
                <div className="space-y-1.5 ml-1">
                  {module.docs.map((doc) => (
                    <div key={doc.path} className="flex items-start gap-2 text-sm">
                      <ExternalLink className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{doc.title}</span>
                        <p className="text-xs text-muted-foreground">{doc.description}</p>
                        <code className="text-xs text-muted-foreground/70">{doc.path}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ImplementationStatus() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Implementation Status</h1>
        <p className="text-muted-foreground">
          Module-by-module progress tracker. Updated after each development batch.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Data source: <code className="bg-muted px-1 rounded">src/shared/data/implementationStatus.ts</code>
          — Update this file to reflect progress.
        </p>
      </div>

      <OverviewCards />

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="qa">QA Dashboard</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="docs">Docs & Architecture</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-4 space-y-4">
          {implementationStatus.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </TabsContent>

        <TabsContent value="qa" className="mt-4">
          <QASummaryTable />
        </TabsContent>

        <TabsContent value="database" className="mt-4">
          <DatabaseSummary />
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <DocsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
