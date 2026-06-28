import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../utils/api';
import { toast } from 'sonner';

interface StudySession {
    _id: string;
    subjectId: { _id: string; name: string; color: string };
    topicId?: { _id: string; name: string };
    startTime: string;
    endTime?: string;
    duration: number;
    date: string;
    notes?: string;
    focusLevel?: string;
}

interface StudyStats {
    totalMinutes: number;
    totalHours: string;
    sessionCount: number;
    subjectDistribution: Array<{
        subjectId: string;
        subjectName: string;
        subjectColor: string;
        totalMinutes: number;
        sessionCount: number;
    }>;
}

const StudyTracker: React.FC = () => {
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [stats, setStats] = useState<StudyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [currentSession, setCurrentSession] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');
    const [focusLevel, setFocusLevel] = useState<string>('medium');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning && currentSession) {
            interval = setInterval(() => {
                const start = new Date(currentSession.startTime).getTime();
                const now = Date.now();
                setElapsedTime(Math.floor((now - start) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, currentSession]);

    const fetchData = async () => {
        try {
            const [sessionsRes, statsRes, subjectsRes] = await Promise.all([
                api.get('/study-sessions'),
                api.get('/study-sessions/stats?period=week'),
                api.get('/subjects'),
            ]);
            setSessions(sessionsRes.data);
            setStats(statsRes.data);
            setSubjects(subjectsRes.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load study data');
            setLoading(false);
        }
    };

    const startSession = async () => {
        if (!selectedSubject) {
            toast.error('Please select a subject');
            return;
        }

        try {
            const session = {
                subjectId: selectedSubject,
                startTime: new Date().toISOString(),
                focusLevel,
            };

            setCurrentSession(session);
            setIsTimerRunning(true);
            setElapsedTime(0);
            toast.success('Study session started!');
        } catch (error) {
            toast.error('Failed to start session');
        }
    };

    const stopSession = async () => {
        if (!currentSession) return;

        try {
            const duration = Math.floor(elapsedTime / 60); // Convert to minutes

            await api.post('/study-sessions', {
                subjectId: selectedSubject,
                startTime: currentSession.startTime,
                endTime: new Date().toISOString(),
                duration,
                notes: sessionNotes,
                focusLevel,
            });

            toast.success(`Session saved! ${duration} minutes studied`);
            setIsTimerRunning(false);
            setCurrentSession(null);
            setElapsedTime(0);
            setSessionNotes('');
            fetchData();
        } catch (error) {
            toast.error('Failed to save session');
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <DashboardLayout title="Study Tracker" subtitle="Track your study sessions">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-muted-foreground">Loading study tracker...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Study Tracker" subtitle="Track your study sessions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Timer Panel */}
                <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">
                        {isTimerRunning ? '🔴 Session Active' : 'Start Study Session'}
                    </h2>

                    {!isTimerRunning ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Select Subject *
                                </label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                >
                                    <option value="">Choose a subject...</option>
                                    {subjects.map((subject) => (
                                        <option key={subject._id} value={subject._id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Focus Level
                                </label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setFocusLevel(level)}
                                            className={`flex-1 py-2 rounded-lg transition ${focusLevel === level
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                                                }`}
                                        >
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={startSession}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-lg rounded-lg transition"
                            >
                                Start Session
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="text-6xl font-bold text-primary mb-4">
                                {formatTime(elapsedTime)}
                            </div>
                            <p className="text-muted-foreground mb-6">
                                Studying: {subjects.find(s => s._id === selectedSubject)?.name}
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Session Notes (Optional)
                                </label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors"
                                    rows={3}
                                    value={sessionNotes}
                                    onChange={(e) => setSessionNotes(e.target.value)}
                                    placeholder="What did you learn?"
                                />
                            </div>

                            <button
                                onClick={stopSession}
                                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 py-3 text-lg rounded-lg transition"
                            >
                                Stop & Save Session
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Panel */}
                <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">This Week</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Study Time</p>
                            <p className="text-3xl font-bold text-primary">{stats?.totalHours || 0}h</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Sessions Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats?.sessionCount || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Average per Session</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {stats && stats.sessionCount > 0
                                    ? (stats.totalMinutes / stats.sessionCount).toFixed(0)
                                    : 0}min
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subject Distribution */}
            {stats && stats.subjectDistribution.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6 mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Subject-wise Time Distribution</h2>
                    <div className="space-y-3">
                        {stats.subjectDistribution.map((subject) => (
                            <div key={subject.subjectId}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: subject.subjectColor }}
                                        />
                                        <span className="font-medium text-foreground">{subject.subjectName}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {(subject.totalMinutes / 60).toFixed(1)}h
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full"
                                        style={{
                                            width: `${(subject.totalMinutes / (stats.totalMinutes || 1)) * 100}%`,
                                            backgroundColor: subject.subjectColor,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Sessions */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Recent Sessions</h2>
                {sessions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No study sessions yet. Start your first session!</p>
                ) : (
                    <div className="space-y-3">
                        {sessions.slice(0, 10).map((session) => (
                            <div key={session._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: session.subjectId.color }}
                                    />
                                    <div>
                                        <p className="font-medium text-foreground">{session.subjectId.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(session.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-primary">{session.duration} min</p>
                                    {session.focusLevel && (
                                        <p className="text-xs text-muted-foreground capitalize">{session.focusLevel} focus</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudyTracker;
