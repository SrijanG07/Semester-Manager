import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
    Plus, BookOpen, MoreVertical, Pencil, Trash2, ChevronRight,
    FolderKanban, GraduationCap, Sparkles, AlertTriangle, Layers,
    Calendar, CheckCircle2
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { toast } from "sonner";

interface Subject {
    _id: string;
    name: string;
    code: string;
    credits: number;
    color: string;
    instructor?: string;
    semester?: string;
}

interface SubjectStats {
    score: number;
    scoreEntered: number;
    attendance: number;
    resourceCount: number;
    nextDeadline: { title: string; type: string; daysUntil: number } | null;
}

const DEFAULT_SEMESTERS = [
    "Semester 1", "Semester 2", "Semester 3", "Semester 4",
    "Semester 5", "Semester 6", "Semester 7", "Semester 8"
];

const PRESET_COLORS = [
    "#7c3aed", "#3b82f6", "#06b6d4", "#10b981",
    "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"
];

const SubjectsList = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStats>>({});
    const [loading, setLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState<string>("All");

    // Subject Add/Edit Modal
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [customSemInput, setCustomSemInput] = useState(false);

    // Delete Semester Confirmation Modal
    const [semesterToDelete, setSemesterToDelete] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        credits: 3,
        color: "#7c3aed",
        instructor: "",
        semester: "Semester 1",
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const response = await api.get("/subjects");
            setSubjects(response.data);
            fetchAllStats(response.data);
        } catch (error) {
            toast.error("Failed to load subjects");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllStats = async (subjectList: Subject[]) => {
        const stats: Record<string, SubjectStats> = {};

        await Promise.all(subjectList.map(async (subject) => {
            try {
                const [scoreRes, attendanceRes, resourcesRes, deadlinesRes] = await Promise.allSettled([
                    api.get(`/subjects/${subject._id}/calculate`),
                    api.get(`/subjects/${subject._id}/attendance/stats`),
                    api.get(`/subjects/${subject._id}/resources`),
                    api.get(`/deadlines?subjectId=${subject._id}`),
                ]);

                const score = scoreRes.status === 'fulfilled' ? scoreRes.value.data : null;
                const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data : null;
                const resources = resourcesRes.status === 'fulfilled' ? resourcesRes.value.data : [];
                const deadlines = deadlinesRes.status === 'fulfilled' ? deadlinesRes.value.data : [];

                const upcomingDeadlines = deadlines
                    .filter((d: any) => !d.completed && new Date(d.dueDate) >= new Date())
                    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                const nextDeadline = upcomingDeadlines[0] ? {
                    title: upcomingDeadlines[0].title,
                    type: upcomingDeadlines[0].type,
                    daysUntil: Math.ceil((new Date(upcomingDeadlines[0].dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                } : null;

                stats[subject._id] = {
                    score: score?.currentScore || 0,
                    scoreEntered: score?.totalWeightEntered || 0,
                    attendance: attendance?.percentage || 0,
                    resourceCount: resources.length || 0,
                    nextDeadline
                };
            } catch (error) {
                stats[subject._id] = {
                    score: 0,
                    scoreEntered: 0,
                    attendance: 0,
                    resourceCount: 0,
                    nextDeadline: null
                };
            }
        }));

        setSubjectStats(stats);
    };

    // Extract all unique semesters present in the database + defaults
    const availableSemesters = useMemo(() => {
        const set = new Set<string>();
        subjects.forEach(s => {
            if (s.semester) set.add(s.semester);
        });
        if (set.size === 0) {
            DEFAULT_SEMESTERS.slice(0, 4).forEach(s => set.add(s));
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }, [subjects]);

    // Group subjects by semester
    const groupedSubjects = useMemo(() => {
        const map: Record<string, Subject[]> = {};
        subjects.forEach(sub => {
            const sem = sub.semester || "Unassigned";
            if (!map[sem]) map[sem] = [];
            map[sem].push(sub);
        });
        return map;
    }, [subjects]);

    // Filtered subjects according to selected semester tab
    const displayedSubjects = useMemo(() => {
        if (selectedSemester === "All") return subjects;
        return subjects.filter(s => (s.semester || "Unassigned") === selectedSemester);
    }, [subjects, selectedSemester]);

    // Total credits and avg stats for current view
    const currentViewStats = useMemo(() => {
        const totalCredits = displayedSubjects.reduce((sum, s) => sum + (s.credits || 0), 0);
        const attendances = displayedSubjects
            .map(s => subjectStats[s._id]?.attendance)
            .filter((a): a is number => typeof a === 'number' && a > 0);
        const avgAttendance = attendances.length > 0
            ? attendances.reduce((a, b) => a + b, 0) / attendances.length
            : 0;
        return { totalCredits, avgAttendance };
    }, [displayedSubjects, subjectStats]);

    const openAddModalForSemester = (sem: string) => {
        setEditingSubject(null);
        setCustomSemInput(false);
        setFormData({
            name: "",
            code: "",
            credits: 3,
            color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
            instructor: "",
            semester: sem === "All" ? (availableSemesters[0] || "Semester 1") : sem,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSubject) {
                await api.put(`/subjects/${editingSubject._id}`, formData);
                toast.success("Subject updated successfully!");
            } else {
                await api.post("/subjects", formData);
                toast.success(`Subject added to ${formData.semester}!`);
            }
            setShowModal(false);
            setEditingSubject(null);
            fetchSubjects();
        } catch (error) {
            toast.error(editingSubject ? "Failed to update subject" : "Failed to create subject");
        }
    };

    const handleEdit = (subject: Subject) => {
        setEditingSubject(subject);
        setCustomSemInput(!DEFAULT_SEMESTERS.includes(subject.semester || ""));
        setFormData({
            name: subject.name,
            code: subject.code || "",
            credits: subject.credits || 3,
            color: subject.color || "#7c3aed",
            instructor: subject.instructor || "",
            semester: subject.semester || "Semester 1",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this subject? This will also delete all associated topics, resources, and deadlines.")) return;
        try {
            await api.delete(`/subjects/${id}`);
            toast.success("Subject deleted!");
            fetchSubjects();
        } catch (error) {
            toast.error("Failed to delete subject");
        }
    };

    const handleDeleteSemester = async () => {
        if (!semesterToDelete) return;
        setDeleteLoading(true);
        try {
            const res = await api.delete(`/subjects/semesters/${encodeURIComponent(semesterToDelete)}`);
            toast.success(res.data.message || `Deleted ${semesterToDelete} successfully!`);
            setSemesterToDelete(null);
            setSelectedSemester("All");
            fetchSubjects();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete semester");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCardClick = (subjectId: string) => {
        navigate(`/subjects/${subjectId}`);
    };

    const getAttendanceColor = (attendance: number) => {
        if (attendance >= 75) return "text-emerald-500 font-semibold";
        if (attendance >= 60) return "text-amber-500 font-semibold";
        return "text-rose-500 font-semibold";
    };

    if (loading) {
        return (
            <DashboardLayout title="Subjects" subtitle="Semester-wise course management">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="shadow-none border border-border">
                            <CardContent className="p-6">
                                <div className="h-32 bg-muted rounded-lg animate-pulse" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Subjects" subtitle="Organize and manage courses by semester">
            {/* Top Controls & Semester Navigation */}
            <div className="space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Header Info */}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                {selectedSemester === "All" ? "All Semesters" : selectedSemester}
                            </span>
                            <Badge variant="outline" className="font-mono text-xs font-normal">
                                {displayedSubjects.length} {displayedSubjects.length === 1 ? 'Course' : 'Courses'}
                            </Badge>
                            {currentViewStats.totalCredits > 0 && (
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {currentViewStats.totalCredits} Credits
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedSemester === "All"
                                ? "Manage your entire university academic curriculum"
                                : `Active view for ${selectedSemester} coursework and requirements`}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {selectedSemester !== "All" && displayedSubjects.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                onClick={() => setSemesterToDelete(selectedSemester)}
                            >
                                <Trash2 className="w-4 h-4 mr-1.5" />
                                Delete {selectedSemester}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="h-9 shadow-sm"
                            onClick={() => openAddModalForSemester(selectedSemester)}
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Subject
                        </Button>
                    </div>
                </div>

                {/* Semester Switcher Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
                    <button
                        onClick={() => setSelectedSemester("All")}
                        className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            selectedSemester === "All"
                                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        All Semesters
                        <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                            selectedSemester === "All" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                        }`}>
                            {subjects.length}
                        </span>
                    </button>

                    {availableSemesters.map((sem) => {
                        const count = groupedSubjects[sem]?.length || 0;
                        const isCurrent = selectedSemester === sem;
                        return (
                            <button
                                key={sem}
                                onClick={() => setSelectedSemester(sem)}
                                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                    isCurrent
                                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                                }`}
                            >
                                <GraduationCap className="w-3.5 h-3.5" />
                                {sem}
                                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                                    isCurrent ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}

                    <button
                        onClick={() => {
                            const nextSemNum = availableSemesters.length + 1;
                            openAddModalForSemester(`Semester ${nextSemNum <= 8 ? nextSemNum : 'Custom'}`);
                        }}
                        className="px-3 py-2 text-xs font-medium rounded-lg text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 whitespace-nowrap border border-dashed border-primary/30"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Semester
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {subjects.length === 0 ? (
                <Card className="shadow-none border border-border">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                            <FolderKanban className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-1">No subjects created yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mb-6">
                            Start structuring your semester by adding your courses, credits, and syllabus topics.
                        </p>
                        <Button onClick={() => openAddModalForSemester("Semester 1")} size="sm" className="h-9">
                            <Plus className="w-4 h-4 mr-1.5" />
                            Create Semester 1 Subject
                        </Button>
                    </CardContent>
                </Card>
            ) : displayedSubjects.length === 0 ? (
                <Card className="shadow-none border border-dashed border-border">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 text-muted-foreground">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-semibold mb-1">No subjects in {selectedSemester}</h4>
                        <p className="text-xs text-muted-foreground mb-4">Add your coursework for this semester to track progress.</p>
                        <Button onClick={() => openAddModalForSemester(selectedSemester)} size="sm">
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Subject to {selectedSemester}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                /* Grouped by Semester View (When All is selected) OR Flat View (When single Sem is selected) */
                <div className="space-y-8">
                    {(selectedSemester === "All" ? availableSemesters : [selectedSemester]).map((semName) => {
                        const semSubjects = groupedSubjects[semName] || [];
                        if (semSubjects.length === 0) return null;
                        const semCredits = semSubjects.reduce((sum, s) => sum + (s.credits || 0), 0);

                        return (
                            <div key={semName} className="space-y-3">
                                {/* Semester Folder Header (Shown in All view) */}
                                {selectedSemester === "All" && (
                                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                        <div className="flex items-center gap-2">
                                            <FolderKanban className="w-4 h-4 text-primary" />
                                            <h3 className="font-bold text-sm text-foreground tracking-tight">{semName}</h3>
                                            <span className="text-xs text-muted-foreground">• {semSubjects.length} subjects • {semCredits} credits</span>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openAddModalForSemester(semName)}>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Subject to {semName}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setSemesterToDelete(semName)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Entire {semName}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}

                                {/* Subject Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {semSubjects.map((subject) => {
                                        const stats = subjectStats[subject._id] || {
                                            score: 0,
                                            scoreEntered: 0,
                                            attendance: 0,
                                            resourceCount: 0,
                                            nextDeadline: null
                                        };

                                        return (
                                            <Card
                                                key={subject._id}
                                                className="shadow-none border border-border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group overflow-hidden bg-card"
                                                onClick={() => handleCardClick(subject._id)}
                                            >
                                                <div className="h-1.5" style={{ backgroundColor: subject.color }} />
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                    {subject.name}
                                                                </h3>
                                                                {subject.semester && (
                                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                        {subject.semester}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {subject.code && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {subject.code} • {subject.credits} credits
                                                                </p>
                                                            )}
                                                            {subject.instructor && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {subject.instructor}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(subject); }}>
                                                                    <Pencil className="w-4 h-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(subject._id); }}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {/* Score Bar */}
                                                    <div className="mb-3">
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-xs text-muted-foreground font-medium">Weighted Score</span>
                                                            <span className="text-xs font-bold text-foreground">{stats.score.toFixed(1)}%</span>
                                                        </div>
                                                        <Progress value={stats.score} className="h-1.5" />
                                                    </div>

                                                    {/* Attendance & Resources */}
                                                    <div className="flex items-center justify-between text-xs pt-1">
                                                        <span className={getAttendanceColor(stats.attendance)}>
                                                            {stats.attendance.toFixed(0)}% attendance
                                                        </span>
                                                        <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                                                            <span>{stats.resourceCount} resources</span>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>

                                                    {/* Next Deadline */}
                                                    {stats.nextDeadline && (
                                                        <div className="text-xs mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                                                            <span className="text-muted-foreground truncate">
                                                                Next: <strong className="text-foreground font-medium">{stats.nextDeadline.title}</strong>
                                                            </span>
                                                            <span className="text-amber-500 font-medium whitespace-nowrap ml-2">
                                                                {stats.nextDeadline.daysUntil}d left
                                                            </span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Subject Dialog with Semester Selection */}
            <Dialog open={showModal} onOpenChange={(open) => {
                setShowModal(open);
                if (!open) {
                    setEditingSubject(null);
                    setCustomSemInput(false);
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingSubject ? "Edit Subject" : "Create New Subject"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Semester Selection */}
                        <div className="space-y-1.5">
                            <Label htmlFor="semester">Semester Folder *</Label>
                            {!customSemInput ? (
                                <div className="space-y-2">
                                    <select
                                        id="semester"
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formData.semester}
                                        onChange={(e) => {
                                            if (e.target.value === "__custom__") {
                                                setCustomSemInput(true);
                                                setFormData({ ...formData, semester: "" });
                                            } else {
                                                setFormData({ ...formData, semester: e.target.value });
                                            }
                                        }}
                                    >
                                        {DEFAULT_SEMESTERS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                        {availableSemesters
                                            .filter(s => !DEFAULT_SEMESTERS.includes(s) && s !== "Unassigned")
                                            .map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        <option value="__custom__">+ Enter Custom Semester Name...</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        required
                                        autoFocus
                                        placeholder="e.g. Summer 2026 or Sem 5"
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setCustomSemInput(false);
                                            setFormData({ ...formData, semester: "Semester 1" });
                                        }}
                                    >
                                        Presets
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="name">Subject Name *</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Computer Networks"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="code">Course Code</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., CS304"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="credits">Credits</Label>
                                <Input
                                    id="credits"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.credits}
                                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="instructor">Instructor (Optional)</Label>
                            <Input
                                id="instructor"
                                value={formData.instructor}
                                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                placeholder="e.g., Prof. Davis"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Theme Color</Label>
                            <div className="flex items-center gap-2">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: c })}
                                        className={`w-6 h-6 rounded-full transition-transform ${formData.color === c ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <Input
                                    type="color"
                                    className="w-8 h-8 p-0 border-0 rounded-full cursor-pointer ml-auto"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingSubject ? "Save Changes" : `Add to ${formData.semester || 'Semester'}`}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Semester Deletion Confirmation Modal */}
            <Dialog open={!!semesterToDelete} onOpenChange={(open) => !open && setSemesterToDelete(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <DialogTitle>Delete Entire {semesterToDelete}?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            Are you sure you want to delete <strong className="text-foreground">{semesterToDelete}</strong>?
                        </p>
                        <div className="p-3 bg-muted/60 rounded-lg text-xs space-y-1 border border-border">
                            <p className="font-semibold text-foreground">This permanent action will remove:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                                <li>All subjects under {semesterToDelete} ({groupedSubjects[semesterToDelete || '']?.length || 0} courses)</li>
                                <li>All recorded attendance and classes</li>
                                <li>All syllabus topics, notes, and study materials</li>
                                <li>All grades, score breakdowns, and deadlines</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter className="pt-3">
                        <Button
                            variant="outline"
                            onClick={() => setSemesterToDelete(null)}
                            disabled={deleteLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSemester}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? "Deleting..." : `Yes, Delete ${semesterToDelete}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default SubjectsList;
