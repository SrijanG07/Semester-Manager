import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SubjectPerformance {
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    currentScore: number;
    targetScore: number;
    improvement: number;
}

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

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-gray-600">Loading analytics...</p>
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

    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">📊 Analytics</h1>

                {/* Study Time Distribution */}
                {studyData.length > 0 && (
                    <>
                        <div className="card mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Study Time Distribution (This Month)</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={studyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="hours" fill="#3B82F6" name="Study Hours" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="card mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Subject-wise Time Split</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {/* Study Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
                        <h3 className="text-sm font-medium text-blue-700 mb-2">Total Study Time</h3>
                        <p className="text-4xl font-bold text-blue-900">{studyStats?.totalHours || 0}h</p>
                        <p className="text-sm text-blue-700 mt-2">This month</p>
                    </div>

                    <div className="card bg-gradient-to-br from-green-50 to-green-100">
                        <h3 className="text-sm font-medium text-green-700 mb-2">Study Sessions</h3>
                        <p className="text-4xl font-bold text-green-900">{studyStats?.sessionCount || 0}</p>
                        <p className="text-sm text-green-700 mt-2">Completed</p>
                    </div>

                    <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
                        <h3 className="text-sm font-medium text-purple-700 mb-2">Subjects Tracked</h3>
                        <p className="text-4xl font-bold text-purple-900">{subjects.length}</p>
                        <p className="text-sm text-purple-700 mt-2">Active</p>
                    </div>
                </div>

                {/* Subject List */}
                {subjects.length > 0 && (
                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Subjects</h2>
                        <div className="space-y-3">
                            {subjects.map((subject) => (
                                <div key={subject._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: subject.color }}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{subject.name}</p>
                                            <p className="text-sm text-gray-600">{subject.code || 'No code'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">{subject.credits || 0} credits</p>
                                        {subject.instructor && (
                                            <p className="text-xs text-gray-500">{subject.instructor}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {studyData.length === 0 && (
                    <div className="card text-center py-12">
                        <p className="text-gray-600">No analytics data yet. Start studying to see your progress!</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Analytics;
