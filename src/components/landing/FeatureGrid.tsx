import { 
  Video, 
  FileText, 
  Bot, 
  Users, 
  ShieldCheck, 
  Workflow 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Video,
    title: "Meeting Intelligence",
    description:
      "Zoom and Teams recordings auto-transcribed, summarized, and searchable. Action items extracted automatically.",
  },
  {
    icon: FileText,
    title: "Private Knowledge Base",
    description:
      "Connect your documents, policies, and client files. AI retrieves context instantly.",
  },
  {
    icon: Bot,
    title: "Domain-Specific AI Agents",
    description:
      "Pre-built for legal research, tax questions, contract analysis, financial reporting.",
  },
  {
    icon: Users,
    title: "Client Management",
    description:
      "All relationships, communications, and history in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Audit Trails",
    description:
      "Every AI query logged. Role-based permissions. Built for regulated industries.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Automate document generation, reporting, and routine tasks.",
  },
];

export function FeatureGrid() {
  return (
    <section className="border-y border-border/50 bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything Flows Through Control Tower
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete platform designed for professional services firms
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group border-border/50 bg-card transition-all duration-200 hover:border-border hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
