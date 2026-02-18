/**
 * Skill Management Admin Page
 * 
 * Manage employee skills and competencies
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  RefreshCw,
  Plus,
  MoreHorizontal,
  Award,
  BookOpen,
  Users,
  Trophy,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Skill {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  employees_count?: number;
  created_at: string;
}

function useSkills(search?: string, category?: string) {
  return useQuery({
    queryKey: ["skills", search, category],
    queryFn: async (): Promise<Skill[]> => {
      let query = (supabase as any)
        .from("skills")
        .select(`
          *,
          employee_skills(count)
        `)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((skill: any) => ({
        ...skill,
        employees_count: skill.employee_skills?.[0]?.count || 0,
      })) as Skill[];
    },
  });
}

function useSkillStats() {
  return useQuery({
    queryKey: ["skill-stats"],
    queryFn: async () => {
      // Total skills
      const { count: totalSkills } = await (supabase as any)
        .from("skills")
        .select("*", { count: "exact", head: true });

      // Categories count
      const { data: categories } = await (supabase as any)
        .from("skills")
        .select("category")
        .not("category", "is", null);
      const uniqueCategories = new Set(categories?.map((c: any) => c.category) || []).size;

      // Employees with skills
      const { count: employeesWithSkills } = await (supabase as any)
        .from("employee_skills")
        .select("employee_id", { count: "exact", head: true });

      // Average skills per employee
      const { data: employeeSkills } = await (supabase as any)
        .from("employee_skills")
        .select("employee_id");
      const employeeCount = new Set(employeeSkills?.map((es: any) => es.employee_id) || []).size;
      const avgPerSkill = employeeCount > 0 && totalSkills
        ? Math.round((totalSkills / employeeCount) * 10) / 10
        : 0;

      return {
        totalSkills: totalSkills || 0,
        categories: uniqueCategories,
        employeesWithSkills: employeesWithSkills || 0,
        avgPerSkill,
      };
    },
  });
}

interface CreateSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateSkillDialog({ open, onOpenChange }: CreateSkillDialogProps) {
  const queryClient = useQueryClient();
  const [skillName, setSkillName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSkillName("");
      setCategory("");
      setDescription("");
    }
  }, [open]);

  const createSkill = useMutation({
    mutationFn: async (data: { name: string; category?: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from("skills")
        .insert([
          {
            name: data.name,
            category: data.category || null,
            description: data.description || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: ["skill-stats"] });
      toast.success("Skill created successfully");
      setSkillName("");
      setCategory("");
      setDescription("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create skill: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      toast.error("Skill name is required");
      return;
    }

    try {
      await createSkill.mutateAsync({
        name: skillName.trim(),
        category: category.trim() || undefined,
        description: description.trim() || undefined,
      });
    } catch (error) {
      // Error is handled by onError callback
      console.error("Error creating skill:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Skill</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skillName">
              Skill Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="skillName"
              placeholder="e.g., React.js, Project Management"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              required
              disabled={createSkill.isPending}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Technical, Management"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={createSkill.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the skill (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={createSkill.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSkill.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSkill.isPending || !skillName.trim()}>
              {createSkill.isPending ? "Creating..." : "Create Skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SkillManagement() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: skills = [], isLoading, refetch } = useSkills(
    search || undefined,
    categoryFilter !== "all" ? categoryFilter : undefined
  );
  const { data: stats, isLoading: statsLoading } = useSkillStats();

  const categories = Array.from(
    new Set(skills.map((s) => s.category).filter((c): c is string => c !== null))
  );

  const handleRefresh = () => {
    refetch();
    toast.success("Skills refreshed");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Skill Management</h1>
        <p className="text-muted-foreground">Manage employee skills and competencies</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-purple-600" />
              <p className="text-sm text-muted-foreground">Total Skills</p>
            </div>
            <p className="text-3xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalSkills || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
            <p className="text-3xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.categories || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Employees with Skills</p>
            </div>
            <p className="text-3xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.employeesWithSkills || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-muted-foreground">Avg per Skill</p>
            </div>
            <p className="text-3xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.avgPerSkill || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Skill
        </Button>
      </div>

      {/* Create Skill Dialog */}
      <CreateSkillDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Skills Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Skill Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : skills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No skills found
                </TableCell>
              </TableRow>
            ) : (
              skills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="font-medium">{skill.name}</TableCell>
                  <TableCell>{skill.category || "-"}</TableCell>
                  <TableCell className="max-w-md truncate">{skill.description || "-"}</TableCell>
                  <TableCell>{skill.employees_count || 0}</TableCell>
                  <TableCell>
                    {format(new Date(skill.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View Employees</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

