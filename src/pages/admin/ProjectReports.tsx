import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Project Reports (skeleton)
 *
 * Placeholder for `/admin/reports/projects` from the full blueprint.
 * Intended to host project-level reporting (status breakdowns, budgets, etc.).
 */
export default function ProjectReports() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This is a structural placeholder for project reporting. You can add tables
              and charts here that aggregate data from <code>projects</code>,
              <code>project_statuses</code>, <code>project_milestones</code>,
              <code>project_billing</code>, and <code>project_invoices</code>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

