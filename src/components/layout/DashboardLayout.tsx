import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useOnboarding } from "@/hooks/useOnboarding";

export function DashboardLayout() {
  const { showOnboarding, loading, completeOnboarding, skipOnboarding } =
    useOnboarding();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <TopNav />
          <main className="flex-1 min-w-0 overflow-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>

        {!loading && showOnboarding && (
          <OnboardingWizard
            open={showOnboarding}
            onClose={skipOnboarding}
            onComplete={completeOnboarding}
          />
        )}
      </div>
    </SidebarProvider>
  );
}
