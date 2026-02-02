import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Project Status Settings (skeleton)
 *
 * Placeholder for `/admin/settings/project-statuses` from the full blueprint.
 * In this framework, project statuses are seeded via SQL; this page is a UI
 * hook for future CRUD and reordering.
 */
export default function ProjectStatusSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Statuses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This is a placeholder for managing <code>project_statuses</code> (e.g. Planning,
              Active, On Hold, Completed). Implement CRUD and drag-to-reorder here when you
              are ready to make statuses fully Admin-configurable.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

