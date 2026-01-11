import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../utils/api";
import { AlertCircle, Calendar, FileText } from "lucide-react";

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
          .slice(0, 4); // Show top 4
        setDeadlines(upcoming);
      } catch (error) {
        console.error('Failed to fetch deadlines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlines();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'destructive';
      case 'urgent': return 'destructive';
      case 'soon': return 'default';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts & Notifications</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alerts & Notifications</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/deadlines">View all →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              You're all caught up! No upcoming deadlines.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deadlines.map((deadline) => (
              <div key={deadline._id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="mt-0.5">
                  {deadline.type === 'Quiz' && <Calendar className="w-4 h-4 text-muted-foreground" />}
                  {deadline.type === 'Assignment' && <FileText className="w-4 h-4 text-muted-foreground" />}
                  {!['Quiz', 'Assignment'].includes(deadline.type) && <AlertCircle className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deadline.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(deadline.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={getPriorityColor(deadline.priority)} className="text-xs">
                  {deadline.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
