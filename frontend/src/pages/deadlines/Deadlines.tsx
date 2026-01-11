import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'overdue': return 'bg-black text-white';
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'soon': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'overdue': return '⚫';
            case 'urgent': return '🔴';
            case 'soon': return '🟡';
            default: return '🟢';
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-gray-600">Loading deadlines...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const upcomingDeadlines = deadlines.filter(d => !d.completed);
    const completedDeadlines = deadlines.filter(d => d.completed);

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">📅 Deadlines</h1>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
                        <span>+</span> Add Deadline
                    </button>
                </div>

                {/* Upcoming Deadlines */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming ({upcomingDeadlines.length})</h2>
                    {upcomingDeadlines.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">No upcoming deadlines. You're all caught up! 🎉</p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingDeadlines.map((deadline) => (
                                <div key={deadline._id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div
                                            className="w-1 h-16 rounded-full mt-1"
                                            style={{ backgroundColor: deadline.subjectId.color }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(deadline.priority)}`}>
                                                    {getPriorityIcon(deadline.priority)} {deadline.priority.toUpperCase()}
                                                </span>
                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                    {deadline.type}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-lg">{deadline.title}</h3>
                                            <p className="text-sm text-gray-600 mb-1">{deadline.subjectId.name}</p>
                                            {deadline.description && (
                                                <p className="text-sm text-gray-500">{deadline.description}</p>
                                            )}
                                            <p className="text-sm text-gray-700 mt-2">
                                                📅 Due: {format(new Date(deadline.dueDate), 'MMM dd, yyyy')}
                                                {deadline.dueTime && ` at ${deadline.dueTime}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleComplete(deadline._id)}
                                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
                                        >
                                            ✓ Complete
                                        </button>
                                        <button
                                            onClick={() => deleteDeadline(deadline._id)}
                                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Deadlines */}
                {completedDeadlines.length > 0 && (
                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Completed ({completedDeadlines.length})</h2>
                        <div className="space-y-2">
                            {completedDeadlines.map((deadline) => (
                                <div key={deadline._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-1 h-12 rounded-full"
                                            style={{ backgroundColor: deadline.subjectId.color }}
                                        />
                                        <div>
                                            <h3 className="font-medium text-gray-900 line-through">{deadline.title}</h3>
                                            <p className="text-sm text-gray-600">{deadline.subjectId.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteDeadline(deadline._id)}
                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Create Deadline Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Create Deadline</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                                    <select
                                        required
                                        className="input"
                                        value={formData.subjectId}
                                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                    >
                                        <option value="">Select subject...</option>
                                        {subjects.map((subject) => (
                                            <option key={subject._id} value={subject._id}>{subject.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Assignment 3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                    <select
                                        className="input"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="Assignment">Assignment</option>
                                        <option value="Quiz">Quiz</option>
                                        <option value="Midterm">Midterm</option>
                                        <option value="Endterm">Endterm</option>
                                        <option value="Project">Project</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                        <input
                                            type="date"
                                            required
                                            className="input"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                        <input
                                            type="time"
                                            className="input"
                                            value={formData.dueTime}
                                            onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Additional details..."
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 btn btn-primary">
                                        Create Deadline
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

export default Deadlines;
