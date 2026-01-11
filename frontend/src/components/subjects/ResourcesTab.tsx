import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, ExternalLink, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

interface Resource {
    _id: string;
    title: string;
    type: 'PYQ' | 'Book' | 'Class Notes' | 'Personal Notes';
    fileUrl?: string;
    externalLink?: string;
    completed: boolean;
}

interface ResourcesTabProps {
    subjectId: string;
    onUpdate: () => void;
}

const ResourcesTab: React.FC<ResourcesTabProps> = ({ subjectId, onUpdate }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddResource, setShowAddResource] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Class Notes' as Resource['type'],
        externalLink: '',
    });
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchResources();
    }, [subjectId]);

    const fetchResources = async () => {
        try {
            const response = await api.get(`/subjects/${subjectId}/resources`);
            setResources(response.data || []);
        } catch (error) {
            console.error('Failed to fetch resources');
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            let fileUrl = '';

            // Upload file if present
            if (file) {
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);
                const uploadRes = await api.post('/subjects/upload', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                fileUrl = uploadRes.data.url;
            }

            await api.post(`/subjects/${subjectId}/resources`, {
                ...formData,
                fileUrl: fileUrl || undefined,
            });

            toast.success('Resource added!');
            setShowAddResource(false);
            setFormData({ title: '', type: 'Class Notes', externalLink: '' });
            setFile(null);
            fetchResources();
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add resource');
        } finally {
            setUploading(false);
        }
    };

    const toggleCompletion = async (resourceId: string) => {
        try {
            await api.patch(`/subjects/resources/${resourceId}/complete`);
            fetchResources();
            onUpdate();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (resourceId: string) => {
        if (!confirm('Delete this resource?')) return;
        try {
            await api.delete(`/subjects/resources/${resourceId}`);
            toast.success('Resource deleted!');
            fetchResources();
            onUpdate();
        } catch (error) {
            toast.error('Failed to delete resource');
        }
    };

    const openResource = (resource: Resource) => {
        const url = resource.fileUrl || resource.externalLink;
        if (url) {
            window.open(url, '_blank');
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Resources</CardTitle>
                <Dialog open={showAddResource} onOpenChange={setShowAddResource}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Resource
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Resource</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddResource} className="space-y-4">
                            <div>
                                <Label>Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Linked List Notes"
                                    required
                                />
                            </div>
                            <div>
                                <Label>Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: Resource['type']) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Class Notes">Class Notes</SelectItem>
                                        <SelectItem value="PYQ">PYQ</SelectItem>
                                        <SelectItem value="Book">Book</SelectItem>
                                        <SelectItem value="Personal Notes">Personal Notes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>External Link (optional)</Label>
                                <Input
                                    value={formData.externalLink}
                                    onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                                    placeholder="https://..."
                                    type="url"
                                />
                            </div>
                            <div>
                                <Label>Upload File (optional)</Label>
                                <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Supports PDF, DOC, PPT, images
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Add Resource'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {resources.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No resources yet</p>
                        <Button onClick={() => setShowAddResource(true)}>Add Your First Resource</Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {resources.map((resource) => (
                            <div
                                key={resource._id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{resource.title}</h4>
                                            {(resource.fileUrl || resource.externalLink) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => openResource(resource)}
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{resource.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={resource.completed ? "default" : "secondary"}
                                        className="cursor-pointer"
                                        onClick={() => toggleCompletion(resource._id)}
                                    >
                                        {resource.completed ? 'Completed' : 'Pending'}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDelete(resource._id)}
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

export default ResourcesTab;
