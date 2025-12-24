import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Lock, Shield, Languages, Eye, EyeOff, Check, Save,
  RefreshCw, Trash2, ShieldCheck, Building2, Calendar, LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usersApi, UpdateProfileData, ChangePasswordData } from '@/api/users.api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Language } from '@/types';
import { useNavigate } from 'react-router-dom';

interface ProfileViewProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// 密码输入组件
const PasswordInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}> = ({ value, onChange, placeholder, show, onToggle }) => (
  <div className="relative">
    <Input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pr-10"
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
);

// 信息卡片组件
const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}> = ({ icon, label, value, className = '' }) => (
  <div className={`flex items-center gap-3 p-3 bg-slate-50/80 rounded-lg ${className}`}>
    <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

const ProfileView: React.FC<ProfileViewProps> = ({ language, setLanguage }) => {
  const { t } = useTranslation();
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // 表单状态
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [cleared, setCleared] = useState(false);

  // 用户头像字母
  const avatarLetter = useMemo(() =>
    (user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase(),
    [user]
  );

  // 显示名称
  const displayName = useMemo(() =>
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || 'User',
    [user]
  );

  const handleProfileChange = useCallback((field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePasswordChange = useCallback((field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const data: UpdateProfileData = {
        firstName: profileForm.firstName || undefined,
        lastName: profileForm.lastName || undefined,
        email: profileForm.email || undefined,
      };
      await usersApi.updateProfile(data);
      await refreshUser();
      toast({ title: t('profile.profileSaved'), variant: 'default' });
    } catch (err: any) {
      toast({ title: t('profile.saveFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: t('profile.passwordMismatch'), variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: t('profile.passwordTooShort'), variant: 'destructive' });
      return;
    }
    setPasswordSaving(true);
    try {
      const data: ChangePasswordData = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      };
      await usersApi.changePassword(data);
      toast({ title: t('profile.passwordChanged'), variant: 'default' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      toast({ title: t('profile.changeFailed'), description: msg, variant: 'destructive' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    usersApi.updateProfile({ language: lang }).catch(() => { });
  };

  const handleClearHistory = () => {
    if (confirm(t('confirmClearHistory'))) {
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* 页面头部 - 用户卡片 */}
      <div className="relative mb-8 bg-gradient-to-r from-[#1E4B8E] to-[#2a5fa8] rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold shadow-lg">
            {avatarLetter}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {user?.email || t('profile.noEmail')}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-full">
                <Shield className="w-3.5 h-3.5" />
                {t(`roles.${user?.role}`, user?.role || '')}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            {t('signOut')}
          </button>
        </div>
      </div>

      {/* 标签页内容 */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <TabsTrigger value="profile" className="flex-1 flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-[#1E4B8E] data-[state=active]:text-white">
            <User className="w-4 h-4" />
            {t('profile.tabProfile')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-[#1E4B8E] data-[state=active]:text-white">
            <Lock className="w-4 h-4" />
            {t('profile.tabSecurity')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1 flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-[#1E4B8E] data-[state=active]:text-white">
            <Languages className="w-4 h-4" />
            {t('profile.tabPreferences')}
          </TabsTrigger>
        </TabsList>

        {/* 个人资料 */}
        <TabsContent value="profile" className="space-y-6">
          {/* 账户信息卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard
              icon={<User className="w-4 h-4 text-[#1E4B8E]" />}
              label={t('profile.username')}
              value={user?.username || '-'}
            />
            <InfoCard
              icon={<Building2 className="w-4 h-4 text-[#1E4B8E]" />}
              label={t('profile.company')}
              value={user?.company?.name || '-'}
            />
            <InfoCard
              icon={<Shield className="w-4 h-4 text-[#1E4B8E]" />}
              label={t('profile.department')}
              value={user?.department?.name || t('profile.noDepartment')}
            />
            <InfoCard
              icon={<Calendar className="w-4 h-4 text-[#1E4B8E]" />}
              label={t('profile.lastLogin')}
              value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '-'}
            />
          </div>

          {/* 编辑资料表单 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#1E4B8E] rounded-full" />
              {t('profile.editProfile', '编辑个人资料')}
            </h3>

            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('profile.firstName')}</Label>
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    placeholder={t('profile.firstNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.lastName')}</Label>
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    placeholder={t('profile.lastNamePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('profile.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder={t('profile.emailPlaceholder')}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveProfile} disabled={profileSaving} className="bg-[#1E4B8E] hover:bg-[#163a6e]">
                  {profileSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {t('profile.saveChanges')}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 修改密码 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <div className="w-1 h-5 bg-[#1E4B8E] rounded-full" />
                {t('profile.changePassword')}
              </h3>
              <p className="text-sm text-slate-500 mb-6">{t('profile.changePasswordHint')}</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('profile.currentPassword')}</Label>
                  <PasswordInput
                    value={passwordForm.currentPassword}
                    onChange={(v) => handlePasswordChange('currentPassword', v)}
                    placeholder={t('profile.currentPasswordPlaceholder')}
                    show={showPasswords.current}
                    onToggle={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('profile.newPassword')}</Label>
                  <PasswordInput
                    value={passwordForm.newPassword}
                    onChange={(v) => handlePasswordChange('newPassword', v)}
                    placeholder={t('profile.newPasswordPlaceholder')}
                    show={showPasswords.new}
                    onToggle={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                  />
                  <p className="text-xs text-slate-400">{t('profile.passwordRequirements')}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t('profile.confirmPassword')}</Label>
                  <PasswordInput
                    value={passwordForm.confirmPassword}
                    onChange={(v) => handlePasswordChange('confirmPassword', v)}
                    placeholder={t('profile.confirmPasswordPlaceholder')}
                    show={showPasswords.confirm}
                    onToggle={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  className="w-full mt-2 bg-[#1E4B8E] hover:bg-[#163a6e]"
                >
                  {passwordSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  {t('profile.updatePassword')}
                </Button>
              </div>
            </div>

            {/* 账户状态 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                {t('profile.accountInfo')}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t('profile.accountStatus')}</p>
                      <p className="text-sm text-slate-500">{t('profile.accountSecure', '账户安全')}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    {t('profile.statusActive')}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('profile.lastLogin')}</span>
                    <span className="text-slate-700 font-medium">
                      {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('profile.noLoginRecord')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('profile.username')}</span>
                    <span className="text-slate-700 font-medium">{user?.username}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 偏好设置 */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 语言设置 */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-[#1E4B8E] rounded-full" />
                {t('profile.languageSetting')}
              </h3>

              <div className="flex gap-3">
                {[
                  { code: 'en' as Language, flag: 'US', name: 'English', sub: 'United States' },
                  { code: 'zh' as Language, flag: 'CN', name: '中文', sub: '简体中文' },
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`group relative flex-1 py-3 px-4 rounded-lg border transition-all
                      ${language === lang.code
                        ? 'bg-[#1E4B8E]/5 border-[#1E4B8E] shadow-sm'
                        : 'bg-white border-slate-200 hover:border-[#1E4B8E]/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${language === lang.code ? 'bg-[#1E4B8E] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {lang.flag}
                      </span>
                      <div className="text-left">
                        <span className={`block text-sm font-medium ${language === lang.code ? 'text-[#1E4B8E]' : 'text-slate-700'}`}>
                          {lang.name}
                        </span>
                        <span className="text-xs text-slate-400">{lang.sub}</span>
                      </div>
                    </div>
                    {language === lang.code && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#1E4B8E] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 底部卡片组 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 清除数据 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-red-50 rounded-xl">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{t('clearData')}</h3>
                    <p className="text-sm text-slate-500">{t('clearHistoryDesc')}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearHistory}
                  disabled={cleared}
                  className={`w-full py-3 rounded-xl text-sm font-medium border-2 flex items-center justify-center gap-2 transition-all
                  ${cleared
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'}`}
                >
                  {cleared ? <><Check className="w-4 h-4" />{t('cleared')}</> : <><Trash2 className="w-4 h-4" />{t('clearHistory')}</>}
                </button>
              </div>

              {/* 关于应用 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{t('aboutApp')}</h3>
                    <p className="text-sm text-slate-500">SmartKPI AI</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-500">{t('profile.versionLabel', '版本')}</span>
                    <span className="font-mono text-sm text-[#1E4B8E] bg-[#1E4B8E]/10 px-3 py-1 rounded-lg font-medium">
                      {t('version')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-center mt-4">{t('privacyNote')}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileView;
