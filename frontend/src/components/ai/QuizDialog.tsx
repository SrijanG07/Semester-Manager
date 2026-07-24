import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    CheckCircle2,
    XCircle,
    Trophy,
    ArrowRight,
    RotateCcw,
    HelpCircle,
    Sparkles,
    Target,
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

interface Question {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

interface AiOutput {
    _id: string;
    resourceId: string;
    type: string;
    content: any;
    modelUsed: string;
    createdAt: string;
    sourceOutputId?: string;
}

interface QuizDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quizData: AiOutput | null;
    sourceOutputId?: string;
}

type QuizPhase = 'setup' | 'playing' | 'result';

const QuizDialog: React.FC<QuizDialogProps> = ({
    open,
    onOpenChange,
    quizData,
    sourceOutputId,
}) => {
    const [phase, setPhase] = useState<QuizPhase>('setup');
    const [difficulty, setDifficulty] = useState<string>('medium');
    const [generating, setGenerating] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<
        { questionIndex: number; selectedIndex: number; correct: boolean }[]
    >([]);
    const [quizOutputId, setQuizOutputId] = useState<string | null>(null);
    const [attempts, setAttempts] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            if (quizData && quizData.content?.questions) {
                // Pre-loaded quiz data
                setQuestions(quizData.content.questions);
                setQuizOutputId(quizData._id);
                setPhase('playing');
                resetQuizState();
                fetchAttempts(quizData._id);
            } else {
                setPhase('setup');
                resetQuizState();
            }
        }
    }, [open, quizData]);

    const resetQuizState = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setAnswered(false);
        setScore(0);
        setAnswers([]);
    };

    const fetchAttempts = async (quizId: string) => {
        try {
            const res = await api.get(`/ai/quiz-attempts/${quizId}`);
            setAttempts(res.data || []);
        } catch (err) {
            // Non-critical
        }
    };

    const handleGenerate = async () => {
        if (!sourceOutputId) return;
        setGenerating(true);
        try {
            const response = await api.post('/ai/quiz', {
                sourceOutputId,
                difficulty,
            });
            const data = response.data;
            setQuestions(data.content.questions);
            setQuizOutputId(data._id);
            setPhase('playing');
            resetQuizState();
            toast.success('Quiz generated!');
        } catch (err: any) {
            toast.error(
                err.response?.data?.message || 'Failed to generate quiz.'
            );
        } finally {
            setGenerating(false);
        }
    };

    const handleSelectOption = (index: number) => {
        if (answered) return;
        setSelectedOption(index);
        setAnswered(true);

        const isCorrect = index === questions[currentIndex].correct_index;
        if (isCorrect) {
            setScore((s) => s + 1);
        }

        setAnswers((prev) => [
            ...prev,
            {
                questionIndex: currentIndex,
                selectedIndex: index,
                correct: isCorrect,
            },
        ]);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((i) => i + 1);
            setSelectedOption(null);
            setAnswered(false);
        } else {
            // Quiz complete — save attempt
            setPhase('result');
            saveAttempt();
        }
    };

    const saveAttempt = async () => {
        if (!quizOutputId) return;
        try {
            await api.post('/ai/quiz-attempt', {
                aiOutputId: quizOutputId,
                score: score + (selectedOption === questions[currentIndex]?.correct_index ? 0 : 0),
                total: questions.length,
                answers,
            });
        } catch (err) {
            console.error('Failed to save quiz attempt');
        }
    };

    const handleRetake = () => {
        resetQuizState();
        setPhase('playing');
    };

    const getScoreColor = (pct: number) => {
        if (pct >= 80) return 'text-green-500';
        if (pct >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreMessage = (pct: number) => {
        if (pct >= 90) return 'Outstanding! 🎉';
        if (pct >= 80) return 'Great job! 💪';
        if (pct >= 70) return 'Good work! 👍';
        if (pct >= 60) return 'Not bad, keep studying! 📚';
        return 'Keep practicing, you\'ll get there! 💡';
    };

    const currentQuestion = questions[currentIndex];
    const progressPct =
        questions.length > 0
            ? ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100
            : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary" />
                        {phase === 'setup' && 'Generate Quiz'}
                        {phase === 'playing' && `Question ${currentIndex + 1} of ${questions.length}`}
                        {phase === 'result' && 'Quiz Complete!'}
                    </DialogTitle>
                </DialogHeader>

                {/* ─── Setup Phase ─── */}
                {phase === 'setup' && (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <Target className="w-10 h-10 text-primary" />
                            </div>
                            <p className="text-center text-sm text-muted-foreground max-w-sm">
                                Generate a multiple-choice quiz to test your
                                understanding. Choose your difficulty level:
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Difficulty
                            </label>
                            <Select
                                value={difficulty}
                                onValueChange={setDifficulty}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">
                                        🟢 Easy — Basic recall & definitions
                                    </SelectItem>
                                    <SelectItem value="medium">
                                        🟡 Medium — Conceptual understanding
                                    </SelectItem>
                                    <SelectItem value="hard">
                                        🔴 Hard — Application & analysis
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                    Generating questions...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Quiz
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* ─── Playing Phase ─── */}
                {phase === 'playing' && currentQuestion && (
                    <div className="space-y-6 py-2">
                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                    Question {currentIndex + 1} of{' '}
                                    {questions.length}
                                </span>
                                <span>Score: {score}</span>
                            </div>
                            <Progress value={progressPct} className="h-2" />
                        </div>

                        {/* Question */}
                        <div className="py-2">
                            <h3 className="text-base font-medium leading-relaxed">
                                {currentQuestion.question}
                            </h3>
                        </div>

                        {/* Options */}
                        <div className="space-y-2.5">
                            {currentQuestion.options.map((option, i) => {
                                const isSelected = selectedOption === i;
                                const isCorrect =
                                    i === currentQuestion.correct_index;
                                const showResult = answered;

                                let optionClass =
                                    'border rounded-lg p-4 cursor-pointer transition-all text-sm text-left w-full flex items-start gap-3';

                                if (!showResult) {
                                    optionClass +=
                                        ' hover:border-primary hover:bg-primary/5';
                                } else if (isCorrect) {
                                    optionClass +=
                                        ' border-green-500 bg-green-500/10';
                                } else if (isSelected && !isCorrect) {
                                    optionClass +=
                                        ' border-red-500 bg-red-500/10';
                                } else {
                                    optionClass += ' opacity-50';
                                }

                                return (
                                    <button
                                        key={i}
                                        className={optionClass}
                                        onClick={() => handleSelectOption(i)}
                                        disabled={answered}
                                    >
                                        <span className="flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium mt-px">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className="flex-1 pt-0.5">
                                            {option}
                                        </span>
                                        {showResult && isCorrect && (
                                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        )}
                                        {showResult &&
                                            isSelected &&
                                            !isCorrect && (
                                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {answered && (
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="p-4">
                                    <p className="text-sm font-medium mb-1">
                                        {selectedOption ===
                                        currentQuestion.correct_index
                                            ? '✅ Correct!'
                                            : '❌ Incorrect'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {currentQuestion.explanation}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Next button */}
                        {answered && (
                            <Button onClick={handleNext} className="w-full">
                                {currentIndex < questions.length - 1 ? (
                                    <>
                                        Next Question
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                ) : (
                                    <>
                                        See Results
                                        <Trophy className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}

                {/* ─── Result Phase ─── */}
                {phase === 'result' && (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                <Trophy className="w-12 h-12 text-primary" />
                            </div>
                            <div className="text-center">
                                <p
                                    className={`text-4xl font-bold ${getScoreColor((score / questions.length) * 100)}`}
                                >
                                    {score}/{questions.length}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {Math.round(
                                        (score / questions.length) * 100
                                    )}
                                    % correct
                                </p>
                                <p className="text-base font-medium mt-3">
                                    {getScoreMessage(
                                        (score / questions.length) * 100
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Answer review */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">
                                Question Review
                            </h4>
                            {answers.map((answer, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-lg border text-sm"
                                >
                                    {answer.correct ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    )}
                                    <span className="flex-1 truncate">
                                        Q{i + 1}:{' '}
                                        {questions[i]?.question?.slice(0, 60)}
                                        ...
                                    </span>
                                    <Badge
                                        variant={
                                            answer.correct
                                                ? 'default'
                                                : 'destructive'
                                        }
                                        className="text-xs"
                                    >
                                        {answer.correct
                                            ? 'Correct'
                                            : 'Wrong'}
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        {/* Past attempts */}
                        {attempts.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">
                                    Past Attempts
                                </h4>
                                {attempts.slice(0, 5).map((attempt, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-2 rounded border text-xs text-muted-foreground"
                                    >
                                        <span>
                                            {new Date(
                                                attempt.takenAt
                                            ).toLocaleDateString()}
                                        </span>
                                        <span className="font-medium">
                                            {attempt.score}/{attempt.total} (
                                            {Math.round(
                                                (attempt.score /
                                                    attempt.total) *
                                                    100
                                            )}
                                            %)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleRetake}
                                className="flex-1"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Retake Quiz
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

export default QuizDialog;
