import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Plus, BookOpen, MoreVertical, Pencil, Trash2, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
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
}

interface SubjectStats {
    score: number;
    scoreEntered: number;
    attendance: number;
    resourceCount: number;
    nextDeadline: { title: string; type: string; daysUntil: number } | null;
}

const SubjectsList = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStats>>({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        credits: 3,
        color: "#3b82f6",
        instructor: "",
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const response = await api.get("/subjects");
            setSubjects(response.data);
            // Fetch stats for each subject
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

                // Find next upcoming deadline
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSubject) {
                await api.put(`/subjects/${editingSubject._id}`, formData);
                toast.success("Subject updated successfully!");
            } else {
                await api.post("/subjects", formData);
                toast.success("Subject created successfully!");
            }
            setShowModal(false);
            setEditingSubject(null);
            setFormData({ name: "", code: "", credits: 3, color: "#3b82f6", instructor: "" });
            fetchSubjects();
        } catch (error) {
            toast.error(editingSubject ? "Failed to update subject" : "Failed to create subject");
        }
    };

    const handleEdit = (subject: Subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name,
            code: subject.code || "",
            credits: subject.credits || 3,
            color: subject.color || "#3b82f6",
            instructor: subject.instructor || "",
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

    const handleCardClick = (subjectId: string) => {
        navigate(`/subjects/${subjectId}`);
    };

    const getAttendanceColor = (attendance: number) => {
        if (attendance >= 75) return "text-green-600";
        if (attendance >= 60) return "text-orange-500";
        return "text-red-500";
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "bg-green-500";
        if (score >= 60) return "bg-blue-500";
        if (score >= 40) return "bg-yellow-500";
        return "bg-red-500";
    };

    if (loading) {
        return (
            <DashboardLayout title="Subjects" subtitle="Manage your courses">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading subjects...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Subjects" subtitle="Manage your courses">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">
                    {subjects.length} subjects • Spring 2025
                </p>
                <Dialog open={showModal} onOpenChange={(open) => {
                    setShowModal(open);
                    if (!open) {
                        setEditingSubject(null);
                        setFormData({ name: "", code: "", credits: 3, color: "#3b82f6", instructor: "" });
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Subject
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingSubject ? "Edit Subject" : "Create New Subject"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Subject Name *</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Data Structures & Algorithms"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="code">Subject Code</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g., CS201"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="credits">Credits</Label>
                                    <Input
                                        id="credits"
                                        type="number"
                                        min="1"
                                        max="6"
                                        value={formData.credits}
                                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="instructor">Instructor</Label>
                                <Input
                                    id="instructor"
                                    value={formData.instructor}
                                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                    placeholder="e.g., Dr. Sarah Johnson"
                                />
                            </div>
                            <div>
                                <Label htmlFor="color">Color</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        id="color"
                                        type="color"
                                        className="w-16 h-10 p-1 cursor-pointer"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    />
                                    <span className="text-sm text-muted-foreground">{formData.color}</span>
                                </div>
                            </div>
                            <Button type="submit" className="w-full">
                                {editingSubject ? "Update Subject" : "Create Subject"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {subjects.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No subjects yet</p>
                        <Button onClick={() => setShowModal(true)}>Create Your First Subject</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map((subject) => {
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
                                className="hover:shadow-lg transition-shadow cursor-pointer group"
                                onClick={() => handleCardClick(subject._id)}
                            >
                                <CardContent className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: subject.color }}
                                            />
                                            <div>
                                                <h3 className="font-semibold text-lg">{subject.name}</h3>
                                                {subject.code && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {subject.code} • {subject.credits} credits
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(subject); }}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(subject._id); }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Instructor */}
                                    {subject.instructor && (
                                        <p className="text-sm text-muted-foreground mb-4 ml-6">
                                            {subject.instructor}
                                        </p>
                                    )}

                                    {/* Score */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-blue-600 font-medium">Current Score</span>
                                            <span className="font-semibold">{stats.score.toFixed(1)}%</span>
                                        </div>
                                        <Progress
                                            value={stats.score}
                                            className="h-2"
                                        />
                                    </div>

                                    {/* Attendance & Resources */}
                                    <div className="flex items-center justify-between text-sm mb-4">
                                        <span className={`font-medium ${getAttendanceColor(stats.attendance)}`}>
                                            {stats.attendance.toFixed(0)}% attendance
                                        </span>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <span>{stats.resourceCount} resources</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {/* Next Deadline */}
                                    {stats.nextDeadline && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Next: </span>
                                            <span className="font-medium">{stats.nextDeadline.type}</span>
                                            <span className="text-muted-foreground"> - {stats.nextDeadline.daysUntil} days</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
};

export default SubjectsList;
