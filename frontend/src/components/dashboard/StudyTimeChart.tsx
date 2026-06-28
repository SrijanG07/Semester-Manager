import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import api from "../../utils/api";

interface DayData {
  day: string;
  hours: number;
}

export function StudyTimeChart() {
  const [data, setData] = useState<DayData[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudyData = async () => {
      try {
        const response = await api.get('/study-sessions/stats?period=week');
        const { dailyStats, totalHours: total } = response.data;

        // Build last 7 days with real data
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData: DayData[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0];
          const dayName = dayNames[date.getDay()];
          const minutes = dailyStats?.[dateKey] || 0;

          chartData.push({
            day: dayName,
            hours: parseFloat((minutes / 60).toFixed(1)),
          });
        }

        setData(chartData);
        setTotalHours(parseFloat(total || '0'));
      } catch (error) {
        console.error('Failed to fetch study stats:', error);
        // Fallback to empty week
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();
        const chartData: DayData[] = [];
        for (let i = 6; i >= 0; i--) {
          const idx = (today - i + 7) % 7;
          chartData.push({ day: dayNames[idx], hours: 0 });
        }
        setData(chartData);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Study Hours This Week</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Hours This Week</CardTitle>
        <CardDescription>Total: {totalHours.toFixed(1)} hours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number | undefined) => [`${value ?? 0} hours`, "Study Time"]}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHours)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {totalHours === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Start tracking study sessions to see your progress
          </p>
        )}
      </CardContent>
    </Card>
  );
}
