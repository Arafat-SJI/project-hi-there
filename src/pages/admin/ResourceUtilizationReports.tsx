import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Resource Utilization Reports (skeleton)
 *
 * Placeholder for `/admin/reports/resource-utilization` from the full blueprint.
 * Intended to visualize resource allocation and utilization over time.
 */
export default function ResourceUtilizationReports() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resource Utilization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This page will eventually surface utilization metrics from{" "}
              <code>resource_projections</code> and related tables. Use it to build
              charts and tables for billable vs. non-billable time, capacity, and
              allocation trends.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

