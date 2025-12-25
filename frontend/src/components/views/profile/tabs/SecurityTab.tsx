import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Eye, EyeOff, Smartphone, History, RefreshCw } from 'lucide-react';
import { usersApi, ChangePasswordData } from '@/api/users.api';
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

  const loginHistory = [
    { device: 'Windows PC - Chrome', location: '北京', time: '2024-01-15 14:30', current: true },
    { device: 'iPhone 14 Pro', location: '北京', time: '2024-01-15 09:15', current: false },
    { device: 'MacBook Pro - Safari', location: '上海', time: '2024-01-14 18:45', current: false },
  ];

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
            <Label className="text-[#1E4B8E]">{t('profile.currentPassword', '当前密码')}</Label>
            <div className="relative">
              <Input type={showPasswords.current ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} />
              <button type="button" onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#1E4B8E]">{t('profile.newPassword', '新密码')}</Label>
            <div className="relative">
              <Input type={showPasswords.new ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} />
              <button type="button" onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#1E4B8E]">{t('profile.confirmPassword', '确认新密码')}</Label>
            <div className="relative">
              <Input type={showPasswords.confirm ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} />
              <button type="button" onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={passwordSaving} className="bg-[#1E4B8E] hover:bg-[#163a6e]">
            {passwordSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            {t('profile.updatePassword', '更新密码')}
          </Button>
        </div>
      </SectionCard>

      {/* 双因素认证 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1E4B8E]/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#1E4B8E]" />
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
        <div className="space-y-4">
          {loginHistory.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.current ? 'bg-green-500' : 'bg-slate-300'}`} />
                <div>
                  <div className="font-medium text-slate-800">{item.device}</div>
                  <div className="text-sm text-slate-500">{item.location}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600">{item.time}</div>
                {item.current && <div className="text-xs text-[#1E4B8E]">{t('settings.security.currentDevice', '当前设备')}</div>}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
