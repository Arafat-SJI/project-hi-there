/**
 * Streams Page
 *
 * Lists all task streams with task/member counts.
 * Back button to My Tasks; allows creating new streams.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import { useTaskStreams } from "../hooks/useTaskStreams";
import { StreamCard } from "../components/streams/StreamCard";
import { CreateStreamDialog } from "../components/streams/CreateStreamDialog";

export default function StreamsPage() {
  const navigate = useNavigate();
  const { data: streams, isLoading } = useTaskStreams();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate("/tasks")}
        className="rounded-lg"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        My Tasks
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Streams</h1>
          <p className="text-muted-foreground">Organize tasks into focused workspaces</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Stream
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : streams && streams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No streams yet</p>
          <p className="text-sm mb-4">Create a stream to organize your tasks.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Stream
          </Button>
        </div>
      )}

      <CreateStreamDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
