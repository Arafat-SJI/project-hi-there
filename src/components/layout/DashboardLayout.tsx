import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useOnboarding } from "@/hooks/useOnboarding";

const SIDEBAR_OPEN_KEY = "sidebar-open";
const SIDEBAR_WIDTH_EXPANDED = "16rem"; /* 256px */
const SIDEBAR_WIDTH_COLLAPSED = "4rem";  /* 64px */

export function DashboardLayout() {
  const { showOnboarding, loading, completeOnboarding, skipOnboarding } =
    useOnboarding();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_OPEN_KEY) !== "false";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_OPEN_KEY, String(sidebarOpen));
    } catch {
      // ignore
    }
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} onToggleSidebar={toggleSidebar} />
      <TopNav
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main
        className="mt-16 min-h-[calc(100vh-4rem)] p-6 lg:p-8 transition-[margin] duration-200"
        style={{ marginLeft: sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
      >
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
