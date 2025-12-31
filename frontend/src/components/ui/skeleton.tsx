import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-muted',
                className
            )}
            {...props}
        />
    );
};

// Pre-built skeleton patterns
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
    <tr>
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="p-4">
                <Skeleton className="h-4 w-full" />
            </td>
        ))}
    </tr>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 5 }) => (
    <div className="w-full">
        <div className="border rounded-lg">
            <table className="w-full">
                <thead>
                    <tr className="border-b">
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="p-4 text-left">
                                <Skeleton className="h-4 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
        </div>
    </div>
);

export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
                <Skeleton className="h-6 w-1/4 mb-4" />
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="rounded-lg border bg-card p-6">
                <Skeleton className="h-6 w-1/4 mb-4" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    </div>
);
