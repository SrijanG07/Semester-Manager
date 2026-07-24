import {
    Home, BookOpen, Clock, Calendar, BarChart3, LogOut, GraduationCap,
    Settings, CalendarDays, Calculator, Trophy, StickyNote, Brain, ChevronLeft, ChevronRight
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getInitials = (name: string) =>
        name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    const navSections = [
        {
            label: "Overview",
            items: [
                { icon: Home, label: "Dashboard", path: "/dashboard" },
                { icon: BarChart3, label: "Analytics", path: "/analytics" },
            ],
        },
        {
            label: "Academic",
            items: [
                { icon: BookOpen, label: "Subjects", path: "/subjects" },
                { icon: Calculator, label: "GPA Calculator", path: "/gpa" },
                { icon: CalendarDays, label: "Timetable", path: "/timetable" },
                { icon: Calendar, label: "Deadlines", path: "/deadlines" },
            ],
        },
        {
            label: "Study",
            items: [
                { icon: Clock, label: "Study Tracker", path: "/study" },
                { icon: Brain, label: "Exam Prep", path: "/exam-prep" },
                { icon: StickyNote, label: "Notes", path: "/notes" },
                { icon: Trophy, label: "Achievements", path: "/achievements" },
            ],
        },
    ];

    const isActive = (path: string) =>
        location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path));

    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0 transition-all duration-300 relative",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* Brand */}
            <div className={cn(
                "flex items-center h-16 border-b border-sidebar-border transition-all duration-300",
                collapsed ? "px-4 justify-center" : "px-5 gap-2.5"
            )}>
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                {!collapsed && (
                    <span className="text-[15px] font-bold text-foreground tracking-tight animate-fade-in">
                        AcademiQ
                    </span>
                )}
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute top-[18px] -right-3 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-accent transition-colors z-10"
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-thin">
                {navSections.map(section => (
                    <div key={section.label}>
                        {!collapsed && (
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
                                {section.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={collapsed ? item.label : undefined}
                                    className={cn(
                                        "sidebar-link",
                                        collapsed && "justify-center px-0",
                                        isActive(item.path) && "sidebar-link-active"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-[18px] h-[18px] flex-shrink-0 sidebar-icon",
                                        isActive(item.path) ? "text-primary" : ""
                                    )} />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-4 mt-auto">
                <div className="border-t border-sidebar-border pt-3 space-y-1">
                    {/* Settings */}
                    <Link
                        to="/settings"
                        title={collapsed ? "Settings" : undefined}
                        className={cn(
                            "sidebar-link",
                            collapsed && "justify-center px-0",
                            isActive("/settings") && "sidebar-link-active"
                        )}
                    >
                        <Settings className={cn(
                            "w-[18px] h-[18px] flex-shrink-0",
                            isActive("/settings") ? "text-primary" : ""
                        )} />
                        {!collapsed && <span>Settings</span>}
                    </Link>

                    {/* User info + logout */}
                    {!collapsed && (
                        <div className="flex items-center gap-2.5 px-3 py-2 mt-2">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {user ? getInitials(user.name) : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        title={collapsed ? "Log out" : undefined}
                        className={cn(
                            "sidebar-link w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5",
                            collapsed && "justify-center px-0"
                        )}
                    >
                        <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                        {!collapsed && <span>Log out</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
