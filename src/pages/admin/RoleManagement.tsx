import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus, Edit, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

const AVAILABLE_PERMISSIONS = [
  { resource: "users", action: "read", label: "View Users" },
  { resource: "users", action: "create", label: "Create Users" },
  { resource: "users", action: "update", label: "Update Users" },
  { resource: "users", action: "delete", label: "Delete Users" },
  { resource: "clients", action: "read", label: "View Clients" },
  { resource: "clients", action: "create", label: "Create Clients" },
  { resource: "clients", action: "update", label: "Update Clients" },
  { resource: "clients", action: "delete", label: "Delete Clients" },
  { resource: "meetings", action: "read", label: "View Meetings" },
  { resource: "meetings", action: "create", label: "Create Meetings" },
  { resource: "meetings", action: "update", label: "Update Meetings" },
  { resource: "meetings", action: "delete", label: "Delete Meetings" },
  { resource: "knowledge", action: "read", label: "View Knowledge Base" },
  { resource: "knowledge", action: "create", label: "Create Knowledge" },
  { resource: "knowledge", action: "update", label: "Update Knowledge" },
  { resource: "knowledge", action: "delete", label: "Delete Knowledge" },
  { resource: "admin", action: "access", label: "Access Admin Panel" },
  { resource: "settings", action: "manage", label: "Manage System Settings" },
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      permissions: [],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setProcessing(true);
    try {
      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from("roles")
          .update({
            name: formData.name,
            description: formData.description || null,
            permissions: formData.permissions,
          })
          .eq("id", editingRole.id);

        if (error) throw error;
        toast.success("Role updated successfully");
      } else {
        // Create new role
        const { error } = await supabase.from("roles").insert({
          name: formData.name,
          description: formData.description || null,
          permissions: formData.permissions,
        });

        if (error) throw error;
        toast.success("Role created successfully");
      }

      setDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast.error("Failed to save role");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role? Users with this role will lose their permissions.")) {
      return;
    }

    try {
      const { error } = await supabase.from("roles").delete().eq("id", roleId);

      if (error) throw error;
      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    }
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const groupPermissionsByResource = () => {
    const grouped: Record<string, typeof AVAILABLE_PERMISSIONS> = {};
    AVAILABLE_PERMISSIONS.forEach((perm) => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    return grouped;
  };

  const groupedPermissions = groupPermissionsByResource();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and their associated permissions
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{AVAILABLE_PERMISSIONS.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(groupedPermissions).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>View and manage user roles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No roles found. Create your first role to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions?.slice(0, 3).map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {(role.permissions?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(role.permissions?.length || 0) - 3} more
                            </Badge>
                          )}
                          {(!role.permissions || role.permissions.length === 0) && (
                            <span className="text-sm text-muted-foreground">No permissions</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role name, description, and permissions"
                : "Create a new role with custom permissions"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Manager, Editor, Viewer"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={processing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this role can do"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                disabled={processing}
              />
            </div>
            <div className="space-y-4">
              <Label>Permissions</Label>
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                  <Card key={resource}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium capitalize">
                        {resource}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {permissions.map((perm) => {
                        const permKey = `${perm.resource}:${perm.action}`;
                        return (
                          <div
                            key={permKey}
                            className="flex items-center justify-between space-x-2"
                          >
                            <Label
                              htmlFor={permKey}
                              className="flex-1 cursor-pointer text-sm font-normal"
                            >
                              {perm.label}
                            </Label>
                            <Switch
                              id={permKey}
                              checked={formData.permissions.includes(permKey)}
                              onCheckedChange={() => togglePermission(permKey)}
                              disabled={processing}
                            />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {editingRole ? "Update Role" : "Create Role"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
