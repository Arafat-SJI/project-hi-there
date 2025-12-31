import { Brain, Shield, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const valueProps = [
  {
    icon: Brain,
    title: "AI Agents Come to You",
    description:
      "No more switching between 5 different AI tools. Your specialized agents — Legal Research, Tax Advisor, Contract Analyzer — all live in one place.",
  },
  {
    icon: Shield,
    title: "Your Data. Your Firewall.",
    description:
      "Deploy on-premises or in your private cloud. Client files, patient records, financial data — nothing ever leaves your environment.",
  },
  {
    icon: Building2,
    title: "One Dashboard Per Department",
    description:
      "Each team gets their own private workspace. Legal. Accounting. Operations. All connected. All controlled.",
  },
];

export function ValueProps() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your AI Control Center
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Built for professional services firms that demand privacy, compliance, and efficiency
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
        {valueProps.map((prop, index) => (
          <Card 
            key={index} 
            className="group relative overflow-hidden border-border/50 bg-gradient-to-b from-card to-muted/20 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
          >
            <CardContent className="p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <prop.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {prop.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {prop.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
