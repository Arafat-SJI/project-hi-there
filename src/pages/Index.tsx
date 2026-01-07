import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";

import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { ValueProps } from "@/components/landing/ValueProps";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { SocialProof } from "@/components/landing/SocialProof";
import { PricingPreview } from "@/components/landing/PricingPreview";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function Index() {
  const { companyName, tagline, logoUrl } = useBranding();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-foreground">{companyName}</span>
              <span className="text-sm font-medium text-muted-foreground">Control Tower</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link to="#industries" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Industries
            </Link>
            <Link to="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <a
              href="https://collabai.software"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Resources
            </a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <a href="https://collabai.software/try-demo" target="_blank" rel="noopener noreferrer">
                Request Demo
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <HeroSection />
        <ProblemSolution />
        <ValueProps />
        <FeatureGrid />
        <SocialProof />
        <PricingPreview />
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
