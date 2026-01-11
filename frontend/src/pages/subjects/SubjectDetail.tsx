import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import PerformanceTab from '@/components/subjects/PerformanceTab';
import ResourcesTab from '@/components/subjects/ResourcesTab';
import TopicsTab from '@/components/subjects/TopicsTab';
import DeadlinesTab from '@/components/subjects/DeadlinesTab';
import AttendanceTab from '@/components/subjects/AttendanceTab';

interface Subject {
    _id: string;
    name: string;
    code: string;
    credits: number;
    color: string;
    instructor?: string;
}

interface Stats {
    currentScore: number;
    totalWeightEntered: number;
    attendance: {
        percentage: number;
        present: number;
        absent: number;
        late: number;
        total: number;
    };
    studyTime: number;
    resourceCount: number;
    completedResources: number;
}

const SubjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [subject, setSubject] = useState<Subject | null>(null);
    const [stats, setStats] = useState<Stats>({
        currentScore: 0,
        totalWeightEntered: 0,
        attendance: { percentage: 0, present: 0, absent: 0, late: 0, total: 0 },
        studyTime: 0,
        resourceCount: 0,
        completedResources: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('performance');

    const fetchSubject = useCallback(async () => {
        if (!id) return;
        try {
            const response = await api.get(`/subjects/${id}`);
            setSubject(response.data);
        } catch (error) {
            toast.error('Failed to load subject');
            navigate('/subjects');
        }
    }, [id, navigate]);

    const fetchStats = useCallback(async () => {
        if (!id) return;
        try {
            const [scoreRes, attendanceRes, resourcesRes] = await Promise.allSettled([
                api.get(`/subjects/${id}/calculate`),
                api.get(`/subjects/${id}/attendance/stats`),
                api.get(`/subjects/${id}/resources`),
            ]);

            const score = scoreRes.status === 'fulfilled' ? scoreRes.value.data : null;
            const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data : null;
            const resources = resourcesRes.status === 'fulfilled' ? resourcesRes.value.data : [];

            setStats({
                currentScore: score?.currentScore || 0,
                totalWeightEntered: score?.totalWeightEntered || 0,
                attendance: {
                    percentage: attendance?.percentage || 0,
                    present: attendance?.present || 0,
                    absent: attendance?.absent || 0,
                    late: attendance?.late || 0,
                    total: attendance?.total || 0,
                },
                studyTime: 0, // Could be fetched from study sessions if implemented
                resourceCount: resources.length || 0,
                completedResources: resources.filter((r: any) => r.completed).length || 0,
            });
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    }, [id]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchSubject(), fetchStats()]);
            setLoading(false);
        };
        loadData();
    }, [fetchSubject, fetchStats]);

    const refreshStats = () => {
        fetchStats();
    };

    if (loading) {
        return (
            <DashboardLayout title="Loading..." subtitle="">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading subject...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!subject) {
        return null;
    }

    const getAttendanceStatus = (percentage: number) => {
        if (percentage >= 75) return { text: 'Above 75% threshold', color: 'text-green-600' };
        if (percentage >= 60) return { text: 'Below 75% threshold', color: 'text-orange-500' };
        return { text: 'Critical - Below 60%', color: 'text-red-500' };
    };

    const attendanceStatus = getAttendanceStatus(stats.attendance.percentage);

    return (
        <DashboardLayout
            title={subject.name}
            subtitle={`${subject.code}${subject.instructor ? ` • ${subject.instructor}` : ''}`}
        >
            {/* Back Button */}
            <Button
                variant="ghost"
                className="mb-6 -ml-2"
                onClick={() => navigate('/subjects')}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subjects
            </Button>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-600 font-medium mb-1">Current Score</p>
                        <p className="text-3xl font-bold">{stats.currentScore.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">
                            out of {stats.totalWeightEntered}% entered
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Attendance</p>
                        <p className="text-3xl font-bold">{stats.attendance.percentage.toFixed(0)}%</p>
                        <p className={`text-xs ${attendanceStatus.color}`}>
                            {attendanceStatus.text}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Study Time</p>
                        <p className="text-3xl font-bold">{stats.studyTime.toFixed(1)}h</p>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Resources</p>
                        <p className="text-3xl font-bold">{stats.resourceCount}</p>
                        <p className="text-xs text-muted-foreground">
                            {stats.completedResources} completed
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                    <TabsTrigger value="topics">Topics</TabsTrigger>
                    <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                </TabsList>

                <TabsContent value="performance">
                    <PerformanceTab subjectId={id!} onUpdate={refreshStats} />
                </TabsContent>
                <TabsContent value="resources">
                    <ResourcesTab subjectId={id!} onUpdate={refreshStats} />
                </TabsContent>
                <TabsContent value="topics">
                    <TopicsTab subjectId={id!} />
                </TabsContent>
                <TabsContent value="deadlines">
                    <DeadlinesTab subjectId={id!} />
                </TabsContent>
                <TabsContent value="attendance">
                    <AttendanceTab
                        subjectId={id!}
                        stats={stats.attendance}
                        onUpdate={refreshStats}
                    />
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
};

export default SubjectDetail;
