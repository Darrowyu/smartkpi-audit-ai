import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Bell, Smartphone, Target, FileText, Users, Trophy, AlertTriangle, Loader2 } from 'lucide-react';
import { SectionCard } from '../components/SectionCard';
import { Toggle } from '../components/Toggle';
import { usersApi, NotificationSettings } from '@/api/users.api';
import { useToast } from '@/components/ui/use-toast';

interface NotifyItemProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  iconBg?: string;
}

const NotifyItem: React.FC<NotifyItemProps> = ({ icon: Icon, title, desc, checked, onChange, iconBg = 'bg-primary/10 text-primary' }) => (
  <div className="flex items-center justify-between py-4">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-medium text-slate-800">{title}</div>
        <div className="text-sm text-slate-500">{desc}</div>
      </div>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

export const NotificationsTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotify: true,
    pushNotify: true,
    smsNotify: false,
    kpiReminder: true,
    weeklyReport: true,
    teamUpdates: true,
    achievements: true,
    deadlineAlert: true,
  });
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    usersApi.getNotificationSettings()
      .then(setNotifications)
      .catch(() => toast({ title: t('settings.notifications.loadFailed', '加载设置失败'), variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [t, toast]);

  const handleChange = useCallback(async (key: keyof NotificationSettings, value: boolean) => {
    if (pendingRef.current.has(key)) return;
    pendingRef.current.add(key);
    setNotifications(p => ({ ...p, [key]: value }));
    try {
      await usersApi.updateNotificationSettings({ [key]: value });
    } catch {
      setNotifications(p => ({ ...p, [key]: !value }));
      toast({ title: t('settings.notifications.saveFailed', '保存失败'), variant: 'destructive' });
    } finally {
      pendingRef.current.delete(key);
    }
  }, [t, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('settings.notifications.title', '通知设置')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('settings.notifications.subtitle', '管理您接收通知的方式和类型')}</p>
      </div>

      <SectionCard title={t('settings.notifications.channels', '通知渠道')}>
        <div className="divide-y divide-slate-100">
          <NotifyItem
            icon={Mail}
            title={t('settings.notifications.email', '邮件通知')}
            desc={t('settings.notifications.emailDesc', '通过邮件接收重要通知')}
            checked={notifications.emailNotify}
            onChange={(v) => handleChange('emailNotify', v)}
          />
          <NotifyItem
            icon={Bell}
            title={t('settings.notifications.push', '推送通知')}
            desc={t('settings.notifications.pushDesc', '接收浏览器推送通知')}
            checked={notifications.pushNotify}
            onChange={(v) => handleChange('pushNotify', v)}
          />
          <NotifyItem
            icon={Smartphone}
            title={t('settings.notifications.sms', '短信通知')}
            desc={t('settings.notifications.smsDesc', '接收重要短信提醒')}
            checked={notifications.smsNotify}
            onChange={(v) => handleChange('smsNotify', v)}
          />
        </div>
      </SectionCard>

      <SectionCard title={t('settings.notifications.kpiRelated', 'KPI相关通知')}>
        <div className="divide-y divide-slate-100">
          <NotifyItem
            icon={Target}
            title={t('settings.notifications.kpiReminder', 'KPI提醒')}
            desc={t('settings.notifications.kpiReminderDesc', '定期提醒您更新KPI进度')}
            checked={notifications.kpiReminder}
            onChange={(v) => handleChange('kpiReminder', v)}
            iconBg="bg-amber-50 text-amber-600"
          />
          <NotifyItem
            icon={FileText}
            title={t('settings.notifications.weeklyReport', '每周报告')}
            desc={t('settings.notifications.weeklyReportDesc', '每周发送KPI进度汇总')}
            checked={notifications.weeklyReport}
            onChange={(v) => handleChange('weeklyReport', v)}
            iconBg="bg-primary/10 text-primary"
          />
          <NotifyItem
            icon={Users}
            title={t('settings.notifications.teamUpdates', '团队动态')}
            desc={t('settings.notifications.teamUpdatesDesc', '接收团队成员的KPI更新')}
            checked={notifications.teamUpdates}
            onChange={(v) => handleChange('teamUpdates', v)}
            iconBg="bg-green-50 text-green-600"
          />
          <NotifyItem
            icon={Trophy}
            title={t('settings.notifications.achievements', '成就提醒')}
            desc={t('settings.notifications.achievementsDesc', '当您达成KPI目标时通知')}
            checked={notifications.achievements}
            onChange={(v) => handleChange('achievements', v)}
            iconBg="bg-purple-50 text-purple-600"
          />
          <NotifyItem
            icon={AlertTriangle}
            title={t('settings.notifications.deadlineAlert', '截止日期预警')}
            desc={t('settings.notifications.deadlineAlertDesc', 'KPI截止日期前提醒')}
            checked={notifications.deadlineAlert}
            onChange={(v) => handleChange('deadlineAlert', v)}
            iconBg="bg-red-50 text-red-600"
          />
        </div>
      </SectionCard>
    </div>
  );
};
