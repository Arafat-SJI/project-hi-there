import { Check, X } from "lucide-react";

const comparisons = [
  {
    problem: "ChatGPT banned at your firm — confidentiality risk",
    solution: "AI runs behind YOUR firewall",
  },
  {
    problem: "Juggling Excel, Docs, Zoom notes, and emails",
    solution: "One unified dashboard",
  },
  {
    problem: "$60/user/month with 150-seat minimums",
    solution: "Flat annual pricing, no minimums",
  },
  {
    problem: "Generic AI that doesn't understand your industry",
    solution: "Pre-built agents for law, accounting, healthcare, banking",
  },
  {
    problem: "No audit trail for compliance officers",
    solution: "Full logging and role-based access",
  },
  {
    problem: "Meeting summaries lost in email threads",
    solution: "Auto-transcribed, searchable, actionable",
  },
];

export function ProblemSolution() {
  return (
    <section className="border-y border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Replace the Chaos with One Command Center
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how Control Tower transforms the way professional services firms use AI
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-4">
            {/* Header */}
            <div className="grid grid-cols-2 gap-4 pb-2 text-sm font-semibold text-muted-foreground">
              <div className="flex items-center gap-2 pl-4">
                <X className="h-4 w-4 text-destructive" />
                The Old Way
              </div>
              <div className="flex items-center gap-2 pl-4">
                <Check className="h-4 w-4 text-primary" />
                With Control Tower
              </div>
            </div>

            {/* Comparison Rows */}
            {comparisons.map((item, index) => (
              <div 
                key={index} 
                className="grid grid-cols-2 gap-4 rounded-lg border border-border/50 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <X className="h-3 w-3 text-destructive" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item.problem}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
