import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useOnboarding } from "@/hooks/useOnboarding";

export function DashboardLayout() {
  const { showOnboarding, loading, completeOnboarding, skipOnboarding } =
    useOnboarding();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <TopNav />
      <main className="ml-64 mt-16 min-h-[calc(100vh-4rem)] p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Onboarding Wizard */}
      {!loading && showOnboarding && (
        <OnboardingWizard
          open={showOnboarding}
          onClose={skipOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </div>
  );
}
