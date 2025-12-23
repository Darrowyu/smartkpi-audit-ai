import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Language } from '../../types';
import { BarChart3, CheckCircle } from 'lucide-react';

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
  const [currentLang, setCurrentLang] = useState<Language>(language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || (currentLang === 'zh' ? '登录失败' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* 左侧品牌区域 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 relative overflow-hidden">
        {/* 背景装饰图案 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo 和标题 */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-lg shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                SmartKPI<span className="text-indigo-200">.AI</span>
              </span>
            </div>

            <h1 className="text-4xl font-bold mb-4">{currentLang === 'zh' ? '欢迎回来' : 'Welcome Back'}</h1>
            <p className="text-blue-100 text-lg">
              {currentLang === 'zh' ? 'AI 驱动的 KPI 绩效考核智能分析平台' : 'AI-Powered KPI Performance Analysis Platform'}
            </p>
          </div>

          {/* 功能特性列表 */}
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-200 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">{currentLang === 'zh' ? 'AI 智能分析' : 'AI Smart Analysis'}</h3>
                <p className="text-blue-100 text-sm">{currentLang === 'zh' ? '基于 AI 的自动化绩效评估' : 'Automated performance evaluation powered by AI'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-200 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">{currentLang === 'zh' ? '可视化报告' : 'Visual Reports'}</h3>
                <p className="text-blue-100 text-sm">{currentLang === 'zh' ? '交互式图表和 PDF 导出功能' : 'Interactive charts with PDF export capabilities'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-200 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">{currentLang === 'zh' ? 'Excel 智能解析' : 'Smart Excel Parsing'}</h3>
                <p className="text-blue-100 text-sm">{currentLang === 'zh' ? '灵活识别各种表格结构' : 'Flexible recognition of various table structures'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单区域 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              SmartKPI<span className="text-blue-600">.AI</span>
            </span>
          </div>

          {/* 登录卡片 */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            {/* 标题和语言切换 */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {currentLang === 'zh' ? '登录' : 'Login'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {currentLang === 'zh' ? '输入您的凭据以访问您的账户' : 'Enter your credentials to access your account'}
                </p>
              </div>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentLang('zh')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    currentLang === 'zh' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  中文
                </button>
                <button
                  onClick={() => setCurrentLang('en')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    currentLang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  * {currentLang === 'zh' ? '用户名' : 'Username'}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={currentLang === 'zh' ? '请输入用户名' : 'Please enter username'}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  * {currentLang === 'zh' ? '密码' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={currentLang === 'zh' ? '请输入密码' : 'Please enter password'}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
              >
                {loading ? (currentLang === 'zh' ? '登录中...' : 'Logging in...') : (currentLang === 'zh' ? '登录' : 'Login')}
              </button>
            </form>

            {/* 底部提示 */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-slate-500 text-sm">
                {currentLang === 'zh' ? '演示账号' : 'Demo Account'}
              </p>
              <p className="text-slate-600 text-sm font-medium mt-1">
                {currentLang === 'zh' ? '用户名: admin / 密码: admin123' : 'Username: admin / Password: admin123'}
              </p>
            </div>
          </div>

          {/* 版权信息 */}
          <p className="text-center text-slate-400 text-xs mt-8">
            © 2025 SmartKPI.AI. {currentLang === 'zh' ? '保留所有权利' : 'All rights reserved'}.
          </p>
        </div>
      </div>
    </div>
  );
};
