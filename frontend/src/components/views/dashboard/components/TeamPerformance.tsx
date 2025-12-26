import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  progress: number;
  completed: number;
  total: number;
}

interface TeamPerformanceProps {
  members: TeamMember[];
  teamName?: string;
  showProgressBar?: boolean;
}

const getProgressColor = (progress: number): string => {
  if (progress >= 90) return 'bg-emerald-500';
  if (progress >= 70) return 'bg-[#1E4B8E]';
  if (progress >= 50) return 'bg-amber-500';
  return 'bg-red-500';
};

const getProgressTextColor = (progress: number): string => {
  if (progress >= 90) return 'text-emerald-600';
  if (progress >= 70) return 'text-[#1E4B8E]';
  if (progress >= 50) return 'text-amber-600';
  return 'text-red-600';
};

const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

const getAvatarBg = (name: string): string => {
  const colors = ['bg-[#1E4B8E]', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const TeamPerformance: React.FC<TeamPerformanceProps> = ({ members, teamName = '管理团队', showProgressBar = true }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">团队表现</h3>
        <span className="px-3 py-1 text-xs font-medium text-[#1E4B8E] bg-blue-50 rounded-full">
          {teamName}
        </span>
      </div>
      <div className="space-y-5">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className={`${getAvatarBg(member.name)} text-white font-medium`}>
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                </div>
                <span className={`text-lg font-bold ${getProgressTextColor(member.progress)}`}>
                  {member.progress}%
                </span>
              </div>
              {showProgressBar && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(member.progress)} rounded-full transition-all duration-300`}
                      style={{ width: `${member.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {member.completed}/{member.total}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export type { TeamMember };
