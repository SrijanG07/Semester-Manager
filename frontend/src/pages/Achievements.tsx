import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import api from "../utils/api";
import { Trophy, Flame, Lock } from "lucide-react";

interface AchievementData {
    type: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    unlocked: boolean;
    unlockedAt: string | null;
    seen: boolean;
}

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string | null;
    totalStudyDays: number;
}

const Achievements = () => {
    const [achievements, setAchievements] = useState<AchievementData[]>([]);
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/gamification/achievements'),
            api.get('/gamification/streak'),
        ]).then(([achRes, strRes]) => {
            setAchievements(achRes.data);
            setStreak(strRes.data);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, []);

    const categories = [...new Set(achievements.map(a => a.category))];
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    if (loading) {
        return (
            <DashboardLayout title="Achievements" subtitle="Track your milestones">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Achievements" subtitle="Track your milestones">
            <div className="space-y-6">
                {/* Streak Banner */}
                <div className="card bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10 border-orange-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl streak-fire">🔥</div>
                            <div>
                                <p className="text-3xl font-bold text-foreground">{streak?.currentStreak || 0}</p>
                                <p className="text-sm text-muted-foreground">Day Streak</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-xl font-bold text-foreground">{streak?.longestStreak || 0}</p>
                                <p className="text-xs text-muted-foreground">Longest</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-foreground">{streak?.totalStudyDays || 0}</p>
                                <p className="text-xs text-muted-foreground">Total Days</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-foreground">{unlockedCount}/{achievements.length}</p>
                                <p className="text-xs text-muted-foreground">Unlocked</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Achievement Categories */}
                {categories.map(category => (
                    <div key={category}>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger-children">
                            {achievements.filter(a => a.category === category).map(achievement => (
                                <div
                                    key={achievement.type}
                                    className={`card flex flex-col items-center text-center p-5 transition-all duration-300 ${
                                        achievement.unlocked
                                            ? 'border-primary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
                                            : 'opacity-50 grayscale'
                                    }`}
                                >
                                    <div className={`text-3xl mb-2 ${achievement.unlocked ? 'animate-float' : ''}`}>
                                        {achievement.unlocked ? achievement.icon : '🔒'}
                                    </div>
                                    <h4 className="text-sm font-semibold text-foreground mb-1">{achievement.title}</h4>
                                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                                    {achievement.unlocked && achievement.unlockedAt && (
                                        <p className="text-[10px] text-primary mt-2">
                                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {achievements.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Start studying to unlock achievements!</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Achievements;
