import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useCloneRole,
  useRoleUsers,
  Role,
  RoleFormData,
} from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Check,
  Copy,
  Grid3X3,
  Users,
} from "lucide-react";
import { usePermissionCatalog } from "@/hooks/usePermissions";
import { format } from "date-fns";

export default function RoleManagement() {
  const { data: roles, isLoading, isError } = useRoles();
  const { data: permissions } = usePermissionCatalog();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const cloneRole = useCloneRole();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({ name: "", description: "" });

  const { data: roleUsers } = useRoleUsers(detailRole?.id);

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || "" });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    try {
      if (editingRole) {
        await updateRole.mutateAsync({ id: editingRole.id, data: formData });
      } else {
        await createRole.mutateAsync(formData);
      }
      setDialogOpen(false);
    } catch {
      // handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deletingRoleId) return;
    try {
      await deleteRole.mutateAsync(deletingRoleId);
      setDeleteDialogOpen(false);
      setDeletingRoleId(null);
    } catch {
      // handled by mutation
    }
  };

  const isProcessing =
    createRole.isPending || updateRole.isPending || cloneRole.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Catalog</h1>
          <p className="text-muted-foreground">Manage system roles and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/roles/permissions">
              <Grid3X3 className="mr-2 h-4 w-4" />
              Permission Matrix
            </Link>
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles?.filter((r) => r.is_system).length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>View, clone, and manage roles</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="text-center text-destructive py-8">
              Failed to load roles. Ensure the RBAC migration has been applied.
            </p>
          ) : !roles?.length ? (
            <p className="text-center text-muted-foreground py-8">
              No roles found. Create your first role to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-2 text-left hover:underline"
                        onClick={() => setDetailRole(role)}
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{role.name}</span>
                        {role.is_system && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {role.description || "—"}
                    </TableCell>
                    <TableCell>{role.permission_count ?? 0}</TableCell>
                    <TableCell>{role.assigned_user_count ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(role.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Clone role"
                          onClick={() => cloneRole.mutate(role.id)}
                          disabled={cloneRole.isPending}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(role)}
                          disabled={role.is_system}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingRoleId(role.id);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={role.is_system}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update role name and description. Use Permission Matrix for access control."
                : "Create a custom role. Assign permissions in the Permission Matrix."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Users assigned this role will lose associated permissions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteRole.isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!detailRole} onOpenChange={(open) => !open && setDetailRole(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {detailRole && (
            <>
              <SheetHeader>
                <SheetTitle>{detailRole.name}</SheetTitle>
                <SheetDescription>{detailRole.description || "No description"}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p>{format(new Date(detailRole.created_at), "PPP")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Permission Count</span>
                  <p>{detailRole.permission_count ?? 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" /> Assigned Users
                  </span>
                  <ul className="mt-2 space-y-1">
                    {!roleUsers?.length ? (
                      <li className="text-muted-foreground">No users assigned</li>
                    ) : (
                      roleUsers.map((entry: any) => (
                        <li key={entry.user_id}>
                          {entry.profiles?.full_name || entry.profiles?.email || entry.user_id}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
