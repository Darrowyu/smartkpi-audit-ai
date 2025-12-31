import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationsApi, Notification, NotificationType } from '@/api/notifications.api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

const typeColorMap: Record<NotificationType, string> = {
  [NotificationType.SUBMISSION_PENDING]: 'bg-yellow-500',
  [NotificationType.SUBMISSION_APPROVED]: 'bg-green-500',
  [NotificationType.SUBMISSION_REJECTED]: 'bg-red-500',
  [NotificationType.CALCULATION_COMPLETE]: 'bg-brand-primary',
  [NotificationType.PERIOD_ACTIVATED]: 'bg-purple-500',
  [NotificationType.PERIOD_LOCKED]: 'bg-gray-500',
  [NotificationType.LOW_PERFORMANCE_ALERT]: 'bg-orange-500',
  [NotificationType.ASSIGNMENT_CREATED]: 'bg-cyan-500',
  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'bg-indigo-500',
};

const typeLabelKeyMap: Record<NotificationType, string> = {
  [NotificationType.SUBMISSION_PENDING]: 'notifications.submissionPending',
  [NotificationType.SUBMISSION_APPROVED]: 'notifications.submissionApproved',
  [NotificationType.SUBMISSION_REJECTED]: 'notifications.submissionRejected',
  [NotificationType.CALCULATION_COMPLETE]: 'notifications.calculationComplete',
  [NotificationType.PERIOD_ACTIVATED]: 'notifications.periodActivated',
  [NotificationType.PERIOD_LOCKED]: 'notifications.periodLocked',
  [NotificationType.LOW_PERFORMANCE_ALERT]: 'notifications.lowPerformanceAlert',
  [NotificationType.ASSIGNMENT_CREATED]: 'notifications.assignmentCreated',
  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'notifications.systemAnnouncement',
};

export function NotificationDropdown() {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const dateLocale = i18n.language === 'zh' ? zhCN : enUS;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getNotifications({ limit: 10 });
      setNotifications(res.data);
      setUnreadCount(res.meta.unreadCount);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.remove(id);
      const removed = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (removed && !removed.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      // silent fail
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex items-center justify-center p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">{t('notifications.title')}</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
        <div className="h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('notifications.loading')}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('notifications.empty')}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 hover:bg-muted/50 ${!n.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${typeColorMap[n.type] || 'bg-gray-400'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{n.title}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {n.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(n.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={async () => {
                await notificationsApi.removeAllRead();
                fetchNotifications();
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {t('notifications.clearRead')}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
