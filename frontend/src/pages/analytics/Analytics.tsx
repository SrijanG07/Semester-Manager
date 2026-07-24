import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Zap, BookOpen } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Analytics: React.FC = () => {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [studyStats, setStudyStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subjectsRes, studyRes] = await Promise.all([
                api.get('/subjects').catch(() => ({ data: [] })),
                api.get('/study-sessions/stats?period=month').catch(() => ({ data: { subjectDistribution: [] } })),
            ]);

            setSubjects(subjectsRes.data);
            setStudyStats(studyRes.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load analytics');
            setLoading(false);
        }
    };

    const COLORS = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

    if (loading) {
        return (
            <DashboardLayout title="Analytics" subtitle="Track your academic progress">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
                        ))}
                    </div>
                    <div className="h-72 bg-muted rounded-xl animate-pulse" />
                </div>
            </DashboardLayout>
        );
    }

    const studyData = studyStats?.subjectDistribution?.map((item: any, index: number) => ({
        name: item.subjectName,
        hours: (item.totalMinutes / 60).toFixed(1),
        sessions: item.sessionCount,
        fill: item.subjectColor || COLORS[index % COLORS.length],
    })) || [];

    const pieData = studyStats?.subjectDistribution?.map((item: any, index: number) => ({
        name: item.subjectName,
        value: item.totalMinutes,
        color: item.subjectColor || COLORS[index % COLORS.length],
    })) || [];

    const totalMinutes = pieData.reduce((sum: number, item: any) => sum + item.value, 0);

    return (
        <DashboardLayout title="Analytics" subtitle="Track your academic progress">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="shadow-none border border-border border-l-[3px] border-l-primary">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-primary/8">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Total Study Time</p>
                            <p className="text-2xl font-semibold">{studyStats?.totalHours || 0}h</p>
                            <p className="text-[11px] text-muted-foreground">This month</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-none border border-border border-l-[3px] border-l-success">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-success/8">
                            <Zap className="w-5 h-5 text-success" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Study Sessions</p>
                            <p className="text-2xl font-semibold">{studyStats?.sessionCount || 0}</p>
                            <p className="text-[11px] text-muted-foreground">Completed</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-none border border-border border-l-[3px] border-l-violet-500">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-violet-100">
                            <BookOpen className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Subjects Tracked</p>
                            <p className="text-2xl font-semibold">{subjects.length}</p>
                            <p className="text-[11px] text-muted-foreground">Active</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Study Time Distribution */}
            {studyData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <Card className="shadow-none border border-border">
                        <CardContent className="p-6">
                            <h2 className="font-semibold text-foreground mb-4">Study Time Distribution</h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={studyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                            label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 } }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                            }}
                                        />
                                        <Bar dataKey="hours" fill="hsl(262, 80%, 55%)" radius={[4, 4, 0, 0]} name="Study Hours" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border border-border">
                        <CardContent className="p-6">
                            <h2 className="font-semibold text-foreground mb-4">Subject-wise Time Split</h2>
                            <div className="h-48 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {pieData.map((entry: any, index: number) => (
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl font-semibold text-foreground">
                                        {totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(0)}h` : `${totalMinutes}m`}
                                    </span>
                                    <span className="text-xs text-muted-foreground">total</span>
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                                {pieData.map((entry: any, index: number) => (
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
                </div>
            )}

            {/* Subject List */}
            {subjects.length > 0 && (
                <Card className="shadow-none border border-border">
                    <CardContent className="p-6">
                        <h2 className="font-semibold text-foreground mb-4">Your Subjects</h2>
                        <div className="space-y-2">
                            {subjects.map((subject) => (
                                <div key={subject._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: subject.color }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{subject.name}</p>
                                            <p className="text-xs text-muted-foreground">{subject.code || 'No code'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">{subject.credits || 0} credits</p>
                                        {subject.instructor && (
                                            <p className="text-[11px] text-muted-foreground">{subject.instructor}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {studyData.length === 0 && (
                <Card className="shadow-none border border-border">
                    <CardContent className="text-center py-16">
                        <p className="text-sm text-muted-foreground">No analytics data yet. Start studying to see your progress!</p>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default Analytics;
