import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Lock, Server } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="px-8 py-16 sm:px-16 sm:py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Your Firm's Own AI.
            <span className="block text-primary">Behind Your Firewall.</span>
          </h2>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Join forward-thinking law firms, accounting practices, and healthcare groups 
            who are already using AI — without compromising client confidentiality.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              size="lg" 
              className="h-14 px-10 text-base font-semibold shadow-lg"
              asChild
            >
              <a href="https://collabai.software/try-demo" target="_blank" rel="noopener noreferrer">
                Schedule a Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-10 text-base font-semibold bg-background/50 backdrop-blur-sm"
              asChild
            >
              <a href="https://collabai.software/contact" target="_blank" rel="noopener noreferrer">
                Talk to Sales
              </a>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
              <Shield className="h-4 w-4" />
              SOC 2 Compliant
            </Badge>
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
              <Lock className="h-4 w-4" />
              HIPAA Ready
            </Badge>
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
              <Server className="h-4 w-4" />
              Data Never Leaves Your Environment
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
