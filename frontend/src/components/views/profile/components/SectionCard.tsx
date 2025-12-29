import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ icon, title, description, children, headerRight, className }) => (
  <div className={cn('bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm', className)}>
    {(icon || title) && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0">
              {icon}
            </div>
          )}
          {title && (
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{title}</h3>
              {description && <p className="text-xs sm:text-sm text-slate-500 truncate">{description}</p>}
            </div>
          )}
        </div>
        {headerRight && <div className="self-end sm:self-auto">{headerRight}</div>}
      </div>
    )}
    {children}
  </div>
);
