import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKnowledgeEntry, useCreateKnowledgeEntry, useUpdateKnowledgeEntry, useKnowledgeCategories } from "@/hooks/useKnowledge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";

export default function KnowledgeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: entry, isLoading: loadingEntry } = useKnowledgeEntry(id || "");
  const { data: categories } = useKnowledgeCategories();
  const createEntry = useCreateKnowledgeEntry();
  const updateEntry = useUpdateKnowledgeEntry();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (entry && isEditing) {
      setFormData({
        title: entry.title,
        content: entry.content,
        category: entry.category_id || "",
        tags: entry.tags || [],
      });
    }
  }, [entry, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (isEditing) {
        await updateEntry.mutateAsync({
          id: id!,
          data: formData,
        });
      } else {
        await createEntry.mutateAsync(formData);
      }
      navigate("/knowledge");
    } catch (error: any) {
      console.error("Submit error:", error);
      // Error toast is handled by the hook
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (isEditing && loadingEntry) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Edit Knowledge Entry" : "Add Knowledge Entry"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update your knowledge entry" : "Create a new knowledge entry"}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/knowledge")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
          <CardDescription>
            Fill in the information below to {isEditing ? "update" : "create"} your knowledge entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter entry title"
                required
                disabled={createEntry.isPending || updateEntry.isPending}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={createEntry.isPending || updateEntry.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your knowledge content..."
                rows={12}
                required
                disabled={createEntry.isPending || updateEntry.isPending}
                className="font-mono text-sm"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tags (press Enter)"
                  disabled={createEntry.isPending || updateEntry.isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || createEntry.isPending || updateEntry.isPending}
                >
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                        disabled={createEntry.isPending || updateEntry.isPending}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={createEntry.isPending || updateEntry.isPending}
              >
                {(createEntry.isPending || updateEntry.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Update Entry" : "Create Entry"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/knowledge")}
                disabled={createEntry.isPending || updateEntry.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
