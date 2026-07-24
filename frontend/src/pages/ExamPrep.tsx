import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Brain, Calendar, BookOpen, Play, CheckCircle2, Clock, Sparkles, AlertCircle } from "lucide-react";

interface Subject {
    _id: string;
    name: string;
    color: string;
}

interface Topic {
    _id: string;
    name: string;
    status: string;
}

const ExamPrep = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [examDate, setExamDate] = useState('');
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [plan, setPlan] = useState<any>(null);

    useEffect(() => {
        api.get('/subjects').then(res => {
            setSubjects(res.data);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            api.get(`/subjects/${selectedSubject}/topics`)
                .then(res => setTopics(res.data))
                .catch(console.error);
        }
    }, [selectedSubject]);

    const generatePlan = () => {
        if (!selectedSubject || !examDate) {
            toast.error('Select a subject and exam date');
            return;
        }

        setGenerating(true);

        // Generate a client-side plan based on topics
        const daysUntilExam = Math.max(1, Math.ceil(
            (new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ));

        const weakTopics = topics.filter(t => t.status === 'not-started' || t.status === 'learning');
        const moderateTopics = topics.filter(t => t.status === 'needs-practice');
        const strongTopics = topics.filter(t => t.status === 'confident');

        // Distribute topics across days, prioritizing weak ones
        const allTopics = [...weakTopics, ...weakTopics, ...moderateTopics, ...strongTopics]; // weak topics appear twice
        const topicsPerDay = Math.max(1, Math.ceil(allTopics.length / daysUntilExam));

        const days: any[] = [];
        let topicIndex = 0;

        for (let i = 0; i < daysUntilExam && topicIndex < allTopics.length; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dayTopics = allTopics.slice(topicIndex, topicIndex + topicsPerDay);
            topicIndex += topicsPerDay;

            days.push({
                date: date.toISOString().split('T')[0],
                dayLabel: `Day ${i + 1}`,
                topics: dayTopics.map(t => ({
                    id: t._id,
                    name: t.name,
                    status: t.status,
                    completed: false,
                })),
            });
        }

        setPlan({
            subjectName: subjects.find(s => s._id === selectedSubject)?.name,
            examDate,
            daysUntilExam,
            weakCount: weakTopics.length,
            totalTopics: topics.length,
            days,
        });

        setGenerating(false);
        toast.success('Revision plan generated!');
    };

    const toggleTask = (dayIndex: number, topicIndex: number) => {
        if (!plan) return;
        const updated = { ...plan };
        updated.days[dayIndex].topics[topicIndex].completed =
            !updated.days[dayIndex].topics[topicIndex].completed;
        setPlan(updated);
    };

    const completedCount = plan?.days.reduce(
        (sum: number, day: any) => sum + day.topics.filter((t: any) => t.completed).length, 0
    ) || 0;
    const totalTasks = plan?.days.reduce(
        (sum: number, day: any) => sum + day.topics.length, 0
    ) || 0;
    const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

    if (loading) {
        return (
            <DashboardLayout title="Exam Prep" subtitle="AI-powered revision coach">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Exam Prep" subtitle="AI-powered revision coach">
            <div className="space-y-6">
                {/* Setup */}
                {!plan && (
                    <div className="card max-w-xl mx-auto animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Exam Prep Coach</h2>
                                <p className="text-sm text-muted-foreground">Generate a personalized revision plan</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">Subject</label>
                                <select
                                    value={selectedSubject}
                                    onChange={e => setSelectedSubject(e.target.value)}
                                    className="input"
                                >
                                    <option value="">Select a subject</option>
                                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">Exam Date</label>
                                <input
                                    type="date"
                                    value={examDate}
                                    onChange={e => setExamDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="input"
                                />
                            </div>

                            {selectedSubject && topics.length > 0 && (
                                <div className="p-3 rounded-lg bg-accent/50">
                                    <p className="text-sm font-medium mb-2">Topic Overview</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-400" />
                                            <span>{topics.filter(t => t.status === 'not-started').length} Not Started</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                            <span>{topics.filter(t => t.status === 'learning').length} Learning</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-400" />
                                            <span>{topics.filter(t => t.status === 'needs-practice').length} Needs Practice</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400" />
                                            <span>{topics.filter(t => t.status === 'confident').length} Confident</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedSubject && topics.length === 0 && (
                                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-warning" />
                                    <p className="text-sm text-warning">Add topics to this subject first for a better plan</p>
                                </div>
                            )}

                            <button
                                onClick={generatePlan}
                                disabled={generating || !selectedSubject || !examDate}
                                className="btn btn-primary w-full gap-2"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generate Revision Plan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Generated Plan */}
                {plan && (
                    <div className="space-y-4 animate-fade-in-up">
                        {/* Plan header */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">{plan.subjectName} — Revision Plan</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {plan.daysUntilExam} days until exam • {plan.weakCount} weak topics prioritized
                                    </p>
                                </div>
                                <button onClick={() => setPlan(null)} className="btn btn-secondary text-xs">
                                    New Plan
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-semibold text-primary">{completedCount}/{totalTasks} tasks</span>
                                </div>
                                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Day-by-day plan */}
                        <div className="space-y-3">
                            {plan.days.map((day: any, dayIndex: number) => {
                                const dayCompleted = day.topics.every((t: any) => t.completed);
                                return (
                                    <div key={dayIndex} className={`card ${dayCompleted ? 'border-green-500/30 bg-green-500/5' : ''}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                                dayCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-primary/10 text-primary'
                                            }`}>
                                                {dayCompleted ? <CheckCircle2 className="w-4 h-4" /> : dayIndex + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{day.dayLabel}</p>
                                                <p className="text-xs text-muted-foreground">{day.date}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 ml-11">
                                            {day.topics.map((topic: any, topicIndex: number) => (
                                                <button
                                                    key={`${dayIndex}-${topicIndex}`}
                                                    onClick={() => toggleTask(dayIndex, topicIndex)}
                                                    className={`flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors text-sm ${
                                                        topic.completed
                                                            ? 'bg-green-500/10 line-through text-muted-foreground'
                                                            : 'hover:bg-accent'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                        topic.completed ? 'bg-green-500 border-green-500' : 'border-border'
                                                    }`}>
                                                        {topic.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span>{topic.name}</span>
                                                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                                                        topic.status === 'not-started' ? 'bg-red-500/10 text-red-500' :
                                                        topic.status === 'learning' ? 'bg-yellow-500/10 text-yellow-500' :
                                                        topic.status === 'needs-practice' ? 'bg-orange-500/10 text-orange-500' :
                                                        'bg-green-500/10 text-green-500'
                                                    }`}>
                                                        {topic.status.replace('-', ' ')}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!plan && subjects.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No subjects yet</p>
                        <p className="text-sm">Create subjects with topics to generate revision plans</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ExamPrep;
