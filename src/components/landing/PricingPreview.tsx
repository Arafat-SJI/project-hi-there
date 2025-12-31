import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const comparisonData = [
  {
    feature: "Annual Cost (20 users)",
    chatgpt: "$108,000+",
    copilot: "$7,200+",
    controlTower: "Starting at $4,000",
    highlight: true,
  },
  {
    feature: "Private/On-Prem Option",
    chatgpt: false,
    copilot: false,
    controlTower: true,
  },
  {
    feature: "Domain-Specific Agents",
    chatgpt: false,
    copilot: false,
    controlTower: true,
  },
  {
    feature: "Full Audit Trails",
    chatgpt: "Limited",
    copilot: "Limited",
    controlTower: true,
  },
  {
    feature: "No Seat Minimums",
    chatgpt: false,
    copilot: false,
    controlTower: true,
  },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-primary" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground/50" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export function PricingPreview() {
  return (
    <section className="border-y border-border/50 bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Enterprise AI Without Enterprise Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get all the power without the bloated costs
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-xl border border-border bg-card">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 border-b border-border bg-muted/50 p-4 text-sm font-semibold">
            <div></div>
            <div className="text-center text-muted-foreground">ChatGPT Enterprise</div>
            <div className="text-center text-muted-foreground">Microsoft Copilot</div>
            <div className="text-center text-primary">Control Tower</div>
          </div>

          {/* Table Body */}
          {comparisonData.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-4 gap-4 border-b border-border/50 p-4 last:border-0 ${
                row.highlight ? "bg-primary/5" : ""
              }`}
            >
              <div className="text-sm font-medium text-foreground">{row.feature}</div>
              <div className="flex items-center justify-center text-muted-foreground">
                <CellValue value={row.chatgpt} />
              </div>
              <div className="flex items-center justify-center text-muted-foreground">
                <CellValue value={row.copilot} />
              </div>
              <div className="flex items-center justify-center font-medium text-foreground">
                <CellValue value={row.controlTower} />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button size="lg" variant="outline" className="h-12 rounded-full px-8" asChild>
            <Link to="/pricing">See Full Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
