import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Sparkles,
    Brain,
    HelpCircle,
    Layers,
    RefreshCw,
    AlertTriangle,
    Clock,
    BookOpen,
    Lightbulb,
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

interface AiOutput {
    _id: string;
    resourceId: string;
    type: 'summary' | 'explanation' | 'quiz' | 'flashcards';
    content: any;
    modelUsed: string;
    createdAt: string;
    sourceOutputId?: string;
}

interface AiOutputSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resourceId: string;
    resourceTitle: string;
    initialType: 'summary' | 'explanation';
    onOpenQuiz: (output: AiOutput) => void;
    onOpenFlashcards: (output: AiOutput) => void;
}

const AiOutputSheet: React.FC<AiOutputSheetProps> = ({
    open,
    onOpenChange,
    resourceId,
    resourceTitle,
    initialType,
    onOpenQuiz,
    onOpenFlashcards,
}) => {
    const [outputs, setOutputs] = useState<AiOutput[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [activeOutput, setActiveOutput] = useState<AiOutput | null>(null);
    const [generatingQuiz, setGeneratingQuiz] = useState(false);
    const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && resourceId) {
            fetchOutputs();
        }
    }, [open, resourceId]);

    const fetchOutputs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/ai/outputs/${resourceId}`);
            const data = response.data || [];
            setOutputs(data);

            // Auto-select the most recent output of the requested type
            const matching = data.find(
                (o: AiOutput) => o.type === initialType
            );
            if (matching) {
                setActiveOutput(matching);
            } else {
                setActiveOutput(null);
            }
        } catch (err) {
            console.error('Failed to fetch AI outputs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (type: 'summary' | 'explanation') => {
        setGenerating(true);
        setError(null);
        try {
            const response = await api.post('/ai/generate', {
                resourceId,
                type,
            });
            const newOutput = response.data;
            setOutputs((prev) => [newOutput, ...prev]);
            setActiveOutput(newOutput);
            toast.success(
                `${type === 'summary' ? 'Summary' : 'Explanation'} generated!`
            );
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                'Failed to generate. Please try again.';
            setError(message);
            toast.error(message);
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateQuiz = async (difficulty: string = 'medium') => {
        if (!activeOutput) return;
        setGeneratingQuiz(true);
        try {
            const response = await api.post('/ai/quiz', {
                sourceOutputId: activeOutput._id,
                difficulty,
            });
            toast.success('Quiz generated!');
            onOpenQuiz(response.data);
        } catch (err: any) {
            toast.error(
                err.response?.data?.message || 'Failed to generate quiz.'
            );
        } finally {
            setGeneratingQuiz(false);
        }
    };

    const handleGenerateFlashcards = async () => {
        if (!activeOutput) return;
        setGeneratingFlashcards(true);
        try {
            const response = await api.post('/ai/flashcards', {
                sourceOutputId: activeOutput._id,
            });
            toast.success('Flashcards generated!');
            onOpenFlashcards(response.data);
        } catch (err: any) {
            toast.error(
                err.response?.data?.message ||
                    'Failed to generate flashcards.'
            );
        } finally {
            setGeneratingFlashcards(false);
        }
    };

    const summaries = outputs.filter((o) => o.type === 'summary');
    const explanations = outputs.filter((o) => o.type === 'explanation');

    // ─── Enhanced Markdown Renderer ─────────────────────────────────────
    const renderContent = (content: string) => {
        const lines = content.split('\n');
        const elements: React.ReactNode[] = [];
        let listBuffer: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;
        let sectionIndex = 0;

        const flushList = () => {
            if (listBuffer) {
                const key = `list-${elements.length}`;
                if (listBuffer.type === 'ul') {
                    elements.push(
                        <ul key={key} className="ai-content-list">
                            {listBuffer.items}
                        </ul>
                    );
                } else {
                    elements.push(
                        <ol key={key} className="ai-content-list ai-content-list-numbered">
                            {listBuffer.items}
                        </ol>
                    );
                }
                listBuffer = null;
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Heading 1
            if (line.startsWith('# ')) {
                flushList();
                sectionIndex++;
                elements.push(
                    <h2 key={i} className="ai-heading-1">
                        <span className="ai-heading-accent" />
                        {line.replace('# ', '')}
                    </h2>
                );
                continue;
            }

            // Heading 2
            if (line.startsWith('## ')) {
                flushList();
                sectionIndex++;
                elements.push(
                    <h3 key={i} className="ai-heading-2">
                        {line.replace('## ', '')}
                    </h3>
                );
                continue;
            }

            // Heading 3
            if (line.startsWith('### ')) {
                flushList();
                elements.push(
                    <h4 key={i} className="ai-heading-3">
                        {line.replace('### ', '')}
                    </h4>
                );
                continue;
            }

            // Horizontal rule / separator
            if (line.trim() === '---' || line.trim() === '***') {
                flushList();
                elements.push(<Separator key={i} className="my-6" />);
                continue;
            }

            // Unordered list items
            if (line.startsWith('- ') || line.startsWith('* ')) {
                if (!listBuffer || listBuffer.type !== 'ul') {
                    flushList();
                    listBuffer = { type: 'ul', items: [] };
                }
                listBuffer.items.push(
                    <li key={i}>
                        {formatInlineMarkdown(line.replace(/^[-*] /, ''))}
                    </li>
                );
                continue;
            }

            // Ordered list items
            if (/^\d+\.\s/.test(line)) {
                if (!listBuffer || listBuffer.type !== 'ol') {
                    flushList();
                    listBuffer = { type: 'ol', items: [] };
                }
                listBuffer.items.push(
                    <li key={i}>
                        {formatInlineMarkdown(line.replace(/^\d+\.\s/, ''))}
                    </li>
                );
                continue;
            }

            // Empty line
            if (line.trim() === '') {
                flushList();
                elements.push(<div key={i} className="h-3" />);
                continue;
            }

            // Regular paragraph
            flushList();
            elements.push(
                <p key={i} className="ai-paragraph">
                    {formatInlineMarkdown(line)}
                </p>
            );
        }

        flushList();
        return elements;
    };

    const formatInlineMarkdown = (text: string): React.ReactNode => {
        // Handle bold (**text**), italic (*text*), and inline code (`text`)
        const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={i} className="ai-bold">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                return (
                    <em key={i} className="ai-italic">
                        {part.slice(1, -1)}
                    </em>
                );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code key={i} className="ai-inline-code">
                        {part.slice(1, -1)}
                    </code>
                );
            }
            return part;
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="ai-reader-dialog max-w-3xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col border-0">
                {/* Gradient header */}
                <div className="ai-reader-header">
                    <div className="ai-reader-header-bg" />
                    <div className="relative z-10 px-8 pt-6 pb-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="ai-reader-icon-badge">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                                    AI Study Tools
                                </span>
                            </div>
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white leading-snug pr-8">
                                {resourceTitle}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                AI-generated study material for {resourceTitle}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Tab buttons */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <Button
                                size="sm"
                                variant={activeOutput?.type === 'summary' ? 'default' : 'secondary'}
                                className={
                                    activeOutput?.type === 'summary'
                                        ? 'bg-white text-primary hover:bg-white/90 shadow-md'
                                        : 'bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm'
                                }
                                onClick={() => {
                                    const existing = summaries[0];
                                    if (existing) {
                                        setActiveOutput(existing);
                                    } else {
                                        handleGenerate('summary');
                                    }
                                }}
                                disabled={generating}
                            >
                                <Brain className="w-4 h-4 mr-1.5" />
                                {summaries.length > 0 ? 'View Summary' : 'Summarize'}
                            </Button>
                            <Button
                                size="sm"
                                variant={activeOutput?.type === 'explanation' ? 'default' : 'secondary'}
                                className={
                                    activeOutput?.type === 'explanation'
                                        ? 'bg-white text-primary hover:bg-white/90 shadow-md'
                                        : 'bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm'
                                }
                                onClick={() => {
                                    const existing = explanations[0];
                                    if (existing) {
                                        setActiveOutput(existing);
                                    } else {
                                        handleGenerate('explanation');
                                    }
                                }}
                                disabled={generating}
                            >
                                <Sparkles className="w-4 h-4 mr-1.5" />
                                {explanations.length > 0 ? 'View Explanation' : 'Explain'}
                            </Button>
                            {activeOutput &&
                                ['summary', 'explanation'].includes(activeOutput.type) && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-white/70 hover:text-white hover:bg-white/15"
                                        onClick={() =>
                                            handleGenerate(activeOutput.type as 'summary' | 'explanation')
                                        }
                                        disabled={generating}
                                    >
                                        <RefreshCw
                                            className={`w-4 h-4 mr-1.5 ${generating ? 'animate-spin' : ''}`}
                                        />
                                        Regenerate
                                    </Button>
                                )}
                        </div>
                    </div>
                </div>

                {/* Content body */}
                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="px-8 py-6">
                        {loading && (
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-2/3 rounded-lg" />
                                <Skeleton className="h-5 w-full rounded" />
                                <Skeleton className="h-5 w-5/6 rounded" />
                                <Skeleton className="h-5 w-full rounded" />
                                <Skeleton className="h-5 w-4/6 rounded" />
                                <div className="h-6" />
                                <Skeleton className="h-6 w-1/2 rounded-lg" />
                                <Skeleton className="h-5 w-full rounded" />
                                <Skeleton className="h-5 w-3/4 rounded" />
                            </div>
                        )}

                        {generating && (
                            <div className="flex flex-col items-center justify-center py-16 gap-5">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                                        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                                    </div>
                                    <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-semibold text-foreground">
                                        AI is analyzing your document...
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1.5">
                                        This may take 15-30 seconds for large PDFs
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && !generating && (
                            <div className="flex items-start gap-3 p-5 rounded-xl bg-destructive/8 border border-destructive/20">
                                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-destructive">Generation Failed</p>
                                    <p className="text-sm text-destructive/80 mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        {!loading && !generating && !activeOutput && !error && (
                            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                    <BookOpen className="w-10 h-10 text-muted-foreground/50" />
                                </div>
                                <div>
                                    <p className="text-base font-medium text-foreground">
                                        Ready to study smarter
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                        Click <strong>"Summarize"</strong> for quick key points or{' '}
                                        <strong>"Explain"</strong> for an in-depth breakdown of this resource.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeOutput &&
                            !generating &&
                            ['summary', 'explanation'].includes(activeOutput.type) && (
                                <div>
                                    {/* Meta info bar */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <Badge className="ai-type-badge">
                                            {activeOutput.type === 'summary' ? (
                                                <><Brain className="w-3 h-3 mr-1" /> Summary</>
                                            ) : (
                                                <><Lightbulb className="w-3 h-3 mr-1" /> Explanation</>
                                            )}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(activeOutput.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            • {activeOutput.modelUsed}
                                        </span>
                                    </div>

                                    {/* Rendered content with enhanced styling */}
                                    <article className="ai-reader-content">
                                        {renderContent(
                                            typeof activeOutput.content === 'string'
                                                ? activeOutput.content
                                                : JSON.stringify(activeOutput.content, null, 2)
                                        )}
                                    </article>
                                </div>
                            )}
                    </div>
                </ScrollArea>

                {/* Bottom actions — Quiz & Flashcards */}
                {activeOutput &&
                    ['summary', 'explanation'].includes(activeOutput.type) &&
                    !generating && (
                        <div className="ai-reader-footer">
                            <p className="text-xs text-muted-foreground mb-3 font-medium">
                                🎯 Turn this {activeOutput.type} into interactive study tools:
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateQuiz('medium')}
                                    disabled={generatingQuiz}
                                    className="flex-1 h-10 ai-action-btn"
                                >
                                    <HelpCircle className="w-4 h-4 mr-1.5" />
                                    {generatingQuiz ? 'Generating...' : 'Generate Quiz'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleGenerateFlashcards}
                                    disabled={generatingFlashcards}
                                    className="flex-1 h-10 ai-action-btn"
                                >
                                    <Layers className="w-4 h-4 mr-1.5" />
                                    {generatingFlashcards ? 'Generating...' : 'Generate Flashcards'}
                                </Button>
                            </div>
                        </div>
                    )}
            </DialogContent>
        </Dialog>
    );
};

export default AiOutputSheet;
