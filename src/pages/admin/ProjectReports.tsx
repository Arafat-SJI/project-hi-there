import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useProjectReports } from "@/hooks/useProjectReports";

/**
 * Project Reports – admin view of project-level metrics (mock data until real aggregates).
 */
export default function ProjectReports() {
  const { data: rows = [], isLoading } = useProjectReports();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Summary by project. Data is mock until you wire aggregates from{" "}
              <code>projects</code>, <code>project_milestones</code>,{" "}
              <code>project_risks</code>, <code>project_billing</code>, and{" "}
              <code>project_invoices</code>.
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Milestones</TableHead>
                  <TableHead className="text-right">Risks (open)</TableHead>
                  <TableHead className="text-right">Budget used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span className="font-medium">{r.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono">
                        {r.slug}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.milestones_done} / {r.milestones_total}
                    </TableCell>
                    <TableCell className="text-right">{r.risks_open}</TableCell>
                    <TableCell className="text-right">{r.budget_spent_pct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
