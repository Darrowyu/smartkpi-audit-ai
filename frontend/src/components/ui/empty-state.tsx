import React from 'react';
import { cn } from '@/lib/utils';
import { FileQuestion, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = FileQuestion,
    title,
    description,
    action,
    className,
}) => {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
            <Icon className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">{title}</h3>
            {description && <p className="text-sm text-slate-400 mb-4 max-w-sm">{description}</p>}
            {action}
        </div>
    );
};
