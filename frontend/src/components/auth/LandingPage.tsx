import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileSpreadsheet, BrainCircuit, BarChart2, Zap } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col space-y-20 animate-in fade-in duration-700">
      <section className="relative pt-10 pb-20 sm:pt-16 sm:pb-24 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            Powered by AI Agent
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            {t('heroTitle')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">{t('heroHighlight')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">{t('heroDesc')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onStart} className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 fill-current" />{t('startAudit')}
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-lg hover:bg-slate-50 flex items-center justify-center gap-2">{t('learnMore')}</button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon={<BrainCircuit className="w-8 h-8 text-primary" />} title={t('feature1Title')} desc={t('feature1Desc')} />
          <FeatureCard icon={<BarChart2 className="w-8 h-8 text-emerald-600" />} title={t('feature2Title')} desc={t('feature2Desc')} />
          <FeatureCard icon={<FileSpreadsheet className="w-8 h-8 text-primary" />} title={t('feature3Title')} desc={t('feature3Desc')} />
        </div>
      </section>

      <section className="bg-slate-50 py-20 rounded-3xl mx-4 sm:mx-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">{t('howItWorks')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Step num="1" title={t('step1')} desc={t('step1Desc')} icon={<FileSpreadsheet className="w-6 h-6 text-primary" />} />
            <Step num="2" title={t('step2')} desc={t('step2Desc')} icon={<BrainCircuit className="w-6 h-6 text-primary" />} />
            <Step num="3" title={t('step3')} desc={t('step3Desc')} icon={<BarChart2 className="w-6 h-6 text-primary" />} />
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <div className="bg-slate-900 rounded-2xl p-10 sm:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-6">Ready to streamline your performance reviews?</h2>
            <button onClick={onStart} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-primary/10">
              {t('startAudit')} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">{icon}</div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

interface StepProps {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ num, title, desc, icon }) => (
  <div className="relative flex flex-col items-center text-center">
    <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center shadow-sm z-10 mb-6">
      {icon}
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-primary text-brand-text flex items-center justify-center font-bold border-4 border-white">{num}</div>
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 max-w-xs">{desc}</p>
  </div>
);

export default LandingPage;
