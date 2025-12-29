import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Language } from '../../types';
import { Eye, EyeOff, LayoutDashboard, BarChart3, ShieldCheck, Languages } from 'lucide-react';
import logoImage from '../../assets/images/Makrite_KPI_logo.png';

const REMEMBER_KEY = 'smartkpi_remember_username'; // 仅记住用户名，不存储密码

interface Props {
  language: Language;
  onSuccess: () => void;
}

export const LoginPage: React.FC<Props> = ({ language, onSuccess }) => {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(language);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem(REMEMBER_KEY);
      if (savedUsername) {
        setUsername(savedUsername);
        setRememberMe(true);
      }
    } catch { /* ignore */ }
  }, []);

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
      await login(username, password);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, username); // 仅存储用户名
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(errorMessage || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side - Brand Area */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-primary relative overflow-hidden flex-col justify-between text-brand-text p-12">
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <img src={logoImage} alt="Makrite KPI" className="h-6 w-auto" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Makrite KPI</span>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-6 tracking-tight">
            <span className="text-brand-text">{t('makeKpiSimple')}</span>
            <br />
            <span className="text-brand-secondary">{t('simpleAgain')}</span>
          </h1>
          <p className="text-brand-text-muted text-lg max-w-md leading-relaxed">
            {t('kpiDesc')}
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-6">
            <FeatureItem
              icon={LayoutDashboard}
              title={t('multiDashboard')}
              desc={t('multiDashboardDesc')}
            />
            <FeatureItem
              icon={BarChart3}
              title={t('intelligentAnalytics')}
              desc={t('intelligentAnalyticsDesc')}
            />
            <FeatureItem
              icon={ShieldCheck}
              title={t('enterpriseSecurity')}
              desc={t('enterpriseSecurityDesc')}
            />
          </div>

          <div className="pt-8 border-t border-brand-text/20 text-brand-text-muted text-sm">
            &copy; 2025 SmartKPI Audit AI. {t('allRightsReserved')}.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white relative">
        {/* Language Toggle */}
        <button
          onClick={handleLangChange}
          className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{currentLang === 'zh' ? 'EN' : '中文'}</span>
        </button>

        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
                <img src={logoImage} alt="Makrite KPI" className="h-6 w-auto" />
              </div>
              <span className="text-xl font-semibold text-slate-900">Makrite KPI</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {t('welcomeBack')}
            </h2>
            <p className="text-slate-500 mt-2">
              {t('enterCredentials')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                placeholder={currentLang === 'zh' ? '请输入用户名' : 'Enter your username'}
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">
                  {t('password')}
                </label>
                <Link to="/forgot-password" className="text-sm text-slate-500 hover:text-brand-primary transition-colors">
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                  placeholder="********"
                  required
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

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary/20 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600 cursor-pointer select-none">
                {t('rememberMe', '记住我')}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-dark text-brand-text font-medium rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('signIn')
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon: Icon, title, desc }: { icon: React.ElementType, title: string, desc: string }) => (
  <div className="flex gap-4 items-start group">
    <div className="p-2 rounded-lg bg-brand-text/10 text-brand-secondary mt-1 group-hover:bg-brand-text/20 group-hover:text-brand-text transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-semibold text-brand-text text-lg">{title}</h3>
      <p className="text-brand-text-muted text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);
