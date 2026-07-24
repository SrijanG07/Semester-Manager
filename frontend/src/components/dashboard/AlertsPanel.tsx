import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../utils/api";
import { Calendar, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AlertsPanel() {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const response = await api.get('/deadlines');
        // Get upcoming deadlines (not completed, sorted by date)
        const upcoming = response.data
          .filter((d: any) => !d.completed)
          .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 5);
        setDeadlines(upcoming);
      } catch (error) {
        console.error('Failed to fetch deadlines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlines();
  }, []);

  const getDueBadge = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", className: "bg-destructive/10 text-destructive" };
    if (diffDays === 0) return { text: "Due today", className: "bg-destructive/10 text-destructive" };
    if (diffDays === 1) return { text: "Due tomorrow", className: "bg-warning/10 text-warning" };
    if (diffDays <= 3) return { text: `Due in ${diffDays}d`, className: "bg-warning/10 text-warning" };
    return { text: `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, className: "bg-muted text-muted-foreground" };
  };

  const getTypeIcon = (type: string) => {
    if (type === 'Quiz') return Calendar;
    if (type === 'Assignment') return FileText;
    return AlertCircle;
  };

  if (loading) {
    return (
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" asChild>
            <Link to="/deadlines">View all →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No upcoming deadlines
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {deadlines.map((deadline) => {
              const badge = getDueBadge(deadline.dueDate);
              const TypeIcon = getTypeIcon(deadline.type);

              return (
                <div
                  key={deadline._id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="p-1.5 rounded-md bg-muted">
                    <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{deadline.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {deadline.subjectId?.name || deadline.type}
                    </p>
                  </div>
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap", badge.className)}>
                    {badge.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
