import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Building2, Briefcase, FileText, Camera, RefreshCw, Edit3, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usersApi, UpdateProfileData, getAvatarUrl } from '@/api/users.api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SectionCard } from '../components/SectionCard';

export const ProfileTab: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [avatarError, setAvatarError] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: (user as any)?.phoneNumber || '',
    bio: (user as any)?.bio || '',
  });

  const syncProfileFormFromUser = useCallback(() => {
    if (!user) return;
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: (user as any)?.phoneNumber || '',
      bio: (user as any)?.bio || '',
    });
  }, [user]);

  const avatarLetter = useMemo(() => (user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase(), [user]);
  const displayName = useMemo(() => {
    const firstName = (user?.firstName || '').trim();
    const lastName = (user?.lastName || '').trim();
    if (firstName && lastName) return firstName === lastName ? lastName : `${firstName} ${lastName}`;
    return firstName || lastName || user?.username || 'User';
  }, [user]);

  useEffect(() => { setAvatarError(false); }, [user?.avatar]); // avatar变化时重置错误状态

  useEffect(() => {
    if (!user || isEditing) return;
    syncProfileFormFromUser();
  }, [user, isEditing, syncProfileFormFromUser]);

  const avatarUrl = useMemo(() => (user?.avatar && !avatarError) ? `${getAvatarUrl(user.id)}&k=${avatarKey}` : null, [user, avatarKey, avatarError]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t('profile.avatarTooLarge', '图片大小不能超过5MB'), variant: 'destructive' });
      return;
    }
    setAvatarUploading(true);
    try {
      await usersApi.uploadAvatar(file);
      setAvatarError(false);
      setAvatarKey(Date.now());
      await refreshUser();
      toast({ title: t('profile.avatarUpdated', '头像已更新'), variant: 'default' });
    } catch (err: any) {
      toast({ title: t('profile.avatarFailed', '头像上传失败'), description: err.message, variant: 'destructive' });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const data: UpdateProfileData = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email || undefined,
        phoneNumber: profileForm.phoneNumber || undefined,
        bio: profileForm.bio || undefined,
      };
      await usersApi.updateProfile(data);
      await refreshUser();
      toast({ title: t('profile.profileSaved', '资料已保存'), variant: 'default' });
      setIsEditing(false);
    } catch (err: any) {
      toast({ title: t('profile.saveFailed', '保存失败'), description: err.message, variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('settings.profile.title', '个人资料')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('settings.profile.subtitle', '管理您的个人信息和账户设置')}</p>
      </div>

      {/* 用户卡片 */}
      <SectionCard>
        <div className="flex items-center gap-5">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
          <button onClick={handleAvatarClick} disabled={avatarUploading} className="relative group">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-brand-primary overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} /> : avatarLetter}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-primary rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:opacity-90 transition-opacity">
              {avatarUploading ? <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </div>
          </button>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{displayName}</h3>
            <p className="text-sm text-slate-500">{t(`roles.${user?.role}`, user?.role || '')}</p>
            <p className="text-sm text-slate-400">{user?.department?.name || t('profile.noDepartment', '未分配部门')}</p>
          </div>
        </div>
      </SectionCard>

      {/* 基本信息 */}
      <SectionCard
        title={t('settings.profile.basicInfo', '基本信息')}
        headerRight={
          !isEditing ? (
            <Button variant="outline" size="sm" onClick={() => { syncProfileFormFromUser(); setIsEditing(true); }} className="text-slate-600">
              <Edit3 className="w-4 h-4 mr-1.5" />
              {t('settings.profile.edit', '编辑资料')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { syncProfileFormFromUser(); setIsEditing(false); }}>{t('common.cancel', '取消')}</Button>
              <Button size="sm" onClick={handleSaveProfile} disabled={profileSaving} className="bg-brand-primary hover:opacity-90">
                {profileSaving && <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />}
                {t('common.save', '保存')}
              </Button>
            </div>
          )
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <div className="space-y-2">
            <Label className="text-slate-500 text-sm flex items-center gap-1.5">
              <User className="w-4 h-4" /> {t('settings.profile.name', '姓名')}
            </Label>
            {isEditing ? (
              <div className="flex gap-2">
                <Input value={profileForm.lastName} onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))} placeholder={t('profile.lastNamePlaceholder', '姓')} className="flex-1" />
                <Input value={profileForm.firstName} onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))} placeholder={t('profile.firstNamePlaceholder', '名')} className="flex-1" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-700">{displayName}</span>
                <MessageSquare className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-500 text-sm flex items-center gap-1.5">
              <Mail className="w-4 h-4" /> {t('settings.profile.email', '邮箱地址')}
            </Label>
            {isEditing ? (
              <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))} placeholder="example@company.com" />
            ) : (
              <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-700">{user?.email || '-'}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-500 text-sm flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> {t('settings.profile.phone', '手机号码')}
            </Label>
            {isEditing ? (
              <Input value={profileForm.phoneNumber} onChange={(e) => setProfileForm(p => ({ ...p, phoneNumber: e.target.value }))} placeholder={t('settings.profile.phonePlaceholder', '请输入手机号码')} />
            ) : (
              <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-400">{(user as any)?.phoneNumber || t('settings.profile.notSet', '未设置')}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-500 text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> {t('settings.profile.department', '所属部门')}
            </Label>
            <div className="px-4 py-2.5 bg-emerald-50 rounded-lg text-emerald-700">{user?.department?.name || t('profile.noDepartment', '未分配')}</div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-500 text-sm flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" /> {t('settings.profile.position', '职位')}
            </Label>
            <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-700">{t(`roles.${user?.role}`, user?.role || '-')}</div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-500 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> {t('settings.profile.bio', '个人简介')}
            </Label>
            {isEditing ? (
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                placeholder={t('settings.profile.bioPlaceholder', '请输入个人简介...')}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary"
                maxLength={500}
              />
            ) : (
              <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-400 min-h-[80px]">
                {(user as any)?.bio || t('settings.profile.noBio', '暂无简介')}
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
