import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Languages, CheckCircle, XCircle } from 'lucide-react';
import { Language } from '../../types';
import logoImage from '../../assets/images/Makrite_KPI_logo.png';
import { authApi } from '../../api/auth.api';

interface Props {
  language: Language;
}

export const ResetPasswordPage: React.FC<Props> = ({ language }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(language);

  const handleLangChange = () => {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    setCurrentLang(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('resetPasswordPage.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('resetPasswordPage.passwordTooShort'));
      return;
    }

    if (!token) {
      setError(t('resetPasswordPage.invalidToken'));
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000); // 3秒后跳转登录页
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(errorMessage || t('resetPasswordPage.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Token无效页面
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t('resetPasswordPage.invalidLink')}
            </h2>
            <p className="text-slate-500 mb-6">
              {t('resetPasswordPage.invalidLinkDesc')}
            </p>
            <Link
              to="/forgot-password"
              className="inline-block w-full py-3 px-4 bg-brand-primary hover:opacity-90 text-brand-text font-medium rounded-lg transition-all text-center"
            >
              {t('resetPasswordPage.requestNewLink')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative">
      {/* Language Toggle */}
      <button
        onClick={handleLangChange}
        className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors"
      >
        <Languages className="w-3.5 h-3.5" />
        <span>{currentLang === 'zh' ? 'EN' : '中文'}</span>
      </button>

      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
              <img src={logoImage} alt="Makrite KPI" className="h-6 w-auto" />
            </div>
            <span className="text-xl font-semibold text-slate-900">Makrite KPI</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {success ? (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {t('resetPasswordPage.success')}
              </h2>
              <p className="text-slate-500 mb-6">
                {t('resetPasswordPage.successDesc')}
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-3 px-4 bg-brand-primary hover:opacity-90 text-brand-text font-medium rounded-lg transition-all text-center"
              >
                {t('resetPasswordPage.goToLogin')}
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {t('resetPasswordPage.title')}
                </h2>
                <p className="text-slate-500 mt-2 text-sm">
                  {t('resetPasswordPage.description')}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t('resetPasswordPage.newPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all outline-none"
                      placeholder="********"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t('resetPasswordPage.confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all outline-none"
                      placeholder="********"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-brand-primary hover:opacity-90 text-brand-text font-medium rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('resetPasswordPage.resetButton')
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          &copy; 2025 SmartKPI Audit AI. {t('allRightsReserved')}.
        </p>
      </div>
    </div>
  );
};
