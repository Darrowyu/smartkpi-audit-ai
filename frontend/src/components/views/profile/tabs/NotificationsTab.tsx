import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Bell, Smartphone, Target, FileText, Users, Trophy, AlertTriangle } from 'lucide-react';
import { SectionCard } from '../components/SectionCard';
import { Toggle } from '../components/Toggle';

interface NotifyItemProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  iconBg?: string;
}

const NotifyItem: React.FC<NotifyItemProps> = ({ icon: Icon, title, desc, checked, onChange, iconBg = 'bg-[#1E4B8E]/10 text-[#1E4B8E]' }) => (
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
  const [notifications, setNotifications] = useState({
    emailNotify: true,
    pushNotify: true,
    smsNotify: false,
    kpiReminder: true,
    weeklyReport: true,
    teamUpdates: true,
    achievements: true,
    deadlineAlert: true,
  });

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
            onChange={(v) => setNotifications(p => ({ ...p, emailNotify: v }))}
          />
          <NotifyItem
            icon={Bell}
            title={t('settings.notifications.push', '推送通知')}
            desc={t('settings.notifications.pushDesc', '接收浏览器推送通知')}
            checked={notifications.pushNotify}
            onChange={(v) => setNotifications(p => ({ ...p, pushNotify: v }))}
          />
          <NotifyItem
            icon={Smartphone}
            title={t('settings.notifications.sms', '短信通知')}
            desc={t('settings.notifications.smsDesc', '接收重要短信提醒')}
            checked={notifications.smsNotify}
            onChange={(v) => setNotifications(p => ({ ...p, smsNotify: v }))}
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
            onChange={(v) => setNotifications(p => ({ ...p, kpiReminder: v }))}
            iconBg="bg-amber-50 text-amber-600"
          />
          <NotifyItem
            icon={FileText}
            title={t('settings.notifications.weeklyReport', '每周报告')}
            desc={t('settings.notifications.weeklyReportDesc', '每周发送KPI进度汇总')}
            checked={notifications.weeklyReport}
            onChange={(v) => setNotifications(p => ({ ...p, weeklyReport: v }))}
            iconBg="bg-blue-50 text-blue-600"
          />
          <NotifyItem
            icon={Users}
            title={t('settings.notifications.teamUpdates', '团队动态')}
            desc={t('settings.notifications.teamUpdatesDesc', '接收团队成员的KPI更新')}
            checked={notifications.teamUpdates}
            onChange={(v) => setNotifications(p => ({ ...p, teamUpdates: v }))}
            iconBg="bg-green-50 text-green-600"
          />
          <NotifyItem
            icon={Trophy}
            title={t('settings.notifications.achievements', '成就提醒')}
            desc={t('settings.notifications.achievementsDesc', '当您达成KPI目标时通知')}
            checked={notifications.achievements}
            onChange={(v) => setNotifications(p => ({ ...p, achievements: v }))}
            iconBg="bg-purple-50 text-purple-600"
          />
          <NotifyItem
            icon={AlertTriangle}
            title={t('settings.notifications.deadlineAlert', '截止日期预警')}
            desc={t('settings.notifications.deadlineAlertDesc', 'KPI截止日期前提醒')}
            checked={notifications.deadlineAlert}
            onChange={(v) => setNotifications(p => ({ ...p, deadlineAlert: v }))}
            iconBg="bg-red-50 text-red-600"
          />
        </div>
      </SectionCard>
    </div>
  );
};
