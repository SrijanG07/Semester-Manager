import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Plus, X, Clock, MapPin, Trash2 } from "lucide-react";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
const CLASS_TYPES = ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Other'];

interface TimetableEntry {
    _id: string;
    subjectId: { _id: string; name: string; color: string; code?: string };
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
    type: string;
}

interface Subject {
    _id: string;
    name: string;
    color: string;
    code?: string;
}

const Timetable = () => {
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        subjectId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '', type: 'Lecture',
    });

    const today = new Date().getDay();

    useEffect(() => {
        Promise.all([
            api.get('/timetable'),
            api.get('/subjects'),
        ]).then(([ttRes, subRes]) => {
            setEntries(ttRes.data);
            setSubjects(subRes.data);
        }).catch(() => toast.error('Failed to load timetable'))
          .finally(() => setLoading(false));
    }, []);

    const handleAdd = async () => {
        if (!form.subjectId) return toast.error('Select a subject');
        try {
            const { data } = await api.post('/timetable', form);
            setEntries([...entries, data]);
            setShowForm(false);
            setForm({ subjectId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '', type: 'Lecture' });
            toast.success('Class added!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/timetable/${id}`);
            setEntries(entries.filter(e => e._id !== id));
            toast.success('Deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const getEntriesForDay = (day: number) =>
        entries.filter(e => e.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const timeToPercent = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return ((h - 8) + m / 60) / 12 * 100; // 8AM to 8PM = 12 hours
    };

    if (loading) {
        return (
            <DashboardLayout title="Timetable" subtitle="Your recurring weekly schedule">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Timetable" subtitle="Your recurring weekly schedule">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {entries.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                            {entries.length} classes scheduled
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 2.1l4 4-4 4"/>
                            <path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8M7 21.9l-4-4 4-4"/>
                            <path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"/>
                        </svg>
                        Repeats every week
                    </span>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary gap-2">
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showForm ? 'Cancel' : 'Add Class'}
                    </button>
                </div>

                {/* Add form */}
                {showForm && (
                    <div className="card animate-fade-in-up">
                        <h3 className="text-sm font-semibold mb-3">Add Class</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} className="input">
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                            <select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: Number(e.target.value) })} className="input">
                                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input">
                                {CLASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="input" />
                            <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="input" />
                            <input placeholder="Room (optional)" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="input" />
                        </div>
                        <button onClick={handleAdd} className="btn btn-primary mt-3">Add to Timetable</button>
                    </div>
                )}

                {/* Weekly grid */}
                <div className="card overflow-x-auto p-0">
                    <div className="min-w-[700px]">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b border-border">
                            {[1, 2, 3, 4, 5, 6, 0].map(day => (
                                <div
                                    key={day}
                                    className={`p-3 text-center text-sm font-semibold border-r border-border last:border-r-0 ${
                                        day === today ? 'bg-primary/5 text-primary' : 'text-foreground'
                                    }`}
                                >
                                    {SHORT_DAYS[day]}
                                    {day === today && (
                                        <span className="block text-[10px] font-medium text-primary">Today</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Time slots */}
                        <div className="grid grid-cols-7 min-h-[500px]">
                            {[1, 2, 3, 4, 5, 6, 0].map(day => (
                                <div key={day} className={`border-r border-border last:border-r-0 p-1.5 space-y-1 ${
                                    day === today ? 'bg-primary/[0.02]' : ''
                                }`}>
                                    {getEntriesForDay(day).length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <span className="text-xs text-muted-foreground/40">No classes</span>
                                        </div>
                                    ) : (
                                        getEntriesForDay(day).map(entry => (
                                            <div
                                                key={entry._id}
                                                className="rounded-lg p-2 text-xs group relative transition-all duration-200 hover:shadow-md"
                                                style={{
                                                    backgroundColor: entry.subjectId.color + '18',
                                                    borderLeft: `3px solid ${entry.subjectId.color}`,
                                                }}
                                            >
                                                <p className="font-semibold truncate" style={{ color: entry.subjectId.color }}>
                                                    {entry.subjectId.name}
                                                </p>
                                                <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{entry.startTime} - {entry.endTime}</span>
                                                </div>
                                                {entry.room && (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{entry.room}</span>
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-muted-foreground">{entry.type}</span>
                                                <button
                                                    onClick={() => handleDelete(entry._id)}
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
                                                >
                                                    <Trash2 className="w-3 h-3 text-destructive" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {entries.length === 0 && !showForm && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No classes scheduled</p>
                        <p className="text-sm">Click "Add Class" to build your weekly timetable.</p>
                        <p className="text-xs mt-1 text-muted-foreground/60">Set it once — it repeats every week automatically.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Timetable;
