import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
}

export function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-4">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                    <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
                    <p className="text-sm text-muted-foreground">{title}</p>
                </div>
            </div>
            {subtitle && <p className="mt-3 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
    );
}
