import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Deadline {
  id: string;
  title: string;
  subject: string;
  date: string;
  type: "quiz" | "assignment" | "project" | "exam";
  completed: boolean;
}

const upcomingDeadlines: Deadline[] = [
  {
    id: "1",
    title: "Quiz 3: Linked Lists",
    subject: "Data Structures",
    date: "Jan 6",
    type: "quiz",
    completed: false,
  },
  {
    id: "2",
    title: "Process Scheduling",
    subject: "Operating Systems",
    date: "Jan 8",
    type: "assignment",
    completed: false,
  },
  {
    id: "3",
    title: "ER Diagram Project",
    subject: "DBMS",
    date: "Jan 12",
    type: "project",
    completed: false,
  },
  {
    id: "4",
    title: "Socket Programming",
    subject: "Networks",
    date: "Jan 15",
    type: "assignment",
    completed: true,
  },
];

const typeStyles = {
  quiz: "text-subject-blue",
  assignment: "text-subject-green",
  project: "text-subject-purple",
  exam: "text-destructive",
};

export function UpcomingDeadlines() {
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Upcoming This Week</h3>
      </div>
      <div className="divide-y divide-border">
        {upcomingDeadlines.map((deadline) => (
          <div
            key={deadline.id}
            className={cn(
              "flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors cursor-pointer",
              deadline.completed && "opacity-60"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                deadline.completed
                  ? "bg-success border-success"
                  : "border-muted-foreground"
              )}
            >
              {deadline.completed && (
                <Check className="w-3 h-3 text-success-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium text-foreground",
                  deadline.completed && "line-through"
                )}
              >
                {deadline.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {deadline.subject}
              </p>
            </div>
            <div className="text-right">
              <p className={cn("text-sm font-medium", typeStyles[deadline.type])}>
                {deadline.date}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {deadline.type}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
