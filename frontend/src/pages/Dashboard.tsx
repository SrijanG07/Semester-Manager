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
        studyHours: 0,
        deadlinesCount: 0,
        avgScore: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [subjects, deadlines] = await Promise.all([
                    api.get('/subjects'),
                    api.get('/deadlines')
                ]);

                setStats({
                    subjectsCount: subjects.data.length,
                    studyHours: 0, // Will be calculated from study sessions
                    deadlinesCount: deadlines.data.filter((d: any) => !d.completed).length,
                    avgScore: 0 // Will be calculated from scores
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
