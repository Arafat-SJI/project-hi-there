/**
 * DepartmentDialog - Create/Edit department form
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { departmentFormSchema, type DepartmentFormData } from "@/lib/validation";
import { useCreateDepartment, useUpdateDepartment, type Department } from "@/hooks/useDepartments";

export interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
}

export function DepartmentDialog({ open, onOpenChange, department }: DepartmentDialogProps) {
  const isEditMode = !!department;
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: department?.name || "",
        description: department?.description || "",
      });
    }
  }, [open, department, form]);

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      if (isEditMode && department) {
        await updateDepartment.mutateAsync({ id: department.id, data });
      } else {
        await createDepartment.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // Errors handled by mutation hooks
    }
  };

  const isPending = createDepartment.isPending || updateDepartment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Department" : "Create Department"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update department name and description."
              : "Add a new department to your organization."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Department Name *</Label>
            <Input
              id="dept-name"
              placeholder="e.g. Engineering"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept-description">Description</Label>
            <Textarea
              id="dept-description"
              placeholder="Optional description"
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? "Save Changes" : "Create Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
