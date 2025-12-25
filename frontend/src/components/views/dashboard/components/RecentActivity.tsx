import React from 'react';
import { CheckCircle2, AlertTriangle, Trophy, Users, FileText, TrendingUp, Target } from 'lucide-react';

type ActivityType = 'complete' | 'alert' | 'milestone' | 'team' | 'report' | 'update' | 'kpi';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const getActivityIcon = (type: ActivityType) => {
  const configs: Record<ActivityType, { icon: React.ReactNode; bg: string }> = {
    complete: { 
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, 
      bg: 'bg-emerald-50' 
    },
    alert: { 
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, 
      bg: 'bg-amber-50' 
    },
    milestone: { 
      icon: <Trophy className="w-4 h-4 text-[#1E4B8E]" />, 
      bg: 'bg-blue-50' 
    },
    team: { 
      icon: <Users className="w-4 h-4 text-purple-600" />, 
      bg: 'bg-purple-50' 
    },
    report: { 
      icon: <FileText className="w-4 h-4 text-slate-600" />, 
      bg: 'bg-slate-100' 
    },
    update: { 
      icon: <TrendingUp className="w-4 h-4 text-[#1E4B8E]" />, 
      bg: 'bg-blue-50' 
    },
    kpi: { 
      icon: <Target className="w-4 h-4 text-slate-600" />, 
      bg: 'bg-slate-100' 
    },
  };
  return configs[type] || configs.update;
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-5">最近动态</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const { icon, bg } = getActivityIcon(activity.type);
          return (
            <div key={activity.id} className="flex gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bg} flex items-center justify-center`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activity.description}</p>
                <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type { Activity, ActivityType };
