import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sparkles,
    Brain,
    HelpCircle,
    Layers,
    Clock,
    Trophy,
    ChevronRight,
    FileText,
    Lightbulb,
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import QuizDialog from '@/components/ai/QuizDialog';
import FlashcardDialog from '@/components/ai/FlashcardDialog';
import AiOutputSheet from '@/components/ai/AiOutputSheet';

interface AiOutput {
    _id: string;
    resourceId: any;
    type: 'summary' | 'explanation' | 'quiz' | 'flashcards';
    content: any;
    modelUsed: string;
    createdAt: string;
    sourceOutputId?: string;
}

interface AiStudyTabProps {
    subjectId: string;
}

const AiStudyTab: React.FC<AiStudyTabProps> = ({ subjectId }) => {
    const [outputs, setOutputs] = useState<AiOutput[]>([]);
    const [loading, setLoading] = useState(true);
    const [dueCount, setDueCount] = useState(0);

    // Dialog state
    const [quizDialogOpen, setQuizDialogOpen] = useState(false);
    const [quizData, setQuizData] = useState<AiOutput | null>(null);
    const [flashcardDialogOpen, setFlashcardDialogOpen] = useState(false);
    const [flashcardData, setFlashcardData] = useState<AiOutput | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetResourceId, setSheetResourceId] = useState('');
    const [sheetResourceTitle, setSheetResourceTitle] = useState('');
    const [sheetType, setSheetType] = useState<'summary' | 'explanation'>('summary');

    useEffect(() => {
        fetchOutputs();
        fetchDueCount();
    }, [subjectId]);

    const fetchOutputs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/ai/subject/${subjectId}`);
            setOutputs(res.data || []);
        } catch (err) {
            console.error('Failed to fetch AI outputs');
        } finally {
            setLoading(false);
        }
    };

    const fetchDueCount = async () => {
        try {
            const res = await api.get('/ai/flashcards-due');
            setDueCount(res.data.dueCount || 0);
        } catch (err) {
            // Non-critical
        }
    };

    const summaries = outputs.filter((o) => o.type === 'summary');
    const explanations = outputs.filter((o) => o.type === 'explanation');
    const quizzes = outputs.filter((o) => o.type === 'quiz');
    const flashcards = outputs.filter((o) => o.type === 'flashcards');

    const handleOpenOutput = (output: AiOutput) => {
        if (output.type === 'quiz') {
            setQuizData(output);
            setQuizDialogOpen(true);
        } else if (output.type === 'flashcards') {
            setFlashcardData(output);
            setFlashcardDialogOpen(true);
        } else {
            // summary or explanation
            const resourceId = typeof output.resourceId === 'object' ? output.resourceId._id : output.resourceId;
            const resourceTitle = typeof output.resourceId === 'object' ? output.resourceId.title : 'Resource';
            setSheetResourceId(resourceId);
            setSheetResourceTitle(resourceTitle);
            setSheetType(output.type as 'summary' | 'explanation');
            setSheetOpen(true);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'summary':
                return <Brain className="w-4 h-4" />;
            case 'explanation':
                return <Lightbulb className="w-4 h-4" />;
            case 'quiz':
                return <HelpCircle className="w-4 h-4" />;
            case 'flashcards':
                return <Layers className="w-4 h-4" />;
            default:
                return <Sparkles className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'summary':
                return 'bg-blue-500/10 text-blue-500';
            case 'explanation':
                return 'bg-amber-500/10 text-amber-500';
            case 'quiz':
                return 'bg-purple-500/10 text-purple-500';
            case 'flashcards':
                return 'bg-green-500/10 text-green-500';
            default:
                return 'bg-primary/10 text-primary';
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Loading AI study materials...
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="shadow-none border">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Brain className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">
                                    {summaries.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Summaries
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-none border">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <HelpCircle className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">
                                    {quizzes.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Quizzes
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-none border">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">
                                    {flashcards.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Flashcard Sets
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-none border">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">
                                    {dueCount}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Cards Due
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* All AI Outputs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Generated Study Materials
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {outputs.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">
                                    No AI content yet
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    Go to the Resources tab and click the{' '}
                                    <Brain className="w-4 h-4 inline" /> or{' '}
                                    <Lightbulb className="w-4 h-4 inline" />{' '}
                                    icon on any uploaded PDF to generate summaries,
                                    quizzes, and flashcards.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {outputs.map((output) => (
                                    <div
                                        key={output._id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                                        onClick={() => handleOpenOutput(output)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center ${getTypeColor(output.type)}`}
                                            >
                                                {getTypeIcon(output.type)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium capitalize">
                                                        {output.type}
                                                    </span>
                                                    {typeof output.resourceId ===
                                                        'object' && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                            {output.resourceId
                                                                ?.title ||
                                                                'Resource'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            output.createdAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        •
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {output.modelUsed}
                                                    </span>
                                                    {output.type === 'quiz' &&
                                                        output.content
                                                            ?.questions && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs h-5"
                                                            >
                                                                {
                                                                    output
                                                                        .content
                                                                        .questions
                                                                        .length
                                                                }{' '}
                                                                questions
                                                            </Badge>
                                                        )}
                                                    {output.type ===
                                                        'flashcards' &&
                                                        output.content
                                                            ?.cards && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs h-5"
                                                            >
                                                                {
                                                                    output
                                                                        .content
                                                                        .cards
                                                                        .length
                                                                }{' '}
                                                                cards
                                                            </Badge>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <AiOutputSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                resourceId={sheetResourceId}
                resourceTitle={sheetResourceTitle}
                initialType={sheetType}
                onOpenQuiz={(output) => {
                    setQuizData(output);
                    setQuizDialogOpen(true);
                }}
                onOpenFlashcards={(output) => {
                    setFlashcardData(output);
                    setFlashcardDialogOpen(true);
                }}
            />

            <QuizDialog
                open={quizDialogOpen}
                onOpenChange={setQuizDialogOpen}
                quizData={quizData}
            />

            <FlashcardDialog
                open={flashcardDialogOpen}
                onOpenChange={setFlashcardDialogOpen}
                flashcardData={flashcardData}
            />
        </>
    );
};

export default AiStudyTab;
