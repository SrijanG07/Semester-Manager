import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, Clock, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '../../utils/api';
import { toast } from 'sonner';

const STORAGE_KEY = 'study-tracker-active-session';

interface ActiveSessionData {
    subjectId: string;
    subjectName?: string;
    startTime: string;
    focusLevel: string;
    notes: string;
    isPaused?: boolean;
    pausedElapsed?: number;
    resumeTime?: string;
}

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

/** Save the active session to localStorage so it survives refresh / tab switch */
const saveActiveSession = (data: ActiveSessionData | null) => {
    if (data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
};

/** Load any previously-persisted active session */
const loadActiveSession = (): ActiveSessionData | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as ActiveSessionData;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
};

const StudyTracker: React.FC = () => {
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [stats, setStats] = useState<StudyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSession, setCurrentSession] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');
    const [focusLevel, setFocusLevel] = useState<string>('medium');

    // ── Restore persisted session on mount ──────────────────────────────
    useEffect(() => {
        const saved = loadActiveSession();
        if (saved) {
            setCurrentSession({ startTime: saved.startTime, subjectId: saved.subjectId, focusLevel: saved.focusLevel });
            setSelectedSubject(saved.subjectId);
            setFocusLevel(saved.focusLevel);
            setSessionNotes(saved.notes);
            setIsTimerRunning(true);
            setIsPaused(!!saved.isPaused);

            if (saved.isPaused) {
                setElapsedTime(saved.pausedElapsed || 0);
            } else {
                const baseElapsed = saved.pausedElapsed || 0;
                const reference = saved.resumeTime || saved.startTime;
                const running = Math.floor((Date.now() - new Date(reference).getTime()) / 1000);
                setElapsedTime(Math.max(0, baseElapsed + running));
            }
        }
        fetchData();
    }, []);

    // ── Tick the timer every second (works even after returning to the tab) ─
    useEffect(() => {
        let interval: any;
        if (isTimerRunning && currentSession && !isPaused) {
            interval = setInterval(() => {
                const saved = loadActiveSession();
                if (!saved) return;

                // Sync pause state from floating widget
                if (saved.isPaused) {
                    setIsPaused(true);
                    setElapsedTime(saved.pausedElapsed || 0);
                    return;
                }

                const baseElapsed = saved.pausedElapsed || 0;
                const reference = saved.resumeTime || saved.startTime;
                const running = Math.floor((Date.now() - new Date(reference).getTime()) / 1000);
                setElapsedTime(Math.max(0, baseElapsed + running));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, currentSession, isPaused]);

    // ── Sync with floating widget changes (pause/resume/stop from widget) ─
    useEffect(() => {
        const syncInterval = setInterval(() => {
            const saved = loadActiveSession();
            if (!saved && isTimerRunning) {
                // Session was stopped from the floating widget
                setIsTimerRunning(false);
                setCurrentSession(null);
                setElapsedTime(0);
                setSessionNotes('');
                setIsPaused(false);
                fetchData();
                return;
            }
            if (saved && isTimerRunning) {
                if (saved.isPaused !== isPaused) {
                    setIsPaused(!!saved.isPaused);
                    if (saved.isPaused) {
                        setElapsedTime(saved.pausedElapsed || 0);
                    }
                }
            }
        }, 500);
        return () => clearInterval(syncInterval);
    }, [isTimerRunning, isPaused]);

    // ── Persist notes while typing so they survive a refresh ─────────────
    useEffect(() => {
        if (!isTimerRunning) return;
        const saved = loadActiveSession();
        if (saved) {
            saveActiveSession({ ...saved, notes: sessionNotes });
        }
    }, [sessionNotes, isTimerRunning]);

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
            const subjectName = subjects.find(s => s._id === selectedSubject)?.name || '';
            const session = {
                subjectId: selectedSubject,
                startTime: new Date().toISOString(),
                focusLevel,
            };

            // Persist to localStorage first
            saveActiveSession({
                subjectId: selectedSubject,
                subjectName,
                startTime: session.startTime,
                focusLevel,
                notes: '',
                isPaused: false,
                pausedElapsed: 0,
            });

            setCurrentSession(session);
            setIsTimerRunning(true);
            setIsPaused(false);
            setElapsedTime(0);
            setSessionNotes('');
            toast.success('Study session started!');
        } catch (error) {
            toast.error('Failed to start session');
        }
    };

    const pauseSession = () => {
        const saved = loadActiveSession();
        if (!saved) return;
        const updated: ActiveSessionData = {
            ...saved,
            isPaused: true,
            pausedElapsed: elapsedTime,
        };
        delete updated.resumeTime;
        saveActiveSession(updated);
        setIsPaused(true);
    };

    const resumeSession = () => {
        const saved = loadActiveSession();
        if (!saved) return;
        const updated: ActiveSessionData = {
            ...saved,
            isPaused: false,
            resumeTime: new Date().toISOString(),
        };
        saveActiveSession(updated);
        setIsPaused(false);
    };

    const stopSession = async () => {
        if (!currentSession) return;

        try {
            const duration = Math.floor(elapsedTime / 60);

            await api.post('/study-sessions', {
                subjectId: selectedSubject,
                startTime: currentSession.startTime,
                endTime: new Date().toISOString(),
                duration,
                notes: sessionNotes,
                focusLevel,
            });

            // Clear persisted session
            saveActiveSession(null);

            toast.success(`Session saved! ${duration} minutes studied`);
            setIsTimerRunning(false);
            setIsPaused(false);
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 h-64 bg-muted rounded-xl animate-pulse" />
                    <div className="h-64 bg-muted rounded-xl animate-pulse" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Study Tracker" subtitle="Track your study sessions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* Timer Panel */}
                <Card className="lg:col-span-2 shadow-none border border-border">
                    <CardContent className="p-6">
                        <h2 className="font-semibold text-foreground mb-4">
                            {isTimerRunning ? (isPaused ? 'Session Paused' : 'Session Active') : 'Start Study Session'}
                        </h2>

                        {!isTimerRunning ? (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-muted-foreground">Select Subject *</label>
                                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a subject..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((subject) => (
                                                <SelectItem key={subject._id} value={subject._id}>
                                                    {subject.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-muted-foreground">Focus Level</label>
                                    <div className="flex gap-2">
                                        {['low', 'medium', 'high'].map((level) => (
                                            <Button
                                                key={level}
                                                type="button"
                                                variant={focusLevel === level ? 'default' : 'outline'}
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => setFocusLevel(level)}
                                            >
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Button onClick={startSession} className="w-full h-11" size="lg">
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Session
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-5xl font-bold text-primary mb-2 font-mono tracking-wider">
                                    {formatTime(elapsedTime)}
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Studying: {subjects.find(s => s._id === selectedSubject)?.name}
                                </p>

                                <div className="mb-4 text-left">
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Session Notes (Optional)
                                    </label>
                                    <textarea
                                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary resize-none"
                                        rows={2}
                                        value={sessionNotes}
                                        onChange={(e) => setSessionNotes(e.target.value)}
                                        placeholder="What did you learn?"
                                    />
                                </div>

                                <div className="flex gap-2 w-full">
                                    {isPaused ? (
                                        <Button onClick={resumeSession} className="flex-1 h-11" size="lg">
                                            <Play className="w-4 h-4 mr-2" />
                                            Resume
                                        </Button>
                                    ) : (
                                        <Button onClick={pauseSession} variant="outline" className="flex-1 h-11" size="lg">
                                            <Pause className="w-4 h-4 mr-2" />
                                            Pause
                                        </Button>
                                    )}
                                    <Button onClick={stopSession} variant="destructive" className="flex-1 h-11" size="lg">
                                        <Square className="w-4 h-4 mr-2" />
                                        Stop & Save
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Panel */}
                <Card className="shadow-none border border-border">
                    <CardContent className="p-6">
                        <h2 className="font-semibold text-foreground mb-5">This Week</h2>
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/8">
                                    <Clock className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Study Time</p>
                                    <p className="text-xl font-semibold text-foreground">{stats?.totalHours || 0}h</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-success/8">
                                    <Zap className="w-4 h-4 text-success" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Sessions Completed</p>
                                    <p className="text-xl font-semibold text-foreground">{stats?.sessionCount || 0}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-100">
                                    <TrendingUp className="w-4 h-4 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Avg. per Session</p>
                                    <p className="text-xl font-semibold text-foreground">
                                        {stats && stats.sessionCount > 0
                                            ? (stats.totalMinutes / stats.sessionCount).toFixed(0)
                                            : 0}min
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subject Distribution */}
            {stats && stats.subjectDistribution.length > 0 && (
                <Card className="shadow-none border border-border mb-4">
                    <CardContent className="p-6">
                        <h2 className="font-semibold text-foreground mb-4">Subject-wise Time Distribution</h2>
                        <div className="space-y-3">
                            {stats.subjectDistribution.map((subject) => (
                                <div key={subject.subjectId}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: subject.subjectColor }}
                                            />
                                            <span className="text-sm font-medium text-foreground">{subject.subjectName}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {(subject.totalMinutes / 60).toFixed(1)}h
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full transition-all"
                                            style={{
                                                width: `${(subject.totalMinutes / (stats.totalMinutes || 1)) * 100}%`,
                                                backgroundColor: subject.subjectColor,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Study Heatmap */}
            <Card className="shadow-none border border-border mb-4">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-foreground">Study Activity</h2>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>Less</span>
                            {[0, 1, 2, 3, 4].map((level) => (
                                <div
                                    key={level}
                                    className="rounded-[3px]"
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: level === 0
                                            ? 'hsl(var(--muted))'
                                            : `hsl(var(--primary) / ${0.15 + level * 0.2})`,
                                    }}
                                />
                            ))}
                            <span>More</span>
                        </div>
                    </div>
                    {(() => {
                        // Build heatmap data from sessions
                        const weeks = 20;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        // Day-of-week for today (0=Sun, 6=Sat)
                        const todayDay = today.getDay();
                        // Start date: go back enough to fill `weeks` full columns + current partial week
                        const startDate = new Date(today);
                        startDate.setDate(startDate.getDate() - (todayDay + (weeks - 1) * 7));

                        // Aggregate session minutes per date key
                        const minutesByDate: Record<string, number> = {};
                        sessions.forEach((s) => {
                            const d = new Date(s.date);
                            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            minutesByDate[key] = (minutesByDate[key] || 0) + s.duration;
                        });

                        // Find max for scaling
                        const allValues = Object.values(minutesByDate);
                        const maxMinutes = Math.max(1, ...allValues);

                        // Build grid: columns = weeks, rows = 7 days (Sun–Sat)
                        const columns: Array<Array<{ date: Date; key: string; minutes: number }>> = [];
                        const cursor = new Date(startDate);

                        for (let w = 0; w < weeks; w++) {
                            const week: typeof columns[0] = [];
                            for (let d = 0; d < 7; d++) {
                                const cellDate = new Date(cursor);
                                const key = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
                                const isFuture = cellDate > today;
                                week.push({
                                    date: cellDate,
                                    key,
                                    minutes: isFuture ? -1 : (minutesByDate[key] || 0),
                                });
                                cursor.setDate(cursor.getDate() + 1);
                            }
                            columns.push(week);
                        }

                        const getLevel = (minutes: number): number => {
                            if (minutes <= 0) return 0;
                            const ratio = minutes / maxMinutes;
                            if (ratio <= 0.25) return 1;
                            if (ratio <= 0.5) return 2;
                            if (ratio <= 0.75) return 3;
                            return 4;
                        };

                        const getCellColor = (minutes: number, isFuture: boolean): string => {
                            if (isFuture) return 'transparent';
                            const level = getLevel(minutes);
                            if (level === 0) return 'hsl(var(--muted))';
                            return `hsl(var(--primary) / ${0.15 + level * 0.2})`;
                        };

                        const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

                        // Month labels
                        const monthLabels: Array<{ label: string; colIndex: number }> = [];
                        let lastMonth = -1;
                        columns.forEach((week, colIdx) => {
                            const firstDay = week[0]?.date;
                            if (firstDay) {
                                const m = firstDay.getMonth();
                                if (m !== lastMonth) {
                                    monthLabels.push({
                                        label: firstDay.toLocaleDateString('en-US', { month: 'short' }),
                                        colIndex: colIdx,
                                    });
                                    lastMonth = m;
                                }
                            }
                        });

                        return (
                            <div className="overflow-x-auto">
                                {/* Month labels */}
                                <div className="flex" style={{ paddingLeft: '32px', marginBottom: '4px' }}>
                                    {columns.map((_, colIdx) => {
                                        const monthLabel = monthLabels.find(m => m.colIndex === colIdx);
                                        return (
                                            <div
                                                key={colIdx}
                                                style={{ width: '16px', minWidth: '16px', fontSize: '10px' }}
                                                className="text-muted-foreground font-medium"
                                            >
                                                {monthLabel ? monthLabel.label : ''}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-0">
                                    {/* Day labels */}
                                    <div className="flex flex-col gap-[3px] mr-2 flex-shrink-0" style={{ width: '24px' }}>
                                        {dayLabels.map((label, i) => (
                                            <div
                                                key={i}
                                                className="text-muted-foreground text-[10px] font-medium"
                                                style={{ height: '13px', lineHeight: '13px' }}
                                            >
                                                {label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Heatmap grid */}
                                    <div className="flex gap-[3px]">
                                        {columns.map((week, wIdx) => (
                                            <div key={wIdx} className="flex flex-col gap-[3px]">
                                                {week.map((cell) => {
                                                    const isFuture = cell.minutes === -1;
                                                    return (
                                                        <div
                                                            key={cell.key}
                                                            className="group relative"
                                                            style={{
                                                                width: '13px',
                                                                height: '13px',
                                                                borderRadius: '3px',
                                                                backgroundColor: getCellColor(cell.minutes, isFuture),
                                                                border: isFuture ? 'none' : cell.minutes > 0
                                                                    ? '1px solid hsl(var(--primary) / 0.1)'
                                                                    : '1px solid hsl(var(--border) / 0.5)',
                                                                transition: 'transform 0.1s ease',
                                                                cursor: isFuture ? 'default' : 'pointer',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!isFuture) (e.currentTarget.style.transform = 'scale(1.3)');
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                (e.currentTarget.style.transform = 'scale(1)');
                                                            }}
                                                        >
                                                            {/* Tooltip */}
                                                            {!isFuture && (
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-foreground text-background text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                                                                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                                                                >
                                                                    {cell.minutes > 0
                                                                        ? `${cell.minutes} min studied`
                                                                        : 'No study'}
                                                                    <span className="block text-[9px] opacity-70">
                                                                        {cell.date.toLocaleDateString('en-US', {
                                                                            weekday: 'short',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </CardContent>
            </Card>

            {/* Recent Sessions — compact */}
            {sessions.length > 0 && (
                <Card className="shadow-none border border-border">
                    <CardContent className="p-6">
                        <h2 className="font-semibold text-foreground mb-3">Recent Sessions</h2>
                        <div className="space-y-1.5">
                            {sessions.slice(0, 5).map((session) => (
                                <div key={session._id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: session.subjectId.color }}
                                        />
                                        <span className="text-sm font-medium text-foreground">{session.subjectId.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-primary">{session.duration}m</span>
                                        {session.focusLevel && (
                                            <span className="text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                                                {session.focusLevel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default StudyTracker;
