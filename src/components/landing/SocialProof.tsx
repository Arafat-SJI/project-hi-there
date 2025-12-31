import { Quote, TrendingUp, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "As a business owner, it's been a game-changer. I don't pay for ChatGPT, Claude, or Gemini separately — it's all bundled and controlled.",
    author: "Arpit Khemka",
    role: "CEO",
  },
  {
    quote:
      "Our response time dropped by 70% while maintaining data sovereignty. Finally, AI we can actually use.",
    author: "Michael Chen",
    role: "CTO, Legal Services Firm",
  },
];

const stats = [
  {
    icon: TrendingUp,
    value: "80%",
    label: "of firms cite efficiency as #1 AI goal",
  },
  {
    icon: Zap,
    value: "75%",
    label: "of legal tasks could be automated",
  },
  {
    icon: Clock,
    value: "2x",
    label: "faster research with AI assistance",
  },
];

export function SocialProof() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Why Firms Are Switching
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Join forward-thinking organizations already transforming their workflows
        </p>
      </div>

      {/* Testimonials */}
      <div className="mx-auto mt-16 grid max-w-4xl gap-8 lg:grid-cols-2">
        {testimonials.map((testimonial, index) => (
          <Card 
            key={index} 
            className="relative border-border/50 bg-gradient-to-br from-card to-muted/30"
          >
            <CardContent className="p-8">
              <Quote className="mb-4 h-8 w-8 text-primary/30" />
              <blockquote className="text-lg leading-relaxed text-foreground">
                "{testimonial.quote}"
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="mx-auto mt-16 grid max-w-4xl gap-8 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <stat.icon className="h-7 w-7 text-primary" />
            </div>
            <p className="text-4xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
