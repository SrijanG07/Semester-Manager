import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Home, BookOpen, Clock, Calendar, BarChart3, Calculator, CalendarDays,
    Brain, StickyNote, Trophy, Settings, Search, Timer, Plus
} from "lucide-react";

const allCommands = [
    { icon: Home, label: "Dashboard", path: "/dashboard", keywords: "home overview" },
    { icon: BookOpen, label: "Subjects", path: "/subjects", keywords: "courses classes" },
    { icon: Calculator, label: "GPA Calculator", path: "/gpa", keywords: "grades points" },
    { icon: CalendarDays, label: "Timetable", path: "/timetable", keywords: "schedule classes weekly" },
    { icon: Clock, label: "Study Tracker", path: "/study", keywords: "timer sessions" },
    { icon: Calendar, label: "Deadlines", path: "/deadlines", keywords: "due assignments" },
    { icon: BarChart3, label: "Analytics", path: "/analytics", keywords: "stats charts" },
    { icon: Brain, label: "Exam Prep", path: "/exam-prep", keywords: "revision ai coach" },
    { icon: StickyNote, label: "Notes", path: "/notes", keywords: "notebook write" },
    { icon: Trophy, label: "Achievements", path: "/achievements", keywords: "badges streaks" },
    { icon: Settings, label: "Settings", path: "/settings", keywords: "preferences theme" },
];

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    const filtered = allCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords.includes(query.toLowerCase())
    );

    const handleSelect = useCallback((path: string) => {
        navigate(path);
        setOpen(false);
        setQuery("");
    }, [navigate]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setOpen(false);
                setQuery("");
            }
        };

        const handleCustomOpen = () => setOpen(true);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('open-command-palette', handleCustomOpen);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-command-palette', handleCustomOpen);
        };
    }, []);

    if (!open) return null;

    return (
        <>
            <div className="cmdk-overlay" onClick={() => { setOpen(false); setQuery(""); }} />
            <div className="cmdk-dialog">
                <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Search input */}
                    <div className="flex items-center gap-3 px-4 border-b border-border">
                        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search pages, actions..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                        />
                        <kbd className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">ESC</kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto py-2 px-2">
                        {filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
                        ) : (
                            <>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                                    Navigation
                                </p>
                                {filtered.map(cmd => (
                                    <button
                                        key={cmd.path}
                                        onClick={() => handleSelect(cmd.path)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
                                    >
                                        <cmd.icon className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{cmd.label}</span>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/30">
                        <span className="text-[11px] text-muted-foreground">Navigate to pages</span>
                        <div className="flex items-center gap-1">
                            <kbd className="text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">↑↓</kbd>
                            <span className="text-[10px] text-muted-foreground">navigate</span>
                            <kbd className="text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border ml-2">↵</kbd>
                            <span className="text-[10px] text-muted-foreground">select</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
