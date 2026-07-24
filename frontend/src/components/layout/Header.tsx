import { Bell, Search, Sun, Moon, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    const { user, logout } = useAuth();
    const { resolvedTheme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    const openCommandPalette = () => {
        // Dispatch custom event that CommandPalette listens for
        window.dispatchEvent(new CustomEvent('open-command-palette'));
    };

    return (
        <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border flex-shrink-0">
            <div>
                {title ? (
                    <>
                        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground">{subtitle}</p>
                        )}
                    </>
                ) : (
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">
                            {greeting()}, {user?.name?.split(" ")[0] || "there"} 👋
                        </h1>
                        <p className="text-sm text-muted-foreground">Here's your academic overview</p>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Command Palette trigger */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={openCommandPalette}
                    className="hidden md:flex items-center gap-2 h-9 px-3 text-muted-foreground hover:text-foreground bg-secondary/50 rounded-lg border border-border"
                >
                    <Search className="w-4 h-4" />
                    <span className="text-xs">Search...</span>
                    <kbd className="ml-4 text-[10px] font-medium bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
                </Button>

                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-9 w-9 rounded-lg"
                    title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {resolvedTheme === 'dark' ? (
                        <Sun className="w-[18px] h-[18px] text-muted-foreground hover:text-yellow-500 transition-colors" />
                    ) : (
                        <Moon className="w-[18px] h-[18px] text-muted-foreground hover:text-primary transition-colors" />
                    )}
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
                    <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                    <span className="notification-dot" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 rounded-lg">
                            <Avatar className="w-7 h-7">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {user ? getInitials(user.name) : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden md:block text-sm font-medium text-foreground">
                                {user?.name || "User"}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            {user?.email}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => navigate('/settings')}>
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive text-sm cursor-pointer" onClick={handleLogout}>
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
