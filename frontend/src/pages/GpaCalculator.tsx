import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Calculator, TrendingUp, Award, Sliders, BookOpen } from "lucide-react";

interface SubjectGpa {
    subjectId: string;
    name: string;
    color: string;
    credits: number;
    percentage: number | null;
    grade: string | null;
    points: number | null;
    hasData: boolean;
}

const GpaCalculator = () => {
    const [gpaData, setGpaData] = useState<{
        gpa: number | null;
        scale: string;
        totalCredits: number;
        subjects: SubjectGpa[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [simMode, setSimMode] = useState(false);
    const [simOverrides, setSimOverrides] = useState<Record<string, number>>({});
    const [simResult, setSimResult] = useState<number | null>(null);

    useEffect(() => {
        fetchGpa();
    }, []);

    const fetchGpa = async () => {
        try {
            const { data } = await api.get('/gpa/calculate');
            setGpaData(data);
        } catch {
            toast.error('Failed to load GPA data');
        } finally {
            setLoading(false);
        }
    };

    const runSimulation = async () => {
        try {
            // For now, just show a message — full simulation needs component-level overrides
            toast.success('What-If simulator: Adjust scores above to see projected GPA');
        } catch {
            toast.error('Simulation failed');
        }
    };

    const getGpaColor = (gpa: number, scale: string) => {
        const normalized = scale === '4.0' ? gpa / 4 : scale === '10.0' ? gpa / 10 : gpa / 100;
        if (normalized >= 0.8) return 'text-green-500';
        if (normalized >= 0.6) return 'text-yellow-500';
        if (normalized >= 0.4) return 'text-orange-500';
        return 'text-red-500';
    };

    const getGpaProgress = (gpa: number, scale: string) => {
        if (scale === '4.0') return (gpa / 4) * 100;
        if (scale === '10.0') return (gpa / 10) * 100;
        return gpa;
    };

    if (loading) {
        return (
            <DashboardLayout title="GPA Calculator" subtitle="Track your academic performance">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="GPA Calculator" subtitle="Track your academic performance">
            <div className="space-y-6">
                {/* GPA Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
                    {/* Main GPA card */}
                    <div className="card md:col-span-1 flex flex-col items-center justify-center py-8">
                        <div className="relative w-36 h-36 mb-4">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                                <circle
                                    cx="50" cy="50" r="42"
                                    fill="none"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(gpaData?.gpa ? getGpaProgress(gpaData.gpa, gpaData.scale) : 0) * 2.64} 264`}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-3xl font-bold ${gpaData?.gpa ? getGpaColor(gpaData.gpa, gpaData.scale) : 'text-muted-foreground'}`}>
                                    {gpaData?.gpa?.toFixed(2) ?? 'N/A'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    / {gpaData?.scale === 'percentage' ? '100%' : gpaData?.scale}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Semester GPA</h3>
                        <p className="text-sm text-muted-foreground">
                            {gpaData?.totalCredits || 0} total credits
                        </p>
                    </div>

                    {/* Stats cards */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div className="card flex items-center gap-4">
                            <div className="stat-icon-badge stat-icon-badge-primary">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{gpaData?.subjects.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Subjects</p>
                            </div>
                        </div>
                        <div className="card flex items-center gap-4">
                            <div className="stat-icon-badge stat-icon-badge-success">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {gpaData?.subjects.filter(s => s.hasData).length || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Graded</p>
                            </div>
                        </div>
                        <div className="card flex items-center gap-4">
                            <div className="stat-icon-badge stat-icon-badge-warning">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {gpaData?.subjects
                                        .filter(s => s.percentage !== null)
                                        .reduce((max, s) => Math.max(max, s.percentage || 0), 0)
                                        .toFixed(0) || 0}%
                                </p>
                                <p className="text-sm text-muted-foreground">Highest Score</p>
                            </div>
                        </div>
                        <div className="card flex items-center gap-4">
                            <div className="stat-icon-badge stat-icon-badge-info">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{gpaData?.totalCredits || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Credits</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject Breakdown */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Subject Breakdown</h3>
                        <button
                            onClick={() => setSimMode(!simMode)}
                            className={`btn text-xs gap-1.5 ${simMode ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            {simMode ? 'Exit Simulator' : 'What-If Simulator'}
                        </button>
                    </div>

                    {simMode && (
                        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-sm text-primary font-medium">
                                🧪 What-If Mode — Scores shown are your current actual scores.
                                Add grades to subjects to see GPA changes.
                            </p>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground border-b border-border">
                                    <th className="pb-3 font-medium">Subject</th>
                                    <th className="pb-3 font-medium text-center">Credits</th>
                                    <th className="pb-3 font-medium text-center">Score</th>
                                    <th className="pb-3 font-medium text-center">Grade</th>
                                    <th className="pb-3 font-medium text-center">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gpaData?.subjects.map(subject => (
                                    <tr key={subject.subjectId} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: subject.color }}
                                                />
                                                <span className="font-medium text-foreground">{subject.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">{subject.credits || '—'}</td>
                                        <td className="py-3 text-center">
                                            {subject.percentage !== null ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all duration-500"
                                                            style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium">{subject.percentage.toFixed(1)}%</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-center">
                                            {subject.grade ? (
                                                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary">
                                                    {subject.grade}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="py-3 text-center font-medium">
                                            {subject.points !== null ? subject.points.toFixed(1) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {(!gpaData?.subjects.length) && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No subjects yet</p>
                            <p className="text-sm">Add subjects and grades to calculate your GPA</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GpaCalculator;
