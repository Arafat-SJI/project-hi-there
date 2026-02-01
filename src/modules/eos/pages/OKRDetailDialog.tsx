/**
 * OKR Detail Dialog
 *
 * Shows full OKR details with key results and check-in capability.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus } from "lucide-react";
import { useOKRDetail } from "../hooks/useOKRs";
import { KeyResultProgress } from "../components/okr/KeyResultProgress";
import { CheckInDialog } from "../components/okr/CheckInDialog";
import type { OKRKeyResult } from "../types";

interface OKRDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  okrId: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-blue-100 text-blue-800",
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-yellow-100 text-yellow-800",
  behind: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
  closed: "bg-gray-100 text-gray-600",
};

export function OKRDetailDialog({ open, onOpenChange, okrId }: OKRDetailDialogProps) {
  const { data: okr, isLoading } = useOKRDetail(okrId);
  const [checkInKR, setCheckInKR] = useState<OKRKeyResult | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {isLoading || !okr ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-xl">{okr.title}</DialogTitle>
                <Badge variant="secondary" className={statusColors[okr.status] || ""}>
                  {okr.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{okr.quarter}</span>
                {okr.owner && <span>· Owned by {okr.owner.full_name}</span>}
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {okr.description && (
                <p className="text-sm text-muted-foreground">{okr.description}</p>
              )}

              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span>{Math.round(okr.progress)}%</span>
                </div>
                <Progress value={okr.progress} className="h-3" />
              </div>

              {/* Key Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Key Results ({okr.key_results?.length || 0})
                  </h3>
                </div>

                {okr.key_results && okr.key_results.length > 0 ? (
                  <div className="space-y-2">
                    {okr.key_results.map((kr) => (
                      <div key={kr.id} className="relative group">
                        <KeyResultProgress keyResult={kr} />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setCheckInKR(kr)}
                        >
                          Check In
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No key results added yet.
                  </p>
                )}
              </div>
            </div>

            {checkInKR && (
              <CheckInDialog
                open={!!checkInKR}
                onOpenChange={(open) => !open && setCheckInKR(null)}
                keyResult={checkInKR}
                okrId={okr.id}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
