import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
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
import type { LaunchBoardState, LaunchFlowNodeData } from "../types";

interface LaunchFlowBoardProps {
  board: LaunchBoardState;
  onBoardChange: (board: LaunchBoardState) => void;
}

type NodeDataPatch = Partial<Pick<LaunchFlowNodeData, "label" | "detail" | "week" | "goals">>;

const BOARD_PERSIST_DEBOUNCE_MS = 400;

function attachNodeEditors(
  nodes: Node[],
  onDataChange: (nodeId: string, patch: NodeDataPatch) => void,
): Node[] {
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onDataChange: (patch: NodeDataPatch) => onDataChange(node.id, patch),
    },
  }));
}

export function LaunchFlowBoard({ board, onBoardChange }: LaunchFlowBoardProps) {
  const lastEmittedBoardRef = useRef(JSON.stringify(board));
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initial = useMemo(() => boardToFlow(board), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const persistWith = useCallback(
    (nextNodes: Node[], nextEdges: Edge[], immediate = false) => {
      const run = () => {
        const nextBoard = flowToBoard(nextNodes, nextEdges);
        lastEmittedBoardRef.current = JSON.stringify(nextBoard);
        onBoardChange(nextBoard);
      };

      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      if (immediate) {
        run();
        return;
      }

      persistTimerRef.current = setTimeout(run, BOARD_PERSIST_DEBOUNCE_MS);
    },
    [onBoardChange],
  );

  const updateNodeData = useCallback(
    (nodeId: string, patch: NodeDataPatch) => {
      setNodes((currentNodes) => {
        const nextNodes = currentNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...patch,
                  onDataChange: node.data.onDataChange,
                },
              }
            : node,
        );
        persistWith(nextNodes, edgesRef.current);
        return nextNodes;
      });
    },
    [persistWith, setNodes],
  );

  const updateNodeDataRef = useRef(updateNodeData);
  useEffect(() => {
    updateNodeDataRef.current = updateNodeData;
  }, [updateNodeData]);

  const syncFromBoard = useCallback(
    (nextBoard: LaunchBoardState) => {
      const flow = boardToFlow(nextBoard);
      const withEditors = attachNodeEditors(flow.nodes, (id, patch) =>
        updateNodeDataRef.current(id, patch),
      );
      setNodes(withEditors);
      setEdges(flow.edges);
    },
    [setNodes, setEdges],
  );

  useEffect(() => {
    const serialized = JSON.stringify(board);
    if (serialized === lastEmittedBoardRef.current) return;
    lastEmittedBoardRef.current = serialized;
    syncFromBoard(board);
  }, [board, syncFromBoard]);

  useEffect(() => {
    syncFromBoard(board);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) => {
        const nextEdges = addEdge(
          {
            ...connection,
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          },
          currentEdges,
        );
        persistWith(nodesRef.current, nextEdges, true);
        return nextEdges;
      });
    },
    [persistWith, setEdges],
  );

  const onNodeDragStop = useCallback(() => {
    persistWith(nodesRef.current, edgesRef.current, true);
  }, [persistWith]);

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      const removed = changes.some((c) => c.type === "remove");
      if (removed) {
        requestAnimationFrame(() => {
          persistWith(nodesRef.current, edgesRef.current, true);
        });
      }
    },
    [onEdgesChange, persistWith],
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
      data: {
        ...custom.data,
        onDataChange: (patch: NodeDataPatch) => updateNodeDataRef.current(custom.id, patch),
      },
    };
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    persistWith(nextNodes, edges, true);
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
          Drag cards · connect handles · click cards to edit text
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
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          }}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        <LayoutGrid className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Your weekly milestones and next steps from Idea Canvas are loaded as draggable cards.
          Edit titles directly on each card, rearrange the launch sequence, and connect dependencies.
        </p>
      </div>
    </div>
  );
}
