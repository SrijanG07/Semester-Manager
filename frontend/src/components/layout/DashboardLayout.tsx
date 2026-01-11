import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { useAuth } from "../../context/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title || "Dashboard"}
          subtitle={subtitle || `Welcome back, ${user?.name || 'Student'}`}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
