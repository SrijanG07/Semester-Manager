import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Layers,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    Sparkles,
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

interface FlashCard {
    front: string;
    back: string;
}

interface CardProgress {
    cardIndex: number;
    ease: string;
    interval: number;
    dueDate: string;
    lastReviewedAt: string;
}

interface AiOutput {
    _id: string;
    resourceId: string;
    type: string;
    content: any;
    modelUsed: string;
    createdAt: string;
}

interface FlashcardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flashcardData: AiOutput | null;
}

const FlashcardDialog: React.FC<FlashcardDialogProps> = ({
    open,
    onOpenChange,
    flashcardData,
}) => {
    const [cards, setCards] = useState<FlashCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [progressMap, setProgressMap] = useState<Map<number, CardProgress>>(
        new Map()
    );
    const [reviewedThisSession, setReviewedThisSession] = useState<Set<number>>(
        new Set()
    );
    const [phase, setPhase] = useState<'review' | 'complete'>('review');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && flashcardData?.content?.cards) {
            setCards(flashcardData.content.cards);
            setCurrentIndex(0);
            setIsFlipped(false);
            setReviewedThisSession(new Set());
            setPhase('review');
            fetchProgress();
        }
    }, [open, flashcardData]);

    const fetchProgress = async () => {
        if (!flashcardData) return;
        try {
            const res = await api.get(
                `/ai/flashcard-progress/${flashcardData._id}`
            );
            const map = new Map<number, CardProgress>();
            (res.data || []).forEach((p: CardProgress) => {
                map.set(p.cardIndex, p);
            });
            setProgressMap(map);
        } catch (err) {
            // Non-critical
        }
    };

    // Sort cards: due cards first, then new cards, then future cards
    const sortedIndices = useMemo(() => {
        const now = new Date();
        const indices = cards.map((_, i) => i);

        return indices.sort((a, b) => {
            const progA = progressMap.get(a);
            const progB = progressMap.get(b);

            // Cards without progress (new) come second
            if (!progA && !progB) return a - b;
            if (!progA) return -1; // new cards before future
            if (!progB) return 1;

            const dueA = new Date(progA.dueDate);
            const dueB = new Date(progB.dueDate);

            // Due cards first
            const aDue = dueA <= now;
            const bDue = dueB <= now;
            if (aDue && !bDue) return -1;
            if (!aDue && bDue) return 1;

            return dueA.getTime() - dueB.getTime();
        });
    }, [cards, progressMap]);

    const currentCardOriginalIndex = sortedIndices[currentIndex];
    const currentCard = cards[currentCardOriginalIndex];
    const currentProgress = progressMap.get(currentCardOriginalIndex);

    const dueCount = useMemo(() => {
        const now = new Date();
        let count = 0;
        for (let i = 0; i < cards.length; i++) {
            const prog = progressMap.get(i);
            if (!prog || new Date(prog.dueDate) <= now) {
                count++;
            }
        }
        return count;
    }, [cards, progressMap]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleRate = async (ease: 'again' | 'good' | 'easy') => {
        if (!flashcardData || saving) return;
        setSaving(true);

        try {
            await api.post('/ai/flashcard-progress', {
                aiOutputId: flashcardData._id,
                cardIndex: currentCardOriginalIndex,
                ease,
            });

            // Update local progress
            setProgressMap((prev) => {
                const next = new Map(prev);
                const existing = next.get(currentCardOriginalIndex);
                const now = new Date();
                let interval = 0;

                switch (ease) {
                    case 'again':
                        interval = 1;
                        break;
                    case 'good':
                        interval = Math.max(
                            1,
                            (existing?.interval || 1) * 2
                        );
                        break;
                    case 'easy':
                        interval = Math.max(
                            4,
                            (existing?.interval || 1) * 3
                        );
                        break;
                }

                const dueDate = new Date(now);
                dueDate.setDate(dueDate.getDate() + interval);

                next.set(currentCardOriginalIndex, {
                    cardIndex: currentCardOriginalIndex,
                    ease,
                    interval,
                    dueDate: dueDate.toISOString(),
                    lastReviewedAt: now.toISOString(),
                });
                return next;
            });

            // Mark as reviewed
            setReviewedThisSession((prev) => {
                const next = new Set(prev);
                next.add(currentCardOriginalIndex);
                return next;
            });

            // Move to next card
            if (currentIndex < sortedIndices.length - 1) {
                setCurrentIndex((i) => i + 1);
                setIsFlipped(false);
            } else {
                setPhase('complete');
            }
        } catch (err) {
            toast.error('Failed to save progress.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((i) => i - 1);
            setIsFlipped(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < sortedIndices.length - 1) {
            setCurrentIndex((i) => i + 1);
            setIsFlipped(false);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setReviewedThisSession(new Set());
        setPhase('review');
        fetchProgress();
    };

    const getEaseLabel = (ease?: string) => {
        switch (ease) {
            case 'easy':
                return { text: 'Easy', color: 'text-green-500' };
            case 'good':
                return { text: 'Good', color: 'text-blue-500' };
            case 'again':
                return { text: 'Again', color: 'text-red-500' };
            default:
                return { text: 'New', color: 'text-muted-foreground' };
        }
    };

    const progressPct =
        cards.length > 0
            ? (reviewedThisSession.size / cards.length) * 100
            : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary" />
                        {phase === 'review' ? 'Flashcard Review' : 'Session Complete!'}
                    </DialogTitle>
                </DialogHeader>

                {/* ─── Review Phase ─── */}
                {phase === 'review' && currentCard && (
                    <div className="space-y-4 py-2">
                        {/* Progress bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                    Card {currentIndex + 1} of {cards.length}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {dueCount} due
                                </span>
                            </div>
                            <Progress value={progressPct} className="h-2" />
                        </div>

                        {/* Card status badge */}
                        <div className="flex items-center gap-2">
                            {currentProgress ? (
                                <>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        <span
                                            className={
                                                getEaseLabel(
                                                    currentProgress.ease
                                                ).color
                                            }
                                        >
                                            Last:{' '}
                                            {
                                                getEaseLabel(
                                                    currentProgress.ease
                                                ).text
                                            }
                                        </span>
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        Interval: {currentProgress.interval}d
                                    </span>
                                </>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    New card
                                </Badge>
                            )}
                            {reviewedThisSession.has(
                                currentCardOriginalIndex
                            ) && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                        </div>

                        {/* Flashcard */}
                        <div
                            className="cursor-pointer perspective-1000"
                            onClick={handleFlip}
                        >
                            <div
                                className={`relative w-full min-h-[250px] transition-all duration-500 preserve-3d ${
                                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                                }`}
                                style={{
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                {/* Front */}
                                <div
                                    className="absolute inset-0 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 flex flex-col items-center justify-center text-center"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                    }}
                                >
                                    <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                                        Question
                                    </p>
                                    <p className="text-lg font-medium leading-relaxed">
                                        {currentCard.front}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-6">
                                        Click to reveal answer
                                    </p>
                                </div>

                                {/* Back */}
                                <div
                                    className="absolute inset-0 rounded-xl border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10 p-8 flex flex-col items-center justify-center text-center"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                    }}
                                >
                                    <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                                        Answer
                                    </p>
                                    <p className="text-base leading-relaxed">
                                        {currentCard.back}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rating buttons — only show when flipped */}
                        {isFlipped && (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground text-center">
                                    How well did you know this?
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant="outline"
                                        className="border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
                                        onClick={() => handleRate('again')}
                                        disabled={saving}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-1.5" />
                                        Again
                                        <span className="text-xs ml-1 opacity-60">
                                            1d
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500"
                                        onClick={() => handleRate('good')}
                                        disabled={saving}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                        Good
                                        <span className="text-xs ml-1 opacity-60">
                                            {Math.max(
                                                1,
                                                (currentProgress?.interval ||
                                                    1) * 2
                                            )}
                                            d
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-green-500/30 hover:bg-green-500/10 hover:text-green-500"
                                        onClick={() => handleRate('easy')}
                                        disabled={saving}
                                    >
                                        <Sparkles className="w-4 h-4 mr-1.5" />
                                        Easy
                                        <span className="text-xs ml-1 opacity-60">
                                            {Math.max(
                                                4,
                                                (currentProgress?.interval ||
                                                    1) * 3
                                            )}
                                            d
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                {reviewedThisSession.size} reviewed this
                                session
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNext}
                                disabled={
                                    currentIndex >= sortedIndices.length - 1
                                }
                            >
                                Skip
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ─── Complete Phase ─── */}
                {phase === 'complete' && (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold">
                                    Session Complete! 🎉
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    You reviewed {reviewedThisSession.size} of{' '}
                                    {cards.length} cards
                                </p>
                            </div>
                        </div>

                        {/* Session stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {['again', 'good', 'easy'].map((ease) => {
                                const count = Array.from(
                                    reviewedThisSession
                                ).filter(
                                    (idx) =>
                                        progressMap.get(idx)?.ease === ease
                                ).length;
                                const label = getEaseLabel(ease);
                                return (
                                    <div
                                        key={ease}
                                        className="text-center p-3 rounded-lg border"
                                    >
                                        <p
                                            className={`text-2xl font-bold ${label.color}`}
                                        >
                                            {count}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {label.text}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleRestart}
                                className="flex-1"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Review Again
                            </Button>
                            <Button
                                onClick={() => onOpenChange(false)}
                                className="flex-1"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default FlashcardDialog;
