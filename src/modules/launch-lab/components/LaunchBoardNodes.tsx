import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Calendar, CheckSquare, Flag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardData {
  label?: string;
  detail?: string;
  week?: number;
  goals?: string[];
}

const styles: Record<string, string> = {
  week: "border-primary/60 bg-primary/10",
  task: "border-emerald-500/50 bg-emerald-500/10",
  goal: "border-amber-500/50 bg-amber-500/10",
  custom: "border-violet-500/50 bg-violet-500/10",
};

function NodeIcon({ type }: { type: string }) {
  if (type === "week") return <Calendar className="h-3.5 w-3.5 text-primary" />;
  if (type === "task") return <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />;
  if (type === "goal") return <Flag className="h-3.5 w-3.5 text-amber-600" />;
  return <Sparkles className="h-3.5 w-3.5 text-violet-600" />;
}

function LaunchCardNode({ data, type }: NodeProps & { type: string }) {
  const card = (data ?? {}) as CardData;
  const label = card.label ?? "Untitled";
  const isGoal = type === "goal";

  return (
    <div
      className={cn(
        "rounded-xl border-2 px-3 py-2.5 shadow-md min-w-[160px] max-w-[220px] backdrop-blur-sm",
        styles[type] ?? styles.custom,
        isGoal && "min-w-[120px] max-w-[160px]",
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-primary" />
      <div className="flex items-center gap-1.5 mb-1">
        <NodeIcon type={type} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {type === "week" && card.week ? `Week ${card.week}` : type}
        </span>
      </div>
      <p className="text-sm font-semibold leading-snug">{label}</p>
      {card.detail && type === "task" ? (
        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{card.detail}</p>
      ) : null}
      {type === "week" && card.goals && card.goals.length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {card.goals.slice(0, 2).map((goal, i) => (
            <li key={i} className="text-[10px] text-muted-foreground truncate">
              • {goal}
            </li>
          ))}
        </ul>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-primary" />
    </div>
  );
}

export const WeekNode = memo((props: NodeProps) => <LaunchCardNode {...props} type="week" />);
export const TaskNode = memo((props: NodeProps) => <LaunchCardNode {...props} type="task" />);
export const GoalNode = memo((props: NodeProps) => <LaunchCardNode {...props} type="goal" />);
export const CustomNode = memo((props: NodeProps) => <LaunchCardNode {...props} type="custom" />);

WeekNode.displayName = "WeekNode";
TaskNode.displayName = "TaskNode";
GoalNode.displayName = "GoalNode";
CustomNode.displayName = "CustomNode";

export const launchBoardNodeTypes = {
  week: WeekNode,
  task: TaskNode,
  goal: GoalNode,
  custom: CustomNode,
};
