import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState, useCallback } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Plus, Search, StickyNote, Pin, PinOff, Trash2, X, BookOpen } from "lucide-react";

interface Note {
    _id: string;
    title: string;
    content: string;
    subjectId?: { _id: string; name: string; color: string };
    isPinned: boolean;
    tags: string[];
    updatedAt: string;
}

interface Subject {
    _id: string;
    name: string;
    color: string;
}

const Notes = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [search, setSearch] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchNotes = useCallback(async () => {
        try {
            const params: any = {};
            if (search) params.search = search;
            if (filterSubject) params.subjectId = filterSubject;
            const { data } = await api.get('/notes', { params });
            setNotes(data);
        } catch {
            toast.error('Failed to load notes');
        }
    }, [search, filterSubject]);

    useEffect(() => {
        Promise.all([
            api.get('/notes'),
            api.get('/subjects'),
        ]).then(([notesRes, subRes]) => {
            setNotes(notesRes.data);
            setSubjects(subRes.data);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!loading) fetchNotes();
    }, [search, filterSubject, fetchNotes, loading]);

    const createNote = async () => {
        try {
            const { data } = await api.post('/notes', {
                title: 'Untitled Note',
                content: '',
                subjectId: filterSubject || undefined,
            });
            setNotes([data, ...notes]);
            setSelectedNote(data);
        } catch {
            toast.error('Failed to create note');
        }
    };

    const saveNote = async (note: Note) => {
        setSaving(true);
        try {
            await api.put(`/notes/${note._id}`, {
                title: note.title,
                content: note.content,
            });
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const togglePin = async (note: Note) => {
        try {
            const { data } = await api.put(`/notes/${note._id}`, { isPinned: !note.isPinned });
            setNotes(notes.map(n => n._id === data._id ? data : n));
            if (selectedNote?._id === data._id) setSelectedNote(data);
        } catch {
            toast.error('Failed to update');
        }
    };

    const deleteNote = async (id: string) => {
        try {
            await api.delete(`/notes/${id}`);
            setNotes(notes.filter(n => n._id !== id));
            if (selectedNote?._id === id) setSelectedNote(null);
            toast.success('Note deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const updateSelectedNote = (field: string, value: string) => {
        if (!selectedNote) return;
        const updated = { ...selectedNote, [field]: value };
        setSelectedNote(updated);
        setNotes(notes.map(n => n._id === updated._id ? updated : n));
    };

    // Auto-save on blur
    const handleBlur = () => {
        if (selectedNote) saveNote(selectedNote);
    };

    if (loading) {
        return (
            <DashboardLayout title="Notes" subtitle="Your notebook">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Notes" subtitle="Your personal notebook">
            <div className="flex gap-4 h-[calc(100vh-180px)]">
                {/* Sidebar — Note List */}
                <div className="w-72 flex-shrink-0 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
                    {/* Controls */}
                    <div className="p-3 border-b border-border space-y-2">
                        <button onClick={createNote} className="btn btn-primary w-full gap-2 text-sm">
                            <Plus className="w-4 h-4" /> New Note
                        </button>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="input pl-8 h-8 text-xs"
                            />
                        </div>
                        <select
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                            className="input h-8 text-xs"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Note list */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        {notes.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No notes yet</p>
                            </div>
                        ) : (
                            notes.map(note => (
                                <button
                                    key={note._id}
                                    onClick={() => setSelectedNote(note)}
                                    className={`w-full text-left p-3 border-b border-border/50 transition-colors hover:bg-accent/50 ${
                                        selectedNote?._id === note._id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {note.isPinned && <span className="text-primary mr-1">📌</span>}
                                            {note.title}
                                        </p>
                                    </div>
                                    {note.subjectId && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: note.subjectId.color }} />
                                            <span className="text-[10px] text-muted-foreground">{note.subjectId.name}</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {note.content || 'Empty note...'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                                        {new Date(note.updatedAt).toLocaleDateString()}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
                    {selectedNote ? (
                        <>
                            {/* Note header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                <input
                                    type="text"
                                    value={selectedNote.title}
                                    onChange={e => updateSelectedNote('title', e.target.value)}
                                    onBlur={handleBlur}
                                    className="text-lg font-semibold bg-transparent outline-none flex-1 text-foreground"
                                    placeholder="Note title..."
                                />
                                <div className="flex items-center gap-1">
                                    {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
                                    <button onClick={() => togglePin(selectedNote)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title={selectedNote.isPinned ? 'Unpin' : 'Pin'}>
                                        {selectedNote.isPinned ? <PinOff className="w-4 h-4 text-primary" /> : <Pin className="w-4 h-4 text-muted-foreground" />}
                                    </button>
                                    <button onClick={() => deleteNote(selectedNote._id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </button>
                                </div>
                            </div>

                            {/* Content editor */}
                            <textarea
                                value={selectedNote.content}
                                onChange={e => updateSelectedNote('content', e.target.value)}
                                onBlur={handleBlur}
                                className="flex-1 p-4 bg-transparent resize-none outline-none text-sm text-foreground leading-relaxed font-mono"
                                placeholder="Start writing... (Markdown supported)"
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Select a note or create a new one</p>
                                <p className="text-sm mt-1">Use the sidebar to navigate your notes</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Notes;
