import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Work Types Settings (skeleton)
 *
 * Placeholder for `/admin/settings/work-types` from the full blueprint.
 * Intended to manage billable/non-billable work types used in projects
 * and resource planning.
 */
export default function WorkTypesSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Work Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Configure work types here (e.g. Discovery, Implementation, Support)
              with flags for billable/non-billable, default rates, or categories.
              This is a UI skeleton; hook it up to your own table when ready.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

