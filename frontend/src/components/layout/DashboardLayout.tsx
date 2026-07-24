import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { Menu, X, GraduationCap, Home, BookOpen, Clock, Calendar, BarChart3, Calculator, CalendarDays, Brain, StickyNote, Trophy, Settings, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";

interface DashboardLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

const mobileNavItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Subjects", path: "/subjects" },
    { icon: Calculator, label: "GPA", path: "/gpa" },
    { icon: CalendarDays, label: "Timetable", path: "/timetable" },
    { icon: Clock, label: "Study", path: "/study" },
    { icon: Calendar, label: "Deadlines", path: "/deadlines" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Brain, label: "Exam Prep", path: "/exam-prep" },
    { icon: StickyNote, label: "Notes", path: "/notes" },
    { icon: Trophy, label: "Achievements", path: "/achievements" },
    { icon: Settings, label: "Settings", path: "/settings" },
];

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const isActive = (path: string) =>
        location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path));

    return (
        <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-card border-b border-border">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 rounded-lg hover:bg-accent transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-sm font-bold text-foreground">AcademiQ</span>
                    </div>
                </div>

                {/* Mobile drawer overlay */}
                {mobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-50">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border animate-slide-in-left overflow-y-auto">
                            <div className="flex items-center justify-between h-14 px-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                        <GraduationCap className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                    <span className="text-sm font-bold">AcademiQ</span>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-accent"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="p-3 space-y-0.5">
                                {mobileNavItems.map(item => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                            isActive(item.path)
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className="w-[18px] h-[18px]" />
                                        {item.label}
                                    </Link>
                                ))}
                                <button
                                    onClick={() => { logout(); navigate("/login"); setMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 w-full mt-2"
                                >
                                    <LogOut className="w-[18px] h-[18px]" />
                                    Log out
                                </button>
                            </nav>
                        </div>
                    </div>
                )}

                <div className="hidden lg:block">
                    <Header title={title} subtitle={subtitle} />
                </div>
                <main className="flex-1 p-4 md:p-6 overflow-auto bg-background">
                    <div className="page-enter">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
