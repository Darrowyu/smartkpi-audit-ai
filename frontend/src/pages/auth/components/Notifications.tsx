import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Bell, BellOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Notification as ApiNotification, NotificationType } from '@/api/notifications.api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface NotificationsProps {
  notifications: ApiNotification[];
  loading?: boolean;
  onViewAll?: () => void;
}

const typeConfig: Record<NotificationType, { icon: typeof CheckCircle2; bg: string; color: string }> = {
  [NotificationType.SUBMISSION_APPROVED]: { icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  [NotificationType.SUBMISSION_REJECTED]: { icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-500' },
  [NotificationType.SUBMISSION_PENDING]: { icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
  [NotificationType.CALCULATION_COMPLETE]: { icon: CheckCircle2, bg: 'bg-brand-primary/10', color: 'text-brand-primary' },
  [NotificationType.PERIOD_ACTIVATED]: { icon: Bell, bg: 'bg-purple-50', color: 'text-purple-600' },
  [NotificationType.PERIOD_LOCKED]: { icon: Clock, bg: 'bg-gray-50', color: 'text-gray-600' },
  [NotificationType.LOW_PERFORMANCE_ALERT]: { icon: AlertTriangle, bg: 'bg-orange-50', color: 'text-orange-600' },
  [NotificationType.ASSIGNMENT_CREATED]: { icon: Bell, bg: 'bg-cyan-50', color: 'text-cyan-600' },
  [NotificationType.SYSTEM_ANNOUNCEMENT]: { icon: Bell, bg: 'bg-indigo-50', color: 'text-indigo-600' },
};

const defaultConfig = { icon: Bell, bg: 'bg-slate-50', color: 'text-slate-600' };

export const Notifications: React.FC<NotificationsProps> = ({ notifications, loading, onViewAll }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 h-full">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-slate-800">最新通知</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:opacity-80 font-medium transition-opacity"
          >
            查看全部
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <BellOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无新通知</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type] || defaultConfig;
            const Icon = config.icon;
            return (
              <div key={notification.id} className="flex gap-3">
                <div
                  className={`flex-shrink-0 w-9 h-9 ${config.bg} rounded-full flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {notification.content}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
