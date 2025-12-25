import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
}

interface NotificationsProps {
  notifications: Notification[];
  onViewAll?: () => void;
}

const typeConfig = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  warning: { icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-500' },
  info: { icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
};

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onViewAll }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-slate-800">最新通知</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            查看全部
          </button>
        )}
      </div>
      <div className="space-y-4">
        {notifications.map((notification) => {
          const { icon: Icon, bg, color } = typeConfig[notification.type];
          return (
            <div key={notification.id} className="flex gap-3">
              <div className={`flex-shrink-0 w-9 h-9 ${bg} rounded-full flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{notification.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{notification.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type { Notification, NotificationType };
