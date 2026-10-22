import { useEffect, useRef, useState } from 'react';
import { Clock, Pause, Play, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const key = 'study-tracker-active-session';
interface Session {
    subjectId: string;
    subjectName?: string;
    startTime: string;
    focusLevel: string;
    notes: string;
    isPaused?: boolean;
    pausedElapsed?: number;
    resumeTime?: string;
}
function readSession(): Session | null {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function elapsed(session: Session) {
    const saved = session.pausedElapsed || 0;
    return session.isPaused ? saved : Math.max(0, saved + Math.floor((Date.now() - Date.parse(session.resumeTime || session.startTime)) / 1000));
}
export default function FloatingStudyTimer() {
    const { user } = useAuth();
    const [session, setSession] = useState<Session | null>(readSession);
    const [seconds, setSeconds] = useState(0);
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);
    useEffect(() => {
        const sync = () => {
            const current = readSession();
            setSession(current);
            setSeconds(current ? elapsed(current) : 0);
        };
        const timer = window.setInterval(sync, 1000);
        window.addEventListener('storage', sync);
        return () => { clearInterval(timer); window.removeEventListener('storage', sync); };
    }, []);
    function togglePause() {
        if (!session) return;
        const updated = { ...session, pausedElapsed: elapsed(session), isPaused: !session.isPaused, resumeTime: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(updated));
        setSession(updated);
    }
    async function stop() {
        const current = readSession();
        if (!current || savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        try {
            const duration = Math.floor(elapsed(current) / 60);
            await api.post('/study-sessions', { ...current, duration, endTime: new Date().toISOString() });
            localStorage.removeItem(key);
            setSession(null);
            toast.success(`Saved ${duration} minutes`);
        } catch { toast.error('Could not save. Your timer is still available.'); }
        finally { savingRef.current = false; setSaving(false); }
    }
    if (!user || !session) return null;
    const time = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
    return (
        <aside aria-label="Active study session" className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <Link to="/study" className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{session.subjectName || 'Study session'}</p>
                <p className="font-mono text-lg tabular-nums">{time}</p>
            </Link>
            <button onClick={togglePause} disabled={saving} aria-label={session.isPaused ? 'Resume study' : 'Pause study'} className="rounded-md p-2 hover:bg-accent disabled:opacity-50">
                {session.isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button onClick={stop} disabled={saving} aria-label="Stop and save study session" className="rounded-md p-2 text-destructive hover:bg-accent disabled:opacity-50"><Square size={16} /></button>
        </aside>
    );
}
