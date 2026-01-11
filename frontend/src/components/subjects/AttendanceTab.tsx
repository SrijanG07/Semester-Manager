import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    const [showMarkAttendance, setShowMarkAttendance] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        status: 'present' as 'present' | 'absent' | 'late',
    });

    const handleMarkAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/subjects/${subjectId}/attendance`, formData);
            toast.success('Attendance marked!');
            setShowMarkAttendance(false);
            setFormData({ date: new Date().toISOString().split('T')[0], status: 'present' });
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to mark attendance');
        }
    };

    const getAttendanceColor = () => {
        if (stats.percentage >= 75) return 'bg-green-500';
        if (stats.percentage >= 60) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const classesNeededFor75 = () => {
        if (stats.percentage >= 75) return 0;
        const totalClasses = stats.total;
        const presentClasses = stats.present + stats.late; // Late counts as attended
        // (present + x) / (total + x) >= 0.75
        // present + x >= 0.75 * (total + x)
        // present + x >= 0.75 * total + 0.75 * x
        // 0.25 * x >= 0.75 * total - present
        // x >= (0.75 * total - present) / 0.25
        // x >= 3 * total - 4 * present
        const needed = Math.ceil(3 * totalClasses - 4 * presentClasses);
        return Math.max(0, needed);
    };

    const classesNeeded = classesNeededFor75();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Summary */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Attendance Summary</CardTitle>
                    <Dialog open={showMarkAttendance} onOpenChange={setShowMarkAttendance}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Mark Attendance
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
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-muted-foreground">Current Attendance</span>
                            <span className="font-bold text-lg">{stats.percentage.toFixed(0)}%</span>
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
                </CardContent>
            </Card>

            {/* 75% Calculator */}
            <Card>
                <CardHeader>
                    <CardTitle>75% Calculator</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground mb-4">
                        Classes needed to reach 75% attendance:
                    </p>
                    <p className={`text-5xl font-bold ${classesNeeded === 0 ? 'text-green-600' : 'text-orange-500'}`}>
                        {classesNeeded}
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        {classesNeeded === 0
                            ? "You're above the threshold!"
                            : `Attend ${classesNeeded} more class${classesNeeded > 1 ? 'es' : ''} consecutively`
                        }
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceTab;
