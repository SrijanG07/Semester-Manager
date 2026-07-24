import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Clock, ChevronDown, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'sonner';

const STORAGE_KEY = 'study-tracker-active-session';
const POSITION_KEY = 'study-timer-position';

interface ActiveSessionData {
    subjectId: string;
    subjectName?: string;
    startTime: string;
    focusLevel: string;
    notes: string;
    isPaused?: boolean;
    pausedElapsed?: number; // seconds accumulated before last pause
    resumeTime?: string;    // time when last resumed (replaces startTime for calculation)
}

const loadSession = (): ActiveSessionData | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as ActiveSessionData;
    } catch {
        return null;
    }
};

const saveSession = (data: ActiveSessionData | null) => {
    if (data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
};

const loadPosition = (): { x: number; y: number } | null => {
    try {
        const raw = localStorage.getItem(POSITION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const FloatingStudyTimer: React.FC = () => {
    const [session, setSession] = useState<ActiveSessionData | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [minimized, setMinimized] = useState(false);
    const navigate = useNavigate();

    // Drag state
    const [position, setPosition] = useState<{ x: number; y: number }>(() => {
        return loadPosition() || { x: window.innerWidth - 264, y: window.innerHeight - 200 };
    });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    const hasMoved = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Clamp position within viewport on resize
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => {
                const w = minimized ? 56 : 240;
                const h = minimized ? 56 : 180;
                return {
                    x: Math.min(prev.x, window.innerWidth - w),
                    y: Math.min(prev.y, window.innerHeight - h),
                };
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [minimized]);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        // Only drag on left click
        if (e.button !== 0) return;
        isDragging.current = true;
        hasMoved.current = false;
        dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        e.preventDefault();
    }, [position]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;

        // Dead zone of 3px to distinguish click from drag
        if (!hasMoved.current && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
        hasMoved.current = true;

        const w = minimized ? 56 : 240;
        const h = minimized ? 56 : 180;
        const newX = Math.max(0, Math.min(window.innerWidth - w, dragStart.current.posX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - h, dragStart.current.posY + dy));
        setPosition({ x: newX, y: newY });
    }, [minimized]);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        // Save final position
        const w = minimized ? 56 : 240;
        const h = minimized ? 56 : 180;
        const finalPos = {
            x: Math.max(0, Math.min(window.innerWidth - w, dragStart.current.posX + (e.clientX - dragStart.current.x))),
            y: Math.max(0, Math.min(window.innerHeight - h, dragStart.current.posY + (e.clientY - dragStart.current.y))),
        };
        localStorage.setItem(POSITION_KEY, JSON.stringify(finalPos));
    }, [minimized]);

    // Check localStorage periodically for session changes (from StudyTracker page)
    useEffect(() => {
        const check = () => {
            const saved = loadSession();
            setSession(saved);
        };
        check();
        const interval = setInterval(check, 1000);
        return () => clearInterval(interval);
    }, []);

    // Tick the timer
    useEffect(() => {
        if (!session || session.isPaused) return;

        const tick = () => {
            const baseElapsed = session.pausedElapsed || 0;
            const reference = session.resumeTime || session.startTime;
            const running = Math.floor((Date.now() - new Date(reference).getTime()) / 1000);
            setElapsed(Math.max(0, baseElapsed + running));
        };

        tick(); // immediate
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [session]);

    // When paused, show the frozen elapsed
    useEffect(() => {
        if (session?.isPaused && session.pausedElapsed !== undefined) {
            setElapsed(session.pausedElapsed);
        }
    }, [session?.isPaused, session?.pausedElapsed]);

    const handlePause = useCallback(() => {
        if (!session) return;
        const updated: ActiveSessionData = {
            ...session,
            isPaused: true,
            pausedElapsed: elapsed,
        };
        delete updated.resumeTime;
        saveSession(updated);
        setSession(updated);
    }, [session, elapsed]);

    const handleResume = useCallback(() => {
        if (!session) return;
        const updated: ActiveSessionData = {
            ...session,
            isPaused: false,
            resumeTime: new Date().toISOString(),
            // pausedElapsed stays as-is — it holds the previously accumulated seconds
        };
        saveSession(updated);
        setSession(updated);
    }, [session]);

    const handleStop = useCallback(async () => {
        if (!session) return;
        try {
            const duration = Math.floor(elapsed / 60);
            await api.post('/study-sessions', {
                subjectId: session.subjectId,
                startTime: session.startTime,
                endTime: new Date().toISOString(),
                duration,
                notes: session.notes || '',
                focusLevel: session.focusLevel,
            });
            saveSession(null);
            setSession(null);
            setElapsed(0);
            toast.success(`Session saved! ${duration} minutes studied`);
        } catch {
            toast.error('Failed to save session');
        }
    }, [session, elapsed]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Don't render if no active session
    if (!session) return null;

    const isPaused = session.isPaused;

    return (
        <div
            ref={containerRef}
            className="floating-study-timer"
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 9999,
                width: minimized ? '56px' : '240px',
                transition: isDragging.current ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                userSelect: 'none',
            }}
        >
            <div
                style={{
                    background: 'hsl(var(--card, 0 0% 100%))',
                    border: '1px solid hsl(var(--border, 220 13% 91%))',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    backdropFilter: 'blur(12px)',
                }}
            >
                {/* Minimized state - just a pulsing clock icon */}
                {minimized ? (
                    <div
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={(e) => {
                            onPointerUp(e);
                            if (!hasMoved.current) setMinimized(false);
                        }}
                        style={{
                            width: '56px',
                            height: '56px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'grab',
                            position: 'relative',
                            touchAction: 'none',
                        }}
                        title="Drag to move • Click to expand"
                    >
                        {/* Pulse ring when running */}
                        {!isPaused && (
                            <span
                                style={{
                                    position: 'absolute',
                                    inset: '6px',
                                    borderRadius: '50%',
                                    border: '2px solid hsl(var(--primary, 262 80% 55%))',
                                    animation: 'timerPulse 2s ease-in-out infinite',
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                        <Clock
                            size={22}
                            style={{ color: isPaused ? 'hsl(var(--muted-foreground, 220 10% 46%))' : 'hsl(var(--primary, 262 80% 55%))', pointerEvents: 'none' }}
                        />
                    </div>
                ) : (
                    <>
                        {/* Header bar — draggable */}
                        <div
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px 5px',
                                cursor: 'grab',
                                touchAction: 'none',
                            }}
                        >
                            <GripVertical
                                size={14}
                                style={{ color: 'hsl(var(--muted-foreground, 220 10% 46%))', opacity: 0.4, flexShrink: 0, pointerEvents: 'none' }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    flex: 1,
                                    minWidth: 0,
                                    marginLeft: '4px',
                                    pointerEvents: 'none',
                                }}
                            >
                                <div
                                    style={{
                                        width: '7px',
                                        height: '7px',
                                        borderRadius: '50%',
                                        backgroundColor: isPaused ? 'hsl(var(--muted-foreground, 220 10% 46%))' : '#22c55e',
                                        flexShrink: 0,
                                        animation: isPaused ? 'none' : 'dotPulse 1.5s ease-in-out infinite',
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'hsl(var(--muted-foreground, 220 10% 46%))',
                                        letterSpacing: '0.02em',
                                        textTransform: 'uppercase',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {isPaused ? 'Paused' : 'Studying'}
                                </span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    color: 'hsl(var(--muted-foreground, 220 10% 46%))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    pointerEvents: 'auto',
                                }}
                                title="Minimize"
                            >
                                <ChevronDown size={14} />
                            </button>
                        </div>

                        {/* Timer display */}
                        <div style={{ padding: '4px 14px 8px', textAlign: 'center' }}>
                            <div
                                style={{
                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                                    fontSize: '28px',
                                    fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    color: isPaused ? 'hsl(var(--muted-foreground, 220 10% 46%))' : 'hsl(var(--foreground, 224 40% 14%))',
                                    lineHeight: 1.2,
                                    transition: 'color 0.2s',
                                }}
                            >
                                {formatTime(elapsed)}
                            </div>
                            {session.subjectName && (
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: 'hsl(var(--muted-foreground, 220 10% 46%))',
                                        marginTop: '2px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {session.subjectName}
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '6px',
                                padding: '0 14px 12px',
                            }}
                        >
                            {isPaused ? (
                                <button
                                    onClick={handleResume}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '5px',
                                        padding: '7px 0',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'hsl(var(--primary, 262 80% 55%))',
                                        color: 'hsl(var(--primary-foreground, 0 0% 100%))',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'opacity 0.15s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                                >
                                    <Play size={13} /> Resume
                                </button>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '5px',
                                        padding: '7px 0',
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--border, 220 13% 91%))',
                                        background: 'hsl(var(--card, 0 0% 100%))',
                                        color: 'hsl(var(--foreground, 224 40% 14%))',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--muted, 240 10% 95%))')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'hsl(var(--card, 0 0% 100%))')}
                                >
                                    <Pause size={13} /> Pause
                                </button>
                            )}
                            <button
                                onClick={handleStop}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '7px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'hsl(var(--destructive, 0 72% 51%))',
                                    color: 'hsl(var(--destructive-foreground, 0 0% 100%))',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                                title="Stop & Save"
                            >
                                <Square size={13} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Inline keyframe animations */}
            <style>{`
                @keyframes timerPulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                @keyframes dotPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
};

export default FloatingStudyTimer;
