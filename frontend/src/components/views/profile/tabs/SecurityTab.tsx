import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Eye, EyeOff, Smartphone, History, RefreshCw, Loader2, Monitor } from 'lucide-react';
import { usersApi, ChangePasswordData, LoginHistoryItem } from '@/api/users.api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SectionCard } from '../components/SectionCard';
import { Toggle } from '../components/Toggle';

const formatTimeAgo = (dateStr: string, t: (key: string, fallback: string) => string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('settings.security.justNow', '刚刚');
  if (diffMins < 60) return t('settings.security.minsAgo', '{mins} 分钟前').replace('{mins}', String(diffMins));
  if (diffHours < 24) return t('settings.security.hoursAgo', '{hours} 小时前').replace('{hours}', String(diffHours));
  if (diffDays < 7) return t('settings.security.daysAgo', '{days} 天前').replace('{days}', String(diffDays));
  return date.toLocaleDateString();
};

const getDeviceIcon = (device: string | null, os: string | null): React.ReactNode => {
  const deviceLower = (device || '').toLowerCase();
  const osLower = (os || '').toLowerCase();
  const isMobile = deviceLower.includes('iphone') || deviceLower.includes('android') || deviceLower.includes('mobile') || osLower.includes('ios') || osLower.includes('android');
  
  if (isMobile) {
    return <Smartphone className="w-5 h-5 text-slate-500" />;
  }
  return <Monitor className="w-5 h-5 text-slate-500" />;
};

const formatDeviceName = (item: LoginHistoryItem): string => {
  const parts: string[] = [];
  if (item.device) parts.push(item.device);
  if (item.browser) parts.push(item.browser);
  if (parts.length === 0) return '未知设备';
  return parts.join(' - ');
};

const formatLocationInfo = (item: LoginHistoryItem): string => {
  const parts: string[] = [];
  if (item.location) parts.push(item.location);
  if (item.ipAddress) parts.push(item.ipAddress);
  return parts.join(' • ') || '-';
};

export const SecurityTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    usersApi.getLoginHistory()
      .then(setLoginHistory)
      .catch(() => toast({ title: t('settings.security.loadHistoryFailed', '加载登录历史失败'), variant: 'destructive' }))
      .finally(() => setHistoryLoading(false));
  }, [t, toast]);

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: t('profile.passwordMismatch', '两次密码不一致'), variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: t('profile.passwordTooShort', '密码至少6位'), variant: 'destructive' });
      return;
    }
    setPasswordSaving(true);
    try {
      const data: ChangePasswordData = { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword };
      await usersApi.changePassword(data);
      toast({ title: t('profile.passwordChanged', '密码已修改'), variant: 'default' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast({ title: t('profile.changeFailed', '修改失败'), description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('settings.security.title', '安全设置')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('settings.security.subtitle', '保护您的账户安全')}</p>
      </div>

      {/* 修改密码 */}
      <SectionCard icon={<Key className="w-5 h-5" />} title={t('settings.security.changePassword', '修改密码')} description={t('settings.security.changePasswordDesc', '定期更换密码以保护账户安全')}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-brand-primary">{t('profile.currentPassword', '当前密码')}</Label>
            <div className="relative">
              <Input type={showPasswords.current ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} />
              <button type="button" onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-brand-primary">{t('profile.newPassword', '新密码')}</Label>
            <div className="relative">
              <Input type={showPasswords.new ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} />
              <button type="button" onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-brand-primary">{t('profile.confirmPassword', '确认新密码')}</Label>
            <div className="relative">
              <Input type={showPasswords.confirm ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} />
              <button type="button" onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={passwordSaving} className="bg-brand-primary hover:opacity-90">
            {passwordSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            {t('profile.updatePassword', '更新密码')}
          </Button>
        </div>
      </SectionCard>

      {/* 双因素认证 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{t('settings.security.twoFactor', '双因素认证')}</h3>
              <p className="text-sm text-slate-500">{t('settings.security.twoFactorDesc', '使用手机验证码增加账户安全性')}</p>
            </div>
          </div>
          <Toggle checked={twoFactorEnabled} onChange={setTwoFactorEnabled} />
        </div>
      </div>

      {/* 登录历史 */}
      <SectionCard icon={<History className="w-5 h-5" />} title={t('settings.security.loginHistory', '登录历史')} description={t('settings.security.loginHistoryDesc', '查看您的账户登录记录')}>
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400">{t('settings.security.noLoginHistory', '暂无登录记录')}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {loginHistory.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {getDeviceIcon(item.device, item.os)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 truncate">{formatDeviceName(item)}</span>
                    {item.isCurrent && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {t('settings.security.currentSession', '当前会话')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {formatLocationInfo(item)}
                    {!item.isCurrent && (
                      <span className="ml-2">· {t('settings.security.lastActive', '最后活跃')}: {formatTimeAgo(item.createdAt, t)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
