import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { TopNav } from "./TopNav";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <TopNav />
      <main className="ml-64 mt-16 min-h-[calc(100vh-4rem)] p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
