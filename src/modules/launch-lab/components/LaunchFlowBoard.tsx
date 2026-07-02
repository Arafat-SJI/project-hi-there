import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Link2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { launchBoardNodeTypes } from "./LaunchBoardNodes";
import {
  boardToFlow,
  createCustomNode,
  flowToBoard,
} from "../lib/launch-board";
import type { LaunchBoardState } from "../types";

interface LaunchFlowBoardProps {
  board: LaunchBoardState;
  onBoardChange: (board: LaunchBoardState) => void;
}

export function LaunchFlowBoard({ board, onBoardChange }: LaunchFlowBoardProps) {
  const initial = useMemo(() => boardToFlow(board), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const skipSyncRef = useRef(false);

  useEffect(() => {
    skipSyncRef.current = true;
    const flow = boardToFlow(board);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [board, setNodes, setEdges]);

  const persist = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      if (skipSyncRef.current) {
        skipSyncRef.current = false;
        return;
      }
      onBoardChange(flowToBoard(nextNodes, nextEdges));
    },
    [onBoardChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          },
          eds,
        );
        persist(nodes, next);
        return next;
      });
    },
    [nodes, setEdges, persist],
  );

  const onNodeDragStop = useCallback(() => {
    persist(nodes, edges);
  }, [nodes, edges, persist]);

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      const removed = changes.some((c) => c.type === "remove");
      if (removed) {
        requestAnimationFrame(() => {
          setEdges((currentEdges) => {
            persist(nodes, currentEdges);
            return currentEdges;
          });
        });
      }
    },
    [onEdgesChange, nodes, persist, setEdges],
  );

  const addNode = (type: "task" | "week" | "custom") => {
    const custom = createCustomNode(
      type,
      { x: 120 + nodes.length * 30, y: 80 + nodes.length * 20 },
      type === "week" ? "New week milestone" : type === "task" ? "New task" : "New card",
    );
    const newNode: Node = {
      id: custom.id,
      type: custom.type,
      position: custom.position,
      data: custom.data,
    };
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    persist(nextNodes, edges);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => addNode("week")}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Week card
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addNode("task")}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Task card
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addNode("custom")}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Custom card
        </Button>
        <p className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
          <Link2 className="h-3.5 w-3.5" />
          Drag cards · connect handles to draw flow lines
        </p>
      </div>

      <div className="h-[min(70vh,560px)] rounded-xl border bg-muted/20 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={launchBoardNodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          }}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={2}
            zoomable
            pannable
            className="!bg-background/80"
          />
        </ReactFlow>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        <LayoutGrid className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Your weekly milestones and next steps from Idea Canvas are loaded as draggable cards.
          Rearrange the launch sequence, link dependencies, and build your execution flowchart.
        </p>
      </div>
    </div>
  );
}
