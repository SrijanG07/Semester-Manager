import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/utils/api';
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

interface TopicsTabProps {
    subjectId: string;
}

const TopicsTab: React.FC<TopicsTabProps> = ({ subjectId }) => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddTopic, setShowAddTopic] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        status: 'not-started',
        notes: '',
    });

    useEffect(() => {
        fetchTopics();
    }, [subjectId]);

    const fetchTopics = async () => {
        try {
            const response = await api.get(`/subjects/${subjectId}/topics`);
            setTopics(response.data || []);
        } catch (error) {
            console.error('Failed to fetch topics');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/subjects/${subjectId}/topics`, formData);
            toast.success('Topic added!');
            setShowAddTopic(false);
            setFormData({ name: '', unit: '', status: 'not-started', notes: '' });
            fetchTopics();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add topic');
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

    const handleDelete = async (topicId: string) => {
        if (!confirm('Delete this topic?')) return;
        try {
            await api.delete(`/subjects/topics/${topicId}`);
            toast.success('Topic deleted!');
            fetchTopics();
        } catch (error) {
            toast.error('Failed to delete topic');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confident': return 'bg-green-100 text-green-800';
            case 'understood': return 'bg-blue-100 text-blue-800';
            case 'learning': return 'bg-yellow-100 text-yellow-800';
            case 'needs-practice': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confident': return '✅';
            case 'understood': return '👍';
            case 'learning': return '📖';
            case 'needs-practice': return '⚠️';
            default: return '⭕';
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Topics</CardTitle>
                <Dialog open={showAddTopic} onOpenChange={setShowAddTopic}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Topic
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Topic</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddTopic} className="space-y-4">
                            <div>
                                <Label>Topic Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Binary Search Trees"
                                    required
                                />
                            </div>
                            <div>
                                <Label>Unit/Chapter</Label>
                                <Input
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    placeholder="e.g., Unit 3"
                                />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
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
                            <div>
                                <Label>Notes</Label>
                                <Input
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any important notes..."
                                />
                            </div>
                            <Button type="submit" className="w-full">Add Topic</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {topics.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No topics yet</p>
                        <Button onClick={() => setShowAddTopic(true)}>Add Your First Topic</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topics.map((topic) => (
                            <div key={topic._id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold">{topic.name}</h4>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleDelete(topic._id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                                {topic.unit && (
                                    <p className="text-sm text-muted-foreground mb-2">Unit: {topic.unit}</p>
                                )}
                                <Badge className={`${getStatusColor(topic.status)} mb-3`} variant="secondary">
                                    {getStatusIcon(topic.status)} {topic.status.replace('-', ' ').toUpperCase()}
                                </Badge>
                                {topic.totalResources > 0 && (
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span>Resources</span>
                                            <span>{topic.completedResources}/{topic.totalResources}</span>
                                        </div>
                                        <Progress value={topic.completionRate} className="h-1" />
                                    </div>
                                )}
                                {topic.notes && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{topic.notes}</p>
                                )}
                                <Select
                                    value={topic.status}
                                    onValueChange={(value) => updateStatus(topic._id, value)}
                                >
                                    <SelectTrigger className="h-8 text-sm">
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
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TopicsTab;
