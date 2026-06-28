import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { StudyTimeChart } from "@/components/dashboard/StudyTimeChart";
import { SubjectDistributionChart } from "@/components/dashboard/SubjectDistributionChart";
import { SubjectsOverview } from "@/components/dashboard/SubjectsOverview";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { BookOpen, Clock, Target, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../utils/api";

const Dashboard = () => {
    const [stats, setStats] = useState({
        subjectsCount: 0,
        studyHours: '0',
        deadlinesCount: 0,
        avgScore: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [subjectsRes, deadlinesRes, studyRes] = await Promise.all([
                    api.get('/subjects'),
                    api.get('/deadlines'),
                    api.get('/study-sessions/stats?period=week').catch(() => ({ data: { totalHours: '0' } })),
                ]);

                const subjects = subjectsRes.data;

                // Calculate average score across all subjects
                let totalScore = 0;
                let scoredCount = 0;

                const scoreResults = await Promise.allSettled(
                    subjects.map((s: any) => api.get(`/subjects/${s._id}/calculate`))
                );

                scoreResults.forEach((result) => {
                    if (result.status === 'fulfilled' && result.value.data?.currentScore > 0) {
                        totalScore += result.value.data.currentScore;
                        scoredCount++;
                    }
                });

                const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

                setStats({
                    subjectsCount: subjects.length,
                    studyHours: parseFloat(studyRes.data.totalHours || '0').toFixed(1),
                    deadlinesCount: deadlinesRes.data.filter((d: any) => !d.completed).length,
                    avgScore,
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <DashboardLayout>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Active Subjects"
                    value={stats.subjectsCount}
                    icon={BookOpen}
                    variant="primary"
                />
                <StatCard
                    title="Average Score"
                    value={stats.avgScore > 0 ? `${stats.avgScore}%` : "N/A"}
                    subtitle={stats.avgScore > 0 ? "Across all subjects" : "Add scores to see"}
                    icon={Target}
                    variant="success"
                />
                <StatCard
                    title="Study Hours"
                    value={`${stats.studyHours}h`}
                    subtitle="This week"
                    icon={Clock}
                />
                <StatCard
                    title="Upcoming Deadlines"
                    value={stats.deadlinesCount}
                    icon={Calendar}
                    variant="warning"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 space-y-6">
                    <StudyTimeChart />
                    <SubjectsOverview />
                </div>
                <div className="lg:col-span-1">
                    <div className="grid gap-6">
                        <SubjectDistributionChart />
                        <AlertsPanel />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
