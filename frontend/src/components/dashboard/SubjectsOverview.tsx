import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "../../utils/api";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface Subject {
  _id: string;
  name: string;
  code: string;
  color: string;
  credits: number;
  instructor?: string;
}

interface SubjectWithScore extends Subject {
  score: number;
  scoreEntered: number;
}

export function SubjectsOverview() {
  const [subjects, setSubjects] = useState<SubjectWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await api.get('/subjects');
        const rawSubjects: Subject[] = response.data.slice(0, 4); // Show only first 4

        // Fetch scores for each subject
        const withScores = await Promise.all(
          rawSubjects.map(async (subject) => {
            try {
              const scoreRes = await api.get(`/subjects/${subject._id}/calculate`);
              return {
                ...subject,
                score: scoreRes.data?.currentScore || 0,
                scoreEntered: scoreRes.data?.totalWeightEntered || 0,
              };
            } catch {
              return { ...subject, score: 0, scoreEntered: 0 };
            }
          })
        );

        setSubjects(withScores);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Subject Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subjects.length === 0) {
    return (
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Subject Overview</CardTitle>
            <Link to="/subjects">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Subject
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">
              Start by adding your first subject
            </p>
            <Link to="/subjects">
              <Button size="sm">Add Your First Subject</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Subject Overview</CardTitle>
          <Link to="/subjects">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
              View all →
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {subjects.map((subject) => (
            <Link key={subject._id} to={`/subjects/${subject._id}`} className="block group">
              <div className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-lg transition-colors group-hover:bg-accent/50">
                <div
                  className="w-1.5 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color || '#7c3aed' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium truncate text-foreground">{subject.name}</p>
                    <span className="text-xs font-medium text-muted-foreground ml-2">
                      {subject.score > 0 ? `${subject.score.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <Progress value={subject.score} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {subject.code} • {subject.credits} credits
                    {subject.scoreEntered > 0 && ` • ${subject.scoreEntered}% graded`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
