import type { Edge, Node } from "@xyflow/react";
import type {
  IdeaCanvasResult,
  LaunchBoardState,
  LaunchFlowEdge,
  LaunchFlowNode,
  LaunchFlowNodeType,
} from "../types";

const WEEK_SPACING_X = 300;
const TASK_ROW_Y = 280;
const GOAL_OFFSET_Y = 140;

export function isLaunchBoardEmpty(board: LaunchBoardState | null | undefined): boolean {
  return !board?.nodes?.length;
}

export function buildLaunchBoardFromCanvas(canvas: IdeaCanvasResult): LaunchBoardState {
  const nodes: LaunchFlowNode[] = [];
  const edges: LaunchFlowEdge[] = [];

  const milestones = canvas.milestones ?? [];
  milestones.forEach((milestone, index) => {
    const weekId = `week-${milestone.week}-${index}`;
    nodes.push({
      id: weekId,
      type: "week",
      position: { x: 80 + index * WEEK_SPACING_X, y: 40 },
      data: {
        label: milestone.title,
        week: milestone.week,
        goals: milestone.goals ?? [],
        sourceId: `milestone-${milestone.week}`,
      },
    });

    if (index > 0) {
      const prevId = `week-${milestones[index - 1].week}-${index - 1}`;
      edges.push({
        id: `edge-${prevId}-${weekId}`,
        source: prevId,
        target: weekId,
      });
    }

    (milestone.goals ?? []).slice(0, 3).forEach((goal, goalIndex) => {
      const goalId = `${weekId}-goal-${goalIndex}`;
      nodes.push({
        id: goalId,
        type: "goal",
        position: {
          x: 80 + index * WEEK_SPACING_X + goalIndex * 90 - 90,
          y: GOAL_OFFSET_Y,
        },
        data: { label: goal, week: milestone.week, sourceId: weekId },
      });
      edges.push({
        id: `edge-${weekId}-${goalId}`,
        source: weekId,
        target: goalId,
      });
    });
  });

  const nextSteps = canvas.clusters.next_steps ?? [];
  nextSteps.forEach((step, index) => {
    const taskId = `task-${step.id}`;
    nodes.push({
      id: taskId,
      type: "task",
      position: {
        x: 60 + (index % 4) * 220,
        y: TASK_ROW_Y + Math.floor(index / 4) * 120,
      },
      data: {
        label: step.title,
        detail: step.detail,
        sourceId: step.id,
      },
    });
  });

  if (milestones.length > 0 && nextSteps.length > 0) {
    const firstWeekId = `week-${milestones[0].week}-0`;
    const firstTaskId = `task-${nextSteps[0].id}`;
    edges.push({
      id: `edge-${firstWeekId}-${firstTaskId}`,
      source: firstWeekId,
      target: firstTaskId,
    });
  }

  return { nodes, edges };
}

export function resolveLaunchBoard(
  canvas: IdeaCanvasResult,
  existing: LaunchBoardState | null | undefined,
): LaunchBoardState {
  if (!isLaunchBoardEmpty(existing)) {
    return existing!;
  }
  return buildLaunchBoardFromCanvas(canvas);
}

function toFlowNodeType(type: LaunchFlowNodeType): string {
  return type;
}

export function boardToFlow(board: LaunchBoardState): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: board.nodes.map((node) => ({
      id: node.id,
      type: toFlowNodeType(node.type),
      position: node.position,
      data: { ...node.data },
    })),
    edges: board.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
    })),
  };
}

export function flowToBoard(nodes: Node[], edges: Edge[]): LaunchBoardState {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: (node.type ?? "custom") as LaunchFlowNodeType,
      position: node.position,
      data: {
        label: String(node.data?.label ?? "Untitled"),
        detail: node.data?.detail ? String(node.data.detail) : undefined,
        week: typeof node.data?.week === "number" ? node.data.week : undefined,
        goals: Array.isArray(node.data?.goals) ? (node.data.goals as string[]) : undefined,
        sourceId: node.data?.sourceId ? String(node.data.sourceId) : undefined,
      },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };
}

let customNodeCounter = 0;

export function createCustomNode(
  type: LaunchFlowNodeType,
  position: { x: number; y: number },
  label: string,
): LaunchFlowNode {
  customNodeCounter += 1;
  return {
    id: `${type}-custom-${customNodeCounter}`,
    type,
    position,
    data: { label },
  };
}
