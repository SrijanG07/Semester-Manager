import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "../../utils/api";

const COLORS = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

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

  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  if (loading) {
    return (
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Time by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Time by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-56">
            <p className="text-sm text-muted-foreground">
              Add subjects to see distribution
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Time by Subject</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
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
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-semibold text-foreground">
              {total >= 60 ? `${(total / 60).toFixed(0)}h` : `${total}m`}
            </span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>
        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
