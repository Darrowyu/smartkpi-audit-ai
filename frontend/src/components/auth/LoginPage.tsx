import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Language } from '../../types';
import { Eye, EyeOff, LayoutDashboard, BarChart3, ShieldCheck } from 'lucide-react';
import logoImage from '../../assets/images/Makrite_KPI_logo.png';

interface Props {
  language: Language;
  onSuccess: () => void;
}

export const LoginPage: React.FC<Props> = ({ language, onSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      setError(errorMessage || (currentLang === 'zh' ? '登录失败' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side - Brand Area */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1E4B8E] relative overflow-hidden flex-col justify-between text-white p-12">
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
            <span className="text-white">{currentLang === 'zh' ? '让绩效' : 'Make KPI'}</span>
            <br />
            <span className="text-[#5B9BD5]">{currentLang === 'zh' ? '回归简单' : 'Simple Again'}</span>
          </h1>
          <p className="text-white/70 text-lg max-w-md leading-relaxed">
            {currentLang === 'zh' 
              ? '结合 AI 技术的下一代绩效管理系统，让数据驱动决策，提升组织效能。' 
              : 'Next-generation performance management system powered by AI. Data-driven decisions for better organizational efficiency.'}
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-6">
            <FeatureItem 
              icon={LayoutDashboard} 
              title={currentLang === 'zh' ? '多维度仪表盘' : 'Multi-dimensional Dashboard'} 
              desc={currentLang === 'zh' ? '实时监控核心指标，全景视图掌控全局' : 'Real-time monitoring of core metrics with panoramic views'} 
            />
            <FeatureItem 
              icon={BarChart3} 
              title={currentLang === 'zh' ? '智能数据分析' : 'Intelligent Analytics'} 
              desc={currentLang === 'zh' ? 'AI 驱动的深度洞察与趋势预测' : 'AI-driven deep insights and trend forecasting'} 
            />
            <FeatureItem 
              icon={ShieldCheck} 
              title={currentLang === 'zh' ? '企业级安全' : 'Enterprise Security'} 
              desc={currentLang === 'zh' ? '基于角色的权限控制与数据加密' : 'Role-based access control and data encryption'} 
            />
          </div>
          
          <div className="pt-8 border-t border-white/20 text-white/50 text-sm">
            &copy; 2025 SmartKPI Audit AI. {currentLang === 'zh' ? '保留所有权利' : 'All rights reserved'}.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1E4B8E] rounded-lg flex items-center justify-center">
                <img src={logoImage} alt="Makrite KPI" className="h-6 w-auto" />
              </div>
              <span className="text-xl font-semibold text-slate-900">Makrite KPI</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {currentLang === 'zh' ? '欢迎回来' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 mt-2">
              {currentLang === 'zh' ? '请输入您的凭证以访问工作台' : 'Please enter your credentials to access workspace'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email/Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {currentLang === 'zh' ? '工作邮箱' : 'Work Email'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-[#1E4B8E] focus:ring-2 focus:ring-[#1E4B8E]/20 transition-all outline-none"
                placeholder="name@company.com"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">
                  {currentLang === 'zh' ? '密码' : 'Password'}
                </label>
                <a href="#" className="text-sm text-slate-500 hover:text-[#1E4B8E] transition-colors">
                  {currentLang === 'zh' ? '忘记密码?' : 'Forgot password?'}
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-[#1E4B8E] focus:ring-2 focus:ring-[#1E4B8E]/20 transition-all outline-none"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#1E4B8E] hover:bg-[#163a6e] text-white font-medium rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                currentLang === 'zh' ? '立即登录' : 'Sign In'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <span className="text-slate-500">
              {currentLang === 'zh' ? '还没有账户?' : 'Don\'t have an account?'}
            </span>
            {' '}
            <a href="#" className="text-[#1E4B8E] font-medium hover:text-[#163a6e] transition-colors">
              {currentLang === 'zh' ? '免费注册' : 'Sign up free'}
            </a>
          </div>

          {/* Demo Hint */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {currentLang === 'zh' ? '演示账户' : 'Demo Account'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="text-slate-600">
                  <span className="text-slate-400 mr-2">User:</span>
                  <span className="font-mono font-medium">admin</span>
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400 mr-2">Pass:</span>
                  <span className="font-mono font-medium">admin123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon: Icon, title, desc }: { icon: React.ElementType, title: string, desc: string }) => (
  <div className="flex gap-4 items-start group">
    <div className="p-2 rounded-lg bg-white/10 text-[#5B9BD5] mt-1 group-hover:bg-white/20 group-hover:text-white transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-semibold text-white text-lg">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);
