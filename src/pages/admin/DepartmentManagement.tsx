/**
 * Department Management Admin Page
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Loader2 } from "lucide-react";
import { useDepartments } from "@/modules/productivity/hooks/useProductivity";

export default function DepartmentManagement() {
  const { data: departments = [], isLoading } = useDepartments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Department Management</h1>
        <p className="text-muted-foreground">Manage departments and organizational structure</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">No departments found</p>
          <p className="text-sm">Departments will be populated during HR sync.</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell><p className="font-medium">{dept.name}</p></TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{dept.description || "—"}</span></TableCell>
                  <TableCell><span className="text-sm">{dept.manager?.full_name || "—"}</span></TableCell>
                  <TableCell>
                    <Badge variant={dept.is_active ? "default" : "secondary"}>{dept.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
