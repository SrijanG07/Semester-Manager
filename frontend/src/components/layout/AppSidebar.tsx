import { Home, BookOpen, Clock, Calendar, BarChart3, Settings, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Subjects", path: "/subjects" },
    { icon: Clock, label: "Study Tracker", path: "/study" },
    { icon: Calendar, label: "Deadlines", path: "/deadlines" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">📚 Semester Manager</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "sidebar-link",
              isActive(item.path) && "sidebar-link-active"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
