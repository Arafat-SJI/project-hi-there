import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ListChecks,
  Layers,
  Users,
  ChevronRight,
} from "lucide-react";

interface WorkspaceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function WorkspaceCard({ icon, title, description, href }: WorkspaceCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
      onClick={() => navigate(href)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default function WorkspaceHub() {
  const cards: WorkspaceCardProps[] = [
    {
      icon: <ListChecks className="h-5 w-5" />,
      title: "Project Statuses",
      description:
        "Create, rename, reorder, and delete custom project status stages used across the project lifecycle.",
      href: "/admin/settings/project-statuses",
    },
    {
      icon: <Layers className="h-5 w-5" />,
      title: "Project Modules",
      description:
        "Enable or disable the individual tab sections shown inside each project detail view.",
      href: "/admin/settings/project-modules",
    },
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      title: "Dashboard Widgets",
      description:
        "Configure which dashboard widgets are visible for each agency role (Owner, PM, BD, IC).",
      href: "/admin/settings/dashboard-widgets",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Agency Roles",
      description:
        "Assign agency roles (Owner, PM, BD, IC) to team members and configure their EOS dashboard access.",
      href: "/admin/settings/agency-roles",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
        <p className="text-muted-foreground">
          Configure how the platform is organized for your team
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <WorkspaceCard key={card.href} {...card} />
        ))}
      </div>
    </div>
  );
}
