import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Trash2, Check } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Deadline {
    _id: string;
    title: string;
    description?: string;
    type: 'Assignment' | 'Quiz' | 'Midterm' | 'Endterm' | 'Project';
    dueDate: string;
    completed: boolean;
    priority: string;
}

interface DeadlinesTabProps {
    subjectId: string;
}

const DeadlinesTab: React.FC<DeadlinesTabProps> = ({ subjectId }) => {
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDeadline, setShowAddDeadline] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Assignment' as Deadline['type'],
        dueDate: '',
    });

    useEffect(() => {
        fetchDeadlines();
    }, [subjectId]);

    const fetchDeadlines = async () => {
        try {
            const response = await api.get(`/deadlines?subjectId=${subjectId}`);
            setDeadlines(response.data || []);
        } catch (error) {
            console.error('Failed to fetch deadlines');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDeadline = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/deadlines', {
                ...formData,
                subjectId,
            });
            toast.success('Deadline added!');
            setShowAddDeadline(false);
            setFormData({ title: '', description: '', type: 'Assignment', dueDate: '' });
            fetchDeadlines();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add deadline');
        }
    };

    const toggleComplete = async (deadlineId: string) => {
        try {
            await api.patch(`/deadlines/${deadlineId}/complete`);
            fetchDeadlines();
        } catch (error) {
            toast.error('Failed to update deadline');
        }
    };

    const handleDelete = async (deadlineId: string) => {
        if (!confirm('Delete this deadline?')) return;
        try {
            await api.delete(`/deadlines/${deadlineId}`);
            toast.success('Deadline deleted!');
            fetchDeadlines();
        } catch (error) {
            toast.error('Failed to delete deadline');
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'overdue': return 'bg-red-500';
            case 'urgent': return 'bg-orange-500';
            case 'soon': return 'bg-yellow-500';
            default: return 'bg-blue-500';
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Deadlines</CardTitle>
                <Dialog open={showAddDeadline} onOpenChange={setShowAddDeadline}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Deadline
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Deadline</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddDeadline} className="space-y-4">
                            <div>
                                <Label>Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Quiz 3"
                                    required
                                />
                            </div>
                            <div>
                                <Label>Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: Deadline['type']) => setFormData({ ...formData, type: value })}
                                >
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
                            <div>
                                <Label>Due Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Description (optional)</Label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Additional details..."
                                />
                            </div>
                            <Button type="submit" className="w-full">Add Deadline</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {deadlines.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No deadlines yet</p>
                        <Button onClick={() => setShowAddDeadline(true)}>Add Your First Deadline</Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deadlines.map((deadline) => (
                            <div
                                key={deadline._id}
                                className={`flex items-center justify-between p-4 border rounded-lg ${deadline.completed ? 'opacity-60 bg-muted/30' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className={`font-medium ${deadline.completed ? 'line-through' : ''}`}>
                                            {deadline.title}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">{deadline.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={`${getPriorityColor(deadline.priority)} text-white`}>
                                        {format(new Date(deadline.dueDate), 'MMM d, yyyy')}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => toggleComplete(deadline._id)}
                                    >
                                        <Check className={`w-4 h-4 ${deadline.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDelete(deadline._id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DeadlinesTab;
