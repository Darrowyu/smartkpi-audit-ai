import React from 'react';

interface SectionCardProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ icon, title, description, children, headerRight }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6">
    {(icon || title) && (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon && <div className="w-10 h-10 rounded-lg bg-[#1E4B8E]/10 flex items-center justify-center text-[#1E4B8E]">{icon}</div>}
          {title && (
            <div>
              <h3 className="font-semibold text-slate-800">{title}</h3>
              {description && <p className="text-sm text-slate-500">{description}</p>}
            </div>
          )}
        </div>
        {headerRight}
      </div>
    )}
    {children}
  </div>
);
