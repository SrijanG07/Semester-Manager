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

export function StudyTimeChart() {
  const [data, setData] = useState([
    { day: "Mon", hours: 0 },
    { day: "Tue", hours: 0 },
    { day: "Wed", hours: 0 },
    { day: "Thu", hours: 0 },
    { day: "Fri", hours: 0 },
    { day: "Sat", hours: 0 },
    { day: "Sun", hours: 0 },
  ]);
  const [totalHours, setTotalHours] = useState(0);

  // TODO: Fetch real study session data from backend
  useEffect(() => {
    // This will be connected to your study sessions API
    const total = data.reduce((sum, day) => sum + day.hours, 0);
    setTotalHours(total);
  }, [data]);

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
