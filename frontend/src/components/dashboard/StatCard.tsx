import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    variant?: "default" | "primary" | "success" | "warning" | "info";
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = "default" }: StatCardProps) {
    const [displayValue, setDisplayValue] = useState<string | number>(value);
    const [hasAnimated, setHasAnimated] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Animated count-up for numeric values
    useEffect(() => {
        if (hasAnimated) return;

        const numericMatch = String(value).match(/^(\d+\.?\d*)/);
        if (numericMatch) {
            const target = parseFloat(numericMatch[1]);
            const suffix = String(value).slice(numericMatch[0].length);
            const duration = 800;
            const startTime = Date.now();
            const isFloat = String(value).includes('.');

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = target * eased;

                if (isFloat) {
                    setDisplayValue(current.toFixed(1) + suffix);
                } else {
                    setDisplayValue(Math.round(current) + suffix);
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setHasAnimated(true);
                }
            };

            requestAnimationFrame(animate);
        }
    }, [value, hasAnimated]);

    const variantClass = {
        default: '',
        primary: 'stat-card-primary',
        success: 'stat-card-success',
        warning: 'stat-card-warning',
        info: 'stat-card-info',
    }[variant];

    const iconBadgeClass = {
        default: 'stat-icon-badge-primary',
        primary: 'stat-icon-badge-primary',
        success: 'stat-icon-badge-success',
        warning: 'stat-icon-badge-warning',
        info: 'stat-icon-badge-info',
    }[variant];

    return (
        <div ref={cardRef} className={cn("stat-card", variantClass)}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold text-foreground tracking-tight animate-count-up">
                        {displayValue}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
                <div className={cn("stat-icon-badge", iconBadgeClass)}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
