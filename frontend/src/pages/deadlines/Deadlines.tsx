import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '../../utils/api';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface Deadline {
    _id: string;
    subjectId: { _id: string; name: string; color: string };
    title: string;
    description?: string;
    type: string;
    dueDate: string;
    dueTime?: string;
    completed: boolean;
    priority: string;
}

const Deadlines: React.FC = () => {
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        subjectId: '',
        title: '',
        description: '',
        type: 'Assignment',
        dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        dueTime: '23:59',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [deadlinesRes, subjectsRes] = await Promise.all([
                api.get('/deadlines'),
                api.get('/subjects'),
            ]);
            setDeadlines(deadlinesRes.data);
            setSubjects(subjectsRes.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load deadlines');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/deadlines', formData);
            toast.success('Deadline created!');
            setShowModal(false);
            setFormData({
                subjectId: '',
                title: '',
                description: '',
                type: 'Assignment',
                dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
                dueTime: '23:59',
            });
            fetchData();
        } catch (error) {
            toast.error('Failed to create deadline');
        }
    };

    const toggleComplete = async (id: string) => {
        try {
            await api.patch(`/deadlines/${id}/complete`);
            toast.success('Status updated!');
            fetchData();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const deleteDeadline = async (id: string) => {
        if (!confirm('Delete this deadline?')) return;
        try {
            await api.delete(`/deadlines/${id}`);
            toast.success('Deleted!');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'overdue': return { className: 'bg-foreground text-background', label: 'OVERDUE' };
            case 'urgent': return { className: 'bg-destructive/10 text-destructive', label: 'URGENT' };
            case 'soon': return { className: 'bg-warning/10 text-warning', label: 'SOON' };
            default: return { className: 'bg-success/10 text-success', label: 'UPCOMING' };
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Deadlines" subtitle="Manage your upcoming deadlines">
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                    ))}
                </div>
            </DashboardLayout>
        );
    }

    const upcomingDeadlines = deadlines.filter(d => !d.completed);
    const completedDeadlines = deadlines.filter(d => d.completed);

    return (
        <DashboardLayout title="Deadlines" subtitle="Manage your upcoming deadlines">
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">
                    {upcomingDeadlines.length} upcoming • {completedDeadlines.length} completed
                </p>
                <Button size="sm" className="h-9" onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Deadline
                </Button>
            </div>

            {/* Upcoming Deadlines */}
            <Card className="shadow-none border border-border mb-4">
                <CardContent className="p-5">
                    <h2 className="font-semibold text-foreground mb-4">Upcoming ({upcomingDeadlines.length})</h2>
                    {upcomingDeadlines.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No upcoming deadlines. You're all caught up!</p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingDeadlines.map((deadline) => {
                                const badge = getPriorityBadge(deadline.priority);
                                return (
                                    <div key={deadline._id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div
                                            className="w-1 h-14 rounded-full mt-0.5 flex-shrink-0"
                                            style={{ backgroundColor: deadline.subjectId.color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0", badge.className)}>
                                                    {badge.label}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-0">
                                                    {deadline.type}
                                                </Badge>
                                            </div>
                                            <h3 className="font-medium text-foreground">{deadline.title}</h3>
                                            <p className="text-xs text-muted-foreground">{deadline.subjectId.name}</p>
                                            {deadline.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{deadline.description}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Due: {format(new Date(deadline.dueDate), 'MMM dd, yyyy')}
                                                {deadline.dueTime && ` at ${deadline.dueTime}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-1.5 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                                                onClick={() => toggleComplete(deadline._id)}
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => deleteDeadline(deadline._id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Completed Deadlines */}
            {completedDeadlines.length > 0 && (
                <Card className="shadow-none border border-border">
                    <CardContent className="p-5">
                        <h2 className="font-semibold text-foreground mb-4">Completed ({completedDeadlines.length})</h2>
                        <div className="space-y-2">
                            {completedDeadlines.map((deadline) => (
                                <div key={deadline._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-1 h-10 rounded-full"
                                            style={{ backgroundColor: deadline.subjectId.color }}
                                        />
                                        <div>
                                            <h3 className="text-sm font-medium text-foreground line-through">{deadline.title}</h3>
                                            <p className="text-xs text-muted-foreground">{deadline.subjectId.name}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteDeadline(deadline._id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create Deadline Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Deadline</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Subject *</Label>
                            <Select value={formData.subjectId} onValueChange={(value) => setFormData({ ...formData, subjectId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subject..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject._id} value={subject._id}>{subject.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Title *</Label>
                            <Input
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Assignment 3"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Assignment">Assignment</SelectItem>
                                    <SelectItem value="Quiz">Quiz</SelectItem>
                                    <SelectItem value="Midterm">Midterm</SelectItem>
                                    <SelectItem value="Endterm">Endterm</SelectItem>
                                    <SelectItem value="Project">Project</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Due Date *</Label>
                                <Input
                                    type="date"
                                    required
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Time</Label>
                                <Input
                                    type="time"
                                    value={formData.dueTime}
                                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <textarea
                                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary resize-none"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Additional details..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                Create Deadline
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default Deadlines;
