import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <TopNav />
      <main className="ml-64 mt-16 min-h-[calc(100vh-4rem)] p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
