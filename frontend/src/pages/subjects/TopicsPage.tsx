import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

interface Topic {
    _id: string;
    name: string;
    unit?: string;
    status: string;
    notes?: string;
    totalResources: number;
    completedResources: number;
    completionRate: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    'confident': { label: 'Confident', variant: 'default', className: 'bg-success/10 text-success border-success/20 hover:bg-success/20' },
    'understood': { label: 'Understood', variant: 'default', className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' },
    'learning': { label: 'Learning', variant: 'default', className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20' },
    'needs-practice': { label: 'Needs Practice', variant: 'default', className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' },
    'not-started': { label: 'Not Started', variant: 'secondary', className: '' },
};

const TopicsPage: React.FC = () => {
    const { id: subjectId } = useParams();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        status: 'not-started',
        notes: '',
    });

    useEffect(() => {
        if (subjectId) fetchTopics();
    }, [subjectId]);

    const fetchTopics = async () => {
        try {
            const { data } = await api.get(`/subjects/${subjectId}/topics`);
            setTopics(data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load topics');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/subjects/${subjectId}/topics`, formData);
            toast.success('Topic created!');
            setShowModal(false);
            setFormData({ name: '', unit: '', status: 'not-started', notes: '' });
            fetchTopics();
        } catch (error) {
            toast.error('Failed to create topic');
        }
    };

    const updateStatus = async (topicId: string, status: string) => {
        try {
            await api.patch(`/subjects/topics/${topicId}/status`, { status });
            toast.success('Status updated!');
            fetchTopics();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const deleteTopic = async (topicId: string) => {
        if (!confirm('Delete this topic?')) return;
        try {
            await api.delete(`/subjects/topics/${topicId}`);
            toast.success('Deleted!');
            fetchTopics();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Topics" subtitle="Manage your study topics">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
                    ))}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Topics" subtitle="Manage your study topics">
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">
                    {topics.length} topic{topics.length !== 1 ? 's' : ''}
                </p>
                <Button size="sm" className="h-9" onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Topic
                </Button>
            </div>

            {topics.length === 0 ? (
                <Card className="shadow-none border border-border">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-muted-foreground mb-4">No topics yet. Add your first topic!</p>
                        <Button size="sm" onClick={() => setShowModal(true)}>Create Topic</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topics.map((topic) => {
                        const config = statusConfig[topic.status] || statusConfig['not-started'];
                        return (
                            <Card key={topic._id} className="shadow-none border border-border group">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-semibold text-foreground">{topic.name}</h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={() => deleteTopic(topic._id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>

                                    {topic.unit && (
                                        <p className="text-xs text-muted-foreground mb-2">Unit: {topic.unit}</p>
                                    )}

                                    <Badge variant={config.variant} className={`mb-3 text-[11px] ${config.className}`}>
                                        {config.label}
                                    </Badge>

                                    {topic.totalResources > 0 && (
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>Resources</span>
                                                <span>{topic.completedResources}/{topic.totalResources}</span>
                                            </div>
                                            <Progress value={topic.completionRate} className="h-1.5" />
                                        </div>
                                    )}

                                    {topic.notes && (
                                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{topic.notes}</p>
                                    )}

                                    <Select value={topic.status} onValueChange={(value) => updateStatus(topic._id, value)}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="not-started">Not Started</SelectItem>
                                            <SelectItem value="learning">Learning</SelectItem>
                                            <SelectItem value="needs-practice">Needs Practice</SelectItem>
                                            <SelectItem value="understood">Understood</SelectItem>
                                            <SelectItem value="confident">Confident</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Topic Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Topic</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Topic Name *</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Binary Search Trees"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Unit/Chapter</Label>
                            <Input
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                placeholder="e.g., Unit 3"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not-started">Not Started</SelectItem>
                                    <SelectItem value="learning">Learning</SelectItem>
                                    <SelectItem value="needs-practice">Needs Practice</SelectItem>
                                    <SelectItem value="understood">Understood</SelectItem>
                                    <SelectItem value="confident">Confident</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <textarea
                                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary resize-none"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any important notes..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                Create Topic
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default TopicsPage;
