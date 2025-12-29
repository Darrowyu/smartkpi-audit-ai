import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Languages, CheckCircle, User } from 'lucide-react';
import { Language } from '../../types';
import logoImage from '../../assets/images/Makrite_KPI_logo.png';
import { authApi } from '../../api/auth.api';

interface Props {
  language: Language;
}

export const ForgotPasswordPage: React.FC<Props> = ({ language }) => {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
    setLoading(true);

    try {
      await authApi.forgotPassword(username, email);
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(errorMessage || t('forgotPasswordPage.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

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
                {t('forgotPasswordPage.emailSent')}
              </h2>
              <p className="text-slate-500 mb-6">
                {t('forgotPasswordPage.checkInbox')}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-primary font-medium hover:opacity-90 transition-opacity"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('forgotPasswordPage.backToLogin')}
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {t('forgotPasswordPage.title')}
                </h2>
                <p className="text-slate-500 mt-2 text-sm">
                  {t('forgotPasswordPage.description')}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t('username')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all outline-none"
                      placeholder={t('forgotPasswordPage.usernamePlaceholder', '请输入用户名')}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all outline-none"
                      placeholder={t('forgotPasswordPage.emailPlaceholder')}
                      required
                    />
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
                    t('forgotPasswordPage.sendLink')
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('forgotPasswordPage.backToLogin')}
                </Link>
              </div>
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
