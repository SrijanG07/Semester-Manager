import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

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

const TopicsPage: React.FC = () => {
    const { subjectId } = useParams();
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
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-gray-600">Loading topics...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">📚 Topics</h1>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        + Add Topic
                    </button>
                </div>

                {topics.length === 0 ? (
                    <div className="text-center card py-12">
                        <p className="text-gray-600 mb-4">No topics yet. Add your first topic!</p>
                        <button onClick={() => setShowModal(true)} className="btn btn-primary">
                            Create Topic
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topics.map((topic) => (
                            <div key={topic._id} className="card">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-bold text-gray-900">{topic.name}</h3>
                                    <button
                                        onClick={() => deleteTopic(topic._id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {topic.unit && (
                                    <p className="text-sm text-gray-600 mb-2">Unit: {topic.unit}</p>
                                )}

                                <div className="mb-4">
                                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(topic.status)}`}>
                                        {getStatusIcon(topic.status)} {topic.status.replace('-', ' ').toUpperCase()}
                                    </span>
                                </div>

                                {topic.totalResources > 0 && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                                            <span>Resources Completed</span>
                                            <span>{topic.completedResources}/{topic.totalResources}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${topic.completionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {topic.notes && (
                                    <p className="text-sm text-gray-600 mb-4">{topic.notes}</p>
                                )}

                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 input text-sm py-1"
                                        value={topic.status}
                                        onChange={(e) => updateStatus(topic._id, e.target.value)}
                                    >
                                        <option value="not-started">Not Started</option>
                                        <option value="learning">Learning</option>
                                        <option value="needs-practice">Needs Practice</option>
                                        <option value="understood">Understood</option>
                                        <option value="confident">Confident</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Topic Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="card max-w-md w-full">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Create Topic</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Binary Search Trees"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit/Chapter</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="e.g., Unit 3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="input"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="not-started">Not Started</option>
                                        <option value="learning">Learning</option>
                                        <option value="needs-practice">Needs Practice</option>
                                        <option value="understood">Understood</option>
                                        <option value="confident">Confident</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Any important notes..."
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 btn btn-primary">
                                        Create Topic
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TopicsPage;
