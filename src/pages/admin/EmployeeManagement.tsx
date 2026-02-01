/**
 * Employee Management Admin Page
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Loader2, Building2, MapPin } from "lucide-react";
import { useEmployeeProfiles } from "@/modules/productivity/hooks/useEmployees";

export default function EmployeeManagement() {
  const [search, setSearch] = useState("");
  const { data: employees = [], isLoading } = useEmployeeProfiles(search || undefined);

  const activeCount = employees.filter((e) => e.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <p className="text-muted-foreground">Manage employee profiles and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Total Employees</p></div>
            <p className="text-2xl font-bold mt-1">{employees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">{employees.length - activeCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">No employees found</p>
          <p className="text-sm">Employee profiles will appear after HR data sync or manual creation.</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <p className="font-medium">{emp.full_name}</p>
                    {emp.title && <p className="text-xs text-muted-foreground">{emp.title}</p>}
                  </TableCell>
                  <TableCell><span className="text-sm">{emp.email}</span></TableCell>
                  <TableCell>
                    {emp.department ? (
                      <span className="flex items-center gap-1 text-sm"><Building2 className="h-3 w-3" />{emp.department.name}</span>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {emp.location ? (
                      <span className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" />{emp.location}</span>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{emp.employment_type}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={emp.is_active ? "default" : "secondary"}>{emp.is_active ? "Active" : "Inactive"}</Badge>
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
