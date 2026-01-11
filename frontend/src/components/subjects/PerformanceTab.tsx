import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

interface GradingComponent {
    name: string;
    weightage: number;
    maxMarks?: number;
}

interface Score {
    _id: string;
    componentName: string;
    obtained: number;
    max: number;
}

interface PerformanceTabProps {
    subjectId: string;
    onUpdate: () => void;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ subjectId, onUpdate }) => {
    const [gradingComponents, setGradingComponents] = useState<GradingComponent[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddScore, setShowAddScore] = useState(false);
    const [showSetupGrading, setShowSetupGrading] = useState(false);
    const [scoreForm, setScoreForm] = useState({
        componentName: '',
        obtained: 0,
        max: 100,
    });
    const [gradingForm, setGradingForm] = useState<GradingComponent[]>([
        { name: 'Quizzes', weightage: 15, maxMarks: 100 },
        { name: 'Assignments', weightage: 20, maxMarks: 100 },
        { name: 'Midterm', weightage: 25, maxMarks: 100 },
        { name: 'Endterm', weightage: 40, maxMarks: 100 },
    ]);

    useEffect(() => {
        fetchData();
    }, [subjectId]);

    const fetchData = async () => {
        try {
            const [gradingRes, scoresRes] = await Promise.allSettled([
                api.get(`/subjects/${subjectId}/grading`),
                api.get(`/subjects/${subjectId}/scores`),
            ]);

            if (gradingRes.status === 'fulfilled' && gradingRes.value.data?.components) {
                setGradingComponents(gradingRes.value.data.components);
                setGradingForm(gradingRes.value.data.components);
            }
            if (scoresRes.status === 'fulfilled') {
                setScores(scoresRes.value.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch grading data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddScore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/subjects/${subjectId}/scores`, scoreForm);
            toast.success('Score added!');
            setShowAddScore(false);
            setScoreForm({ componentName: '', obtained: 0, max: 100 });
            fetchData();
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add score');
        }
    };

    const handleDeleteScore = async (scoreId: string) => {
        if (!confirm('Delete this score?')) return;
        try {
            await api.delete(`/subjects/scores/${scoreId}`);
            toast.success('Score deleted!');
            fetchData();
            onUpdate();
        } catch (error) {
            toast.error('Failed to delete score');
        }
    };

    const handleSetupGrading = async (e: React.FormEvent) => {
        e.preventDefault();
        const total = gradingForm.reduce((sum, c) => sum + c.weightage, 0);
        if (Math.abs(total - 100) > 0.01) {
            toast.error(`Weightages must total 100%, currently ${total}%`);
            return;
        }
        try {
            await api.post(`/subjects/${subjectId}/grading`, { components: gradingForm });
            toast.success('Grading scheme saved!');
            setShowSetupGrading(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save grading scheme');
        }
    };

    const addGradingComponent = () => {
        setGradingForm([...gradingForm, { name: '', weightage: 0, maxMarks: 100 }]);
    };

    const updateGradingComponent = (index: number, field: string, value: any) => {
        const updated = [...gradingForm];
        updated[index] = { ...updated[index], [field]: value };
        setGradingForm(updated);
    };

    const removeGradingComponent = (index: number) => {
        setGradingForm(gradingForm.filter((_, i) => i !== index));
    };

    const getScoreForComponent = (componentName: string) => {
        return scores.find(s => s.componentName === componentName);
    };

    const calculateWeightedScore = (component: GradingComponent) => {
        const score = getScoreForComponent(component.name);
        if (!score) return null;
        const percentage = (score.obtained / score.max) * 100;
        const weighted = (percentage * component.weightage) / 100;
        return { percentage, weighted };
    };

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Grading Components</CardTitle>
                <div className="flex gap-2">
                    <Dialog open={showSetupGrading} onOpenChange={setShowSetupGrading}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Pencil className="w-4 h-4 mr-2" />
                                Setup Grading
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Setup Grading Scheme</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSetupGrading} className="space-y-4">
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {gradingForm.map((comp, index) => (
                                        <div key={index} className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <Label>Component Name</Label>
                                                <Input
                                                    value={comp.name}
                                                    onChange={(e) => updateGradingComponent(index, 'name', e.target.value)}
                                                    placeholder="e.g., Quizzes"
                                                    required
                                                />
                                            </div>
                                            <div className="w-24">
                                                <Label>Weight %</Label>
                                                <Input
                                                    type="number"
                                                    value={comp.weightage}
                                                    onChange={(e) => updateGradingComponent(index, 'weightage', parseFloat(e.target.value) || 0)}
                                                    min={0}
                                                    max={100}
                                                    required
                                                />
                                            </div>
                                            <div className="w-24">
                                                <Label>Max Marks</Label>
                                                <Input
                                                    type="number"
                                                    value={comp.maxMarks || 100}
                                                    onChange={(e) => updateGradingComponent(index, 'maxMarks', parseInt(e.target.value) || 100)}
                                                    min={1}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeGradingComponent(index)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <Button type="button" variant="outline" onClick={addGradingComponent}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Component
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Total: {gradingForm.reduce((sum, c) => sum + c.weightage, 0)}%
                                    </span>
                                </div>
                                <Button type="submit" className="w-full">Save Grading Scheme</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={showAddScore} onOpenChange={setShowAddScore}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Score
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Score</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddScore} className="space-y-4">
                                <div>
                                    <Label>Component</Label>
                                    <Select
                                        value={scoreForm.componentName}
                                        onValueChange={(value) => {
                                            const comp = gradingComponents.find(c => c.name === value);
                                            setScoreForm({
                                                ...scoreForm,
                                                componentName: value,
                                                max: comp?.maxMarks || 100
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select component" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gradingComponents.map((comp) => (
                                                <SelectItem key={comp.name} value={comp.name}>
                                                    {comp.name} ({comp.weightage}%)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Score Obtained</Label>
                                        <Input
                                            type="number"
                                            value={scoreForm.obtained}
                                            onChange={(e) => setScoreForm({ ...scoreForm, obtained: parseFloat(e.target.value) || 0 })}
                                            min={0}
                                            max={scoreForm.max}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Maximum Score</Label>
                                        <Input
                                            type="number"
                                            value={scoreForm.max}
                                            onChange={(e) => setScoreForm({ ...scoreForm, max: parseFloat(e.target.value) || 100 })}
                                            min={1}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Add Score</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {gradingComponents.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No grading scheme set up yet</p>
                        <Button onClick={() => setShowSetupGrading(true)}>Setup Grading Scheme</Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Component</TableHead>
                                <TableHead className="text-center">Weightage</TableHead>
                                <TableHead className="text-center">Score</TableHead>
                                <TableHead className="text-center">Percentage</TableHead>
                                <TableHead className="text-right">Weighted</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gradingComponents.map((component) => {
                                const score = getScoreForComponent(component.name);
                                const calculated = calculateWeightedScore(component);
                                return (
                                    <TableRow key={component.name}>
                                        <TableCell className="font-medium">{component.name}</TableCell>
                                        <TableCell className="text-center">{component.weightage}%</TableCell>
                                        <TableCell className="text-center">
                                            {score ? `${score.obtained}/${score.max}` : '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {calculated ? `${calculated.percentage.toFixed(1)}%` : '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {calculated ? `${calculated.weighted.toFixed(2)}%` : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {score && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDeleteScore(score._id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default PerformanceTab;
