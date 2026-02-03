/**
 * Closed OKRs Table
 *
 * Displays a table of completed and closed OKRs sorted by most recently updated.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Archive } from "lucide-react";
import type { OKR } from "../../types";

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-600" },
};

interface ClosedOKRsTableProps {
  okrs: OKR[];
}

export function ClosedOKRsTable({ okrs }: ClosedOKRsTableProps) {
  const closedOkrs = [...okrs]
    .filter((okr) => okr.status === "completed" || okr.status === "closed")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  if (closedOkrs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Archive className="h-8 w-8 mb-2" />
        <p>No closed OKRs</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead className="w-[100px]">Quarter</TableHead>
          <TableHead className="w-[110px]">Status</TableHead>
          <TableHead className="w-[160px]">Progress</TableHead>
          <TableHead className="w-[120px]">Closed Date</TableHead>
          <TableHead className="w-[140px]">Owner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {closedOkrs.map((okr) => {
          const config = statusConfig[okr.status];
          return (
            <TableRow key={okr.id}>
              <TableCell>
                <p className="font-medium">{okr.title}</p>
                {okr.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {okr.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{okr.quarter}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={config?.className || ""}
                >
                  {config?.label || okr.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={okr.progress}
                    className="h-2 flex-1"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {Math.round(okr.progress)}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {new Date(okr.updated_at).toLocaleDateString()}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {okr.owner?.full_name || "Unassigned"}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
