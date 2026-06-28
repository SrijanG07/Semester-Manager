import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "../../utils/api";

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];

interface ChartEntry {
  [key: string]: string | number;
  name: string;
  value: number;
  color: string;
}

export function SubjectDistributionChart() {
  const [data, setData] = useState<ChartEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/study-sessions/stats?period=week');
        const distribution = response.data.subjectDistribution || [];

        if (distribution.length > 0) {
          const chartData = distribution.map((item: any, index: number) => ({
            name: item.subjectName,
            value: item.totalMinutes,
            color: item.subjectColor || COLORS[index % COLORS.length],
          }));
          setData(chartData);
        } else {
          // Fallback: show subjects by credits if no study sessions yet
          const subjectsRes = await api.get('/subjects');
          const subjects = subjectsRes.data;
          if (subjects.length > 0) {
            const chartData = subjects.map((subject: any, index: number) => ({
              name: subject.name,
              value: subject.credits || 3,
              color: subject.color || COLORS[index % COLORS.length],
            }));
            setData(chartData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch distribution:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time by Subject</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time by Subject</CardTitle>
          <CardDescription>This week's distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">
              Add subjects to see distribution
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time by Subject</CardTitle>
        <CardDescription>This week's distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined) => {
                  const hours = ((value ?? 0) / 60).toFixed(1);
                  return [`${hours}h`, "Study Time"];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
