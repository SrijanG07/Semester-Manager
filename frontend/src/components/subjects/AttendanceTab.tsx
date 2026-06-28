import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

interface AttendanceStats {
    percentage: number;
    present: number;
    absent: number;
    late: number;
    total: number;
}

interface AttendanceTabProps {
    subjectId: string;
    stats: AttendanceStats;
    onUpdate: () => void;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ subjectId, stats, onUpdate }) => {
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        status: 'present' as 'present' | 'absent' | 'late',
    });
    const [bulkPresent, setBulkPresent] = useState('');
    const [bulkTotal, setBulkTotal] = useState('');
    const [showBulkEntry, setShowBulkEntry] = useState(false);

    const handleMarkAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Use the sync endpoint with single-entry data
            await api.post(`/subjects/${subjectId}/attendance`, formData);
            toast.success('Attendance marked!');
            setShowManualEntry(false);
            setFormData({ date: new Date().toISOString().split('T')[0], status: 'present' });
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to mark attendance');
        }
    };

    const handleBulkEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        const present = parseInt(bulkPresent);
        const total = parseInt(bulkTotal);
        if (isNaN(present) || isNaN(total) || present < 0 || total <= 0 || present > total) {
            toast.error('Invalid values. Present must be between 0 and Total.');
            return;
        }
        try {
            // Get subject name from the API to create sync data
            const subjectRes = await api.get(`/subjects/${subjectId}`);
            const subjectName = subjectRes.data.name;

            await api.post('/subjects/attendance/sync', {
                attendanceData: {
                    [subjectName]: { attended: present, total: total, missedDates: [] }
                }
            });
            toast.success(`Attendance set: ${present}/${total}`);
            setShowBulkEntry(false);
            setBulkPresent('');
            setBulkTotal('');
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update attendance');
        }
    };

    const classesNeededFor75 = () => {
        if (stats.percentage >= 75) return 0;
        const totalClasses = stats.total;
        const presentClasses = stats.present + stats.late;
        const needed = Math.ceil(3 * totalClasses - 4 * presentClasses);
        return Math.max(0, needed);
    };

    const classesCanSkip = () => {
        if (stats.percentage < 75) return 0;
        const totalClasses = stats.total;
        const presentClasses = stats.present + stats.late;
        const canSkip = Math.floor((presentClasses / 0.75) - totalClasses);
        return Math.max(0, canSkip);
    };

    const classesNeeded = classesNeededFor75();
    const skippable = classesCanSkip();

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Summary */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Attendance Summary</CardTitle>
                        <div className="flex gap-2">
                            {/* Bulk Entry Button */}
                            <Dialog open={showBulkEntry} onOpenChange={setShowBulkEntry}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        Set Count
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Set Attendance Count</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleBulkEntry} className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Enter your total classes attended and total classes held.
                                            This will replace existing attendance records for this subject.
                                        </p>
                                        <div>
                                            <Label>Classes Attended</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={bulkPresent}
                                                onChange={(e) => setBulkPresent(e.target.value)}
                                                placeholder="e.g., 25"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Total Classes Held</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={bulkTotal}
                                                onChange={(e) => setBulkTotal(e.target.value)}
                                                placeholder="e.g., 30"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" className="w-full">Update Attendance</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Manual Single Entry Button */}
                            <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="w-4 h-4 mr-1" />
                                        +1
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Mark Attendance</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleMarkAttendance} className="space-y-4">
                                        <div>
                                            <Label>Date</Label>
                                            <input
                                                type="date"
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value: 'present' | 'absent' | 'late') =>
                                                    setFormData({ ...formData, status: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="present">Present</SelectItem>
                                                    <SelectItem value="absent">Absent</SelectItem>
                                                    <SelectItem value="late">Late</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="submit" className="w-full">Mark Attendance</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground">Current Attendance</span>
                                <span className="font-bold text-lg">{stats.percentage.toFixed(1)}%</span>
                            </div>
                            <Progress
                                value={stats.percentage}
                                className="h-3"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                                <p className="text-sm text-muted-foreground">Present</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-red-500">{stats.absent}</p>
                                <p className="text-sm text-muted-foreground">Absent</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-orange-500">{stats.late}</p>
                                <p className="text-sm text-muted-foreground">Late</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t text-center">
                            <p className="text-sm text-muted-foreground">Total Classes</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 75% Calculator */}
                <Card>
                    <CardHeader>
                        <CardTitle>75% Calculator</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        {stats.total === 0 ? (
                            <div className="text-center">
                                <p className="text-4xl mb-2">📊</p>
                                <p className="text-muted-foreground">
                                     No attendance data yet. Use <strong>Set Count</strong> or mark attendance manually.
                                </p>
                            </div>
                        ) : stats.percentage >= 75 ? (
                            <>
                                <p className="text-muted-foreground mb-2">
                                    Classes you can safely skip:
                                </p>
                                <p className="text-5xl font-bold text-green-600 mb-2">
                                    {skippable}
                                </p>
                                <p className="text-sm text-green-600">
                                    ✅ You're above 75%! Keep it up.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-muted-foreground mb-2">
                                    Classes needed to reach 75%:
                                </p>
                                <p className="text-5xl font-bold text-orange-500 mb-2">
                                    {classesNeeded}
                                </p>
                                <p className="text-sm text-orange-500">
                                    ⚠️ Attend {classesNeeded} more class{classesNeeded > 1 ? 'es' : ''} consecutively
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AttendanceTab;
