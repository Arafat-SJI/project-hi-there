import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, 
  Users, 
  Calendar, 
  BookOpen, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Client Management",
    description: "Organize and track all your client relationships in one place.",
  },
  {
    icon: Calendar,
    title: "Meeting Intelligence",
    description: "Auto-transcribe and summarize meetings with AI-powered insights.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Centralized knowledge with semantic search and embeddings.",
  },
  {
    icon: Brain,
    title: "AI Agents",
    description: "Custom AI agents that understand your business context.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Role-based access control and audit logging.",
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description: "Automate repetitive tasks and streamline operations.",
  },
];

const benefits = [
  "Reduce meeting prep time by 80%",
  "AI-powered document generation",
  "Unified search across all data",
  "Real-time collaboration tools",
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Control Tower</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            SJ Innovation Framework v1.0
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your AI-powered
            <br />
            <span className="text-primary">control center</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Streamline client management, automate meeting intelligence, and build a searchable knowledge base. All powered by enterprise-grade AI.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link to="/signup">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link to="/login">View demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to scale
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete platform for modern teams to collaborate, automate, and grow.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card transition-all duration-200 hover:border-border hover:shadow-soft">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-medium">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join teams that are already using Control Tower to streamline their operations.
            </p>
            <Button size="lg" className="mt-8 h-12 px-8 text-base" asChild>
              <Link to="/signup">
                Create your account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span>Control Tower by SJ Innovation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
