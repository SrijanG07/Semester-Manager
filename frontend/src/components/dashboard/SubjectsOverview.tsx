import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function SubjectsOverview() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await api.get('/subjects');
        setSubjects(response.data.slice(0, 4)); // Show only first 4
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
      <Card>
        <CardHeader>
          <CardTitle>Subject Overview</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subject Overview</CardTitle>
              <CardDescription>No subjects yet</CardDescription>
            </div>
            <Link to="/subjects">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding your first subject
            </p>
            <Link to="/subjects">
              <Button>Add Your First Subject</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subject Overview</CardTitle>
            <CardDescription>{subjects.length} subjects enrolled</CardDescription>
          </div>
          <Link to="/subjects">
            <Button variant="ghost" size="sm">View all →</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject._id} className="flex items-center gap-4">
              <div
                className="w-2 h-12 rounded-full"
                style={{ backgroundColor: subject.color || '#3b82f6' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm truncate">{subject.name}</p>
                  <span className="text-xs text-muted-foreground">0%</span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {subject.code} • {subject.credits} credits
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
