import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateTask } from "../hooks/useTasksV2";
import { useTaskStreams } from "../hooks/useTaskStreams";
import type { TaskStatus, TaskPriority } from "../types/tasks";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string().default("todo"),
  priority: z.string().default("medium"),
  due_date: z.string().optional(),
  stream_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStreamId?: string;
  parentId?: string;
}

export function CreateTaskDialog({ open, onOpenChange, defaultStreamId, parentId }: CreateTaskDialogProps) {
  const createTask = useCreateTask();
  const { data: streams } = useTaskStreams();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "todo",
      priority: "medium",
      stream_id: defaultStreamId,
    },
  });

  const onSubmit = async (data: FormValues) => {
    await createTask.mutateAsync({
      title: data.title,
      description: data.description,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      due_date: data.due_date,
      stream_id: data.stream_id || undefined,
      parent_id: parentId,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{parentId ? "Add Subtask" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              {...register("title")}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Status & Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue="todo" onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select defaultValue="medium" onValueChange={(v) => setValue("priority", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="datetime-local"
              {...register("due_date")}
            />
          </div>

          {/* Stream (not for subtasks) */}
          {!parentId && streams && streams.length > 0 && (
            <div className="space-y-2">
              <Label>Stream</Label>
              <Select
                defaultValue={defaultStreamId}
                onValueChange={(v) => setValue("stream_id", v === "none" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No stream" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No stream</SelectItem>
                  {streams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: stream.color }}
                        />
                        {stream.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {parentId ? "Add Subtask" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
