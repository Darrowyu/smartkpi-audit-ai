import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Eye, EyeOff, Smartphone, History, RefreshCw, Loader2 } from 'lucide-react';
import { usersApi, ChangePasswordData, LoginHistoryItem } from '@/api/users.api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SectionCard } from '../components/SectionCard';
import { Toggle } from '../components/Toggle';

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
          <Button onClick={handleChangePassword} disabled={passwordSaving} className="bg-brand-primary hover:bg-brand-dark">
            {passwordSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            {t('profile.updatePassword', '更新密码')}
          </Button>
        </div>
      </SectionCard>

      {/* 双因素认证 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
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
          <div className="space-y-4">
            {loginHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.isCurrent ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <div>
                    <div className="font-medium text-slate-800">{item.device || t('settings.security.unknownDevice', '未知设备')}</div>
                    <div className="text-sm text-slate-500">{item.location || item.ipAddress || '-'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">{new Date(item.createdAt).toLocaleString()}</div>
                  {item.isCurrent && <div className="text-xs text-brand-primary">{t('settings.security.currentDevice', '当前设备')}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
