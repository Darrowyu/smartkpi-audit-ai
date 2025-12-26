import React, { memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Target, Users, TrendingUp, Shield, Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PublicLandingPage: React.FC = memo(() => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => navigate('/login');

  if (isLoading) return null;
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[var(--mm-background)]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <Header onLogin={handleLogin} />

      {/* Hero Section */}
      <HeroSection onLogin={handleLogin} />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Stats Section (Inverted) */}
      <StatsSection />

      {/* CTA Section */}
      <CTASection onLogin={handleLogin} />

      {/* Footer */}
      <Footer />
    </div>
  );
});

PublicLandingPage.displayName = 'PublicLandingPage';

/* Header */
const Header: React.FC<{ onLogin: () => void }> = memo(({ onLogin }) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--mm-background)]/80 backdrop-blur-md border-b border-[var(--mm-border)]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 mm-gradient-bg rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-[var(--mm-foreground)] tracking-tight">SmartKPI</span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-[var(--mm-muted-foreground)] hover:text-[var(--mm-foreground)] transition-colors">功能特性</a>
          <a href="#how-it-works" className="text-sm text-[var(--mm-muted-foreground)] hover:text-[var(--mm-foreground)] transition-colors">使用流程</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-4 py-2 text-sm font-medium text-[var(--mm-foreground)] hover:bg-[var(--mm-muted)] rounded-lg transition-colors"
          >
            登录
          </button>
          <button
            onClick={onLogin}
            className="px-4 py-2 text-sm font-medium text-white mm-gradient-bg rounded-xl mm-btn-lift hover:brightness-110 mm-shadow-accent"
          >
            注册
          </button>
        </div>
      </div>
    </div>
  </header>
));

Header.displayName = 'Header';

/* Hero Section */
const HeroSection: React.FC<{ onLogin: () => void }> = memo(({ onLogin }) => (
  <section className="pt-32 pb-20 sm:pt-40 sm:pb-32 relative overflow-hidden">
    {/* Background Glow */}
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--mm-accent)] opacity-[0.06] blur-[150px] rounded-full" />
    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--mm-accent-secondary)] opacity-[0.04] blur-[120px] rounded-full" />

    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
        {/* Left - Content */}
        <div className="mm-animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--mm-accent)]/30 bg-[var(--mm-accent)]/5 px-5 py-2 mb-8">
            <span className="h-2 w-2 rounded-full bg-[var(--mm-accent)] mm-animate-pulse-dot" />
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--mm-accent)]">AI 驱动</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-[var(--mm-foreground)] leading-[1.1] tracking-tight mb-6" style={{ fontFamily: "'Georgia', serif" }}>
            让绩效管理
            <br />
            <span className="mm-gradient-text mm-gradient-underline">简单高效</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-[var(--mm-muted-foreground)] max-w-lg mb-10 leading-relaxed">
            SmartKPI 是企业级 AI 绩效管理平台，帮助您轻松设定目标、跟踪进度、分析数据，让团队绩效持续提升。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onLogin}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white mm-gradient-bg rounded-xl mm-btn-lift hover:brightness-110 mm-shadow-accent hover:mm-shadow-accent-lg"
            >
              <Zap className="w-5 h-5" />
              开始使用
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onLogin}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-[var(--mm-foreground)] bg-white border border-[var(--mm-border)] rounded-xl mm-btn-lift hover:bg-[var(--mm-muted)] hover:border-[var(--mm-accent)]/30"
            >
              预约演示
            </button>
          </div>
        </div>

        {/* Right - Hero Graphic */}
        <div className="relative hidden lg:block mm-animate-fade-in-up mm-stagger-2">
          <HeroGraphic />
        </div>
      </div>
    </div>
  </section>
));

HeroSection.displayName = 'HeroSection';

/* Hero Graphic - 参考设计稿的正圆布局 */
const HeroGraphic: React.FC = memo(() => (
  <div className="relative w-[420px] h-[420px] mx-auto">
    {/* 淡蓝色背景渐变 */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#e8f0fe] via-[#f0f4ff] to-transparent rounded-full opacity-60" />

    {/* 外圈虚线圆 - 正圆 */}
    <div 
      className="absolute inset-4 rounded-full mm-animate-rotate-slow"
      style={{ 
        border: '2px dashed rgba(0, 82, 255, 0.2)',
        aspectRatio: '1 / 1'
      }} 
    />

    {/* 内圈虚线圆 - 正圆 */}
    <div 
      className="absolute inset-16 rounded-full"
      style={{ 
        border: '2px dashed rgba(0, 82, 255, 0.15)',
        aspectRatio: '1 / 1'
      }} 
    />

    {/* 中心 KPI 卡片 - 蓝色渐变 */}
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 mm-gradient-bg-135 rounded-2xl shadow-xl flex flex-col items-center justify-center mm-shadow-accent">
      <BarChart3 className="w-10 h-10 text-white mb-2" />
      <span className="text-sm font-medium text-white/90">KPI</span>
    </div>

    {/* 销售额卡片 - 左上 */}
    <div className="absolute top-8 left-0 mm-animate-float">
      <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-[var(--mm-border)]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xs text-[var(--mm-muted-foreground)]">销售额</span>
        </div>
        <div className="text-xl font-bold text-[var(--mm-foreground)]">+24.5%</div>
      </div>
    </div>

    {/* 进度条图标卡片 - 右上 */}
    <div className="absolute top-16 right-0 mm-animate-float-delayed">
      <div className="bg-white rounded-xl p-3 shadow-lg border border-[var(--mm-border)]">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="w-2 rounded-full mm-gradient-bg"
              style={{ height: `${12 + i * 6}px` }}
            />
          ))}
        </div>
      </div>
    </div>

    {/* 目标完成卡片 - 右下 */}
    <div className="absolute bottom-20 right-0 mm-animate-float">
      <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-[var(--mm-border)]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 mm-gradient-bg rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs text-[var(--mm-muted-foreground)]">目标完成</span>
        </div>
        <div className="text-xl font-bold text-[var(--mm-foreground)]">89%</div>
      </div>
    </div>

    {/* 饼图图标卡片 - 左下 */}
    <div className="absolute bottom-24 left-4 mm-animate-float-delayed">
      <div className="w-14 h-14 mm-gradient-bg rounded-xl shadow-lg flex items-center justify-center mm-shadow-accent">
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v10l7 4" />
        </svg>
      </div>
    </div>

    {/* 点阵装饰 - 中左 */}
    <div className="absolute top-1/2 left-20 transform -translate-y-1/2 grid grid-cols-3 gap-1.5">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--mm-accent)]/30" />
      ))}
    </div>
  </div>
));

HeroGraphic.displayName = 'HeroGraphic';

/* Features Section */
const FeaturesSection: React.FC = memo(() => {
  const features = [
    { icon: Target, title: '智能目标设定', desc: 'AI 辅助制定 SMART 目标，自动分解到部门和个人，确保战略对齐', color: 'mm-gradient-bg' },
    { icon: BarChart3, title: '实时数据追踪', desc: '多维度数据看板，实时监控 KPI 进度，异常预警及时响应', color: 'bg-emerald-500' },
    { icon: Users, title: '团队协作管理', desc: '多级组织架构，灵活的权限配置，支持跨部门协同评估', color: 'mm-gradient-bg' },
    { icon: TrendingUp, title: 'AI 分析洞察', desc: 'Gemini AI 深度分析，自动生成改进建议，预测绩效趋势', color: 'bg-amber-500' },
    { icon: Shield, title: '企业级安全', desc: '多租户隔离，数据加密存储，完善的审计日志', color: 'mm-gradient-bg' },
    { icon: Zap, title: '高效流程', desc: '多级审批工作流，自动化计算评分，减少 80% 手工操作', color: 'bg-purple-500' },
  ];

  return (
    <section id="features" className="py-28 bg-[var(--mm-muted)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 mm-animate-fade-in-up">
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--mm-accent)]/30 bg-white px-5 py-2 mb-6">
            <span className="h-2 w-2 rounded-full bg-[var(--mm-accent)]" />
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--mm-accent)]">功能特性</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--mm-foreground)] mb-4" style={{ fontFamily: "'Georgia', serif" }}>
            全方位的<span className="mm-gradient-text">绩效管理</span>工具
          </h2>
          <p className="text-[var(--mm-muted-foreground)] max-w-2xl mx-auto">
            从目标设定到结果分析，SmartKPI 提供一站式解决方案
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = memo(({ icon: Icon, title, desc, color, index }) => (
  <div
    className={`bg-white p-8 rounded-2xl border border-[var(--mm-border)] shadow-sm mm-card-hover group mm-animate-fade-in-up mm-stagger-${Math.min(index + 1, 5)}`}
  >
    <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <h3 className="text-xl font-semibold text-[var(--mm-foreground)] mb-3">{title}</h3>
    <p className="text-[var(--mm-muted-foreground)] leading-relaxed">{desc}</p>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

/* How It Works */
const HowItWorksSection: React.FC = memo(() => {
  const steps = [
    { num: '01', title: '设定目标', desc: '使用 AI 辅助设定年度/季度 KPI，自动分解到部门和个人' },
    { num: '02', title: '跟踪进度', desc: '实时录入数据，系统自动计算完成率，及时发现偏差' },
    { num: '03', title: '多级审批', desc: '自评、主管评、隔级审批，确保评估公正透明' },
    { num: '04', title: '分析优化', desc: 'AI 生成洞察报告，识别改进机会，持续提升绩效' },
  ];

  return (
    <section id="how-it-works" className="py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--mm-accent)]/30 bg-[var(--mm-accent)]/5 px-5 py-2 mb-6">
            <span className="h-2 w-2 rounded-full bg-[var(--mm-accent)]" />
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--mm-accent)]">使用流程</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--mm-foreground)] mb-4" style={{ fontFamily: "'Georgia', serif" }}>
            四步开启<span className="mm-gradient-text">高效管理</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-[var(--mm-border)]">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--mm-accent)]" />
                </div>
              )}

              {/* Step Number */}
              <div className="w-16 h-16 mx-auto mb-6 mm-gradient-bg rounded-2xl flex items-center justify-center mm-shadow-accent">
                <span className="text-xl font-bold text-white">{step.num}</span>
              </div>

              <h3 className="text-lg font-semibold text-[var(--mm-foreground)] mb-2">{step.title}</h3>
              <p className="text-sm text-[var(--mm-muted-foreground)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

HowItWorksSection.displayName = 'HowItWorksSection';

/* Stats Section (Inverted) */
const StatsSection: React.FC = memo(() => {
  const stats = [
    { value: '12', label: '考核周期' },
    { value: '256', label: '员工人数' },
    { value: '89%', label: '目标达成率' },
    { value: '1,024', label: 'KPI指标数' },
  ];

  return (
    <section className="py-20 mm-inverted mm-dot-pattern relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[var(--mm-accent)] opacity-10 blur-[150px] rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mm-gradient-text mb-2">{stat.value}</div>
              <div className="text-white/70 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

StatsSection.displayName = 'StatsSection';

/* CTA Section */
const CTASection: React.FC<{ onLogin: () => void }> = memo(({ onLogin }) => (
  <section className="py-28">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mm-gradient-border">
        <div className="mm-gradient-border-inner p-12 sm:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--mm-foreground)] mb-4" style={{ fontFamily: "'Georgia', serif" }}>
            准备好提升团队<span className="mm-gradient-text">绩效</span>了吗？
          </h2>
          <p className="text-[var(--mm-muted-foreground)] mb-8 max-w-xl mx-auto">
            立即开始免费试用，体验 AI 驱动的智能绩效管理
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onLogin}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white mm-gradient-bg rounded-xl mm-btn-lift hover:brightness-110 mm-shadow-accent hover:mm-shadow-accent-lg"
            >
              免费开始
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onLogin}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-[var(--mm-foreground)] bg-[var(--mm-muted)] rounded-xl mm-btn-lift hover:bg-[var(--mm-border)]"
            >
              联系销售
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
));

CTASection.displayName = 'CTASection';

/* Footer */
const Footer: React.FC = memo(() => (
  <footer className="py-12 border-t border-[var(--mm-border)]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 mm-gradient-bg rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-[var(--mm-foreground)]">SmartKPI</span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6 text-sm text-[var(--mm-muted-foreground)]">
          <a href="#" className="hover:text-[var(--mm-foreground)] transition-colors">关于我们</a>
          <a href="#" className="hover:text-[var(--mm-foreground)] transition-colors">帮助中心</a>
          <a href="#" className="hover:text-[var(--mm-foreground)] transition-colors">隐私政策</a>
          <a href="#" className="hover:text-[var(--mm-foreground)] transition-colors">服务条款</a>
        </nav>

        {/* Copyright */}
        <div className="text-sm text-[var(--mm-muted-foreground)]">
          &copy; 2025 SmartKPI. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
));

Footer.displayName = 'Footer';

export default PublicLandingPage;
