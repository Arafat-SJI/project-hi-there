import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Users, Lock } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust Badge */}
          <Badge 
            variant="secondary" 
            className="mb-8 gap-2 border-border/50 bg-muted/80 px-4 py-2 text-sm font-medium backdrop-blur-sm"
          >
            <Shield className="h-3.5 w-3.5 text-primary" />
            Trusted by Financial Institutions, Law Firms, CPAs & Healthcare Practices
          </Badge>

          {/* Main Headline */}
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
            AI Agents That
            <span className="block text-primary">Come to You</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-4 max-w-xl text-xl font-medium text-foreground/80 sm:text-2xl">
            One Private Dashboard. All Your AI. Zero Data Leakage.
          </p>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Stop jumping between ChatGPT, Excel, Google Docs, and scattered meeting notes.
            CollabAI Control Tower brings AI agents directly into your workflow — 
            with your data staying 100% behind your firewall.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              size="lg" 
              className="h-14 px-8 text-base font-semibold shadow-lg transition-all hover:shadow-xl" 
              asChild
            >
              <a href="https://collabai.software/try-demo" target="_blank" rel="noopener noreferrer">
                Request Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 text-base font-semibold" 
              asChild
            >
              <Link to="/login">See How It Works</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>SOC 2 Type II Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>HIPAA Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Your Data Never Leaves</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
