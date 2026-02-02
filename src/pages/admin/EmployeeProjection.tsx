import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Employee Projection (skeleton)
 *
 * Placeholder for `/admin/team/employee_projection` from the full blueprint.
 * Intended to configure resource projection teams and employee allocation settings.
 */
export default function EmployeeProjection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Projection Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Use this page to manage teams, roles, and allocation rules for the
              Resource Projection module. It is a structural placeholder and does
              not yet read or write any data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

