import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, BookOpen, BarChart3, Clock, Brain, Trophy, Sparkles } from "lucide-react";

import AmbientOrbs from "@/components/ui/AmbientOrbs";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Welcome back!");
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            <AmbientOrbs />
            {/* Left — Brand panel */}
            <div className="hidden lg:flex lg:w-[45%] auth-gradient-bg relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/20" />
                    <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full bg-white/15" />
                    <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/10" />
                </div>
                <div className="relative z-10 flex flex-col justify-center px-12 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">AcademiQ</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4 leading-tight">
                        Your AI-powered<br />academic companion.
                    </h2>
                    <p className="text-white/70 mb-10 text-sm leading-relaxed max-w-md">
                        Track grades, manage study sessions, generate AI quizzes, and ace your exams — all in one beautiful platform.
                    </p>
                    <div className="space-y-4">
                        {[
                            { icon: BookOpen, text: "Organize subjects & resources" },
                            { icon: Brain, text: "AI-powered quizzes & flashcards" },
                            { icon: Trophy, text: "Streaks, achievements & gamification" },
                            { icon: BarChart3, text: "Analytics & GPA tracking" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-white/80">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden flex items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                            <GraduationCap className="w-4.5 h-4.5 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold text-foreground">AcademiQ</span>
                    </div>

                    <h1 className="text-2xl font-semibold text-foreground mb-1">Welcome back</h1>
                    <p className="text-sm text-muted-foreground mb-8">Sign in to your account to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-sm">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                        <Button type="submit" className="w-full h-10" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <p className="text-sm text-muted-foreground text-center mt-6">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
