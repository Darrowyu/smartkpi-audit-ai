import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import LandingPage from './components/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import OrganizationManagement from './components/OrganizationManagement';
import CompanySettings from './components/CompanySettings';
import { SidebarLayout } from './components/layout/SidebarLayout';
import { DashboardView, KPIManagementView, TeamManagementView, ReportsView, KPILibraryView, AssessmentPeriodView, DataEntryView, PermissionsView } from './components/views';
import { AuthProvider, useAuth } from './context/AuthContext';
import { filesApi } from './api/files.api';
import { kpiAnalysisApi } from './api/kpi-analysis.api';
import { KPIAnalysisResult, Language, View } from './types';
import { translations } from './utils/i18n';
import { ArrowLeft } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [language, setLanguage] = useState<Language>((user?.language as Language) || 'zh');
  const [currentView, setCurrentView] = useState<View>('landing');

  const [_analysisResult, setAnalysisResult] = useState<KPIAnalysisResult | null>(null); // 保留用于历史记录功能
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage language={language} onSuccess={() => setCurrentView('landing')} />;
  }

  const handleFileSelect = async (file: File, period: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const uploadedFile = await filesApi.upload(file);
      const analysis = await kpiAnalysisApi.analyze(uploadedFile.id, language, period);
      const result = analysis.rawResult as KPIAnalysisResult;
      // 使用用户选择的周期覆盖AI推断的周期
      result.period = period;
      setAnalysisResult(result);
      setCurrentView('dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHistorySelect = (result: KPIAnalysisResult) => {
    setAnalysisResult(result);
    setCurrentView('dashboard');
  };

  const renderSidebarContent = () => {
    // 首页
    if (currentView === 'landing') return <LandingPage onStart={() => setCurrentView('dashboard')} t={t} />;

    // 仪表盘页面
    if (currentView === 'dashboard') return <DashboardView language={language} />;

    // KPI管理页面
    if (currentView === 'kpi-management') return <KPIManagementView language={language} />;

    // 团队管理页面
    if (currentView === 'team-management') return <TeamManagementView language={language} />;

    // 报告/审计页面
    if (currentView === 'reports') return <ReportsView language={language} onFileSelect={handleFileSelect} isProcessing={isProcessing} error={error} />;

    // NEW: KPI 指标库页面
    if (currentView === 'kpi-library') return <KPILibraryView />;

    // NEW: 考核周期管理页面
    if (currentView === 'assessment') return <AssessmentPeriodView />;

    // NEW: 数据填报页面
    if (currentView === 'data-entry') return <DataEntryView />;

    // NEW: 权限管理页面
    if (currentView === 'permissions') return <PermissionsView />;

    // 历史记录页面
    if (currentView === 'history') return <HistoryView onSelectResult={handleHistorySelect} t={t} language={language} />;

    // 组织管理页面
    if (currentView === 'organization') return <OrganizationManagement language={language} />;

    // 公司设置页面
    if (currentView === 'company') return <CompanySettings language={language} t={t} />;

    // 设置页面
    if (currentView === 'settings') return <SettingsView language={language} setLanguage={setLanguage} t={t} onLogout={logout} />;

    // 上传页面
    if (currentView === 'upload') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="w-full max-w-2xl">
            <button onClick={() => setCurrentView('landing')} className="mb-6 text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" />{t.backToHome}
            </button>
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-3xl font-bold text-slate-900">{t.uploadTitle}</h2>
              <p className="text-slate-500">{t.demoTip}</p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} error={error} language={language} t={t} />
          </div>
        </div>
      );
    }

    return null;
  };

  // 所有页面都使用侧边栏布局
  return (
    <SidebarLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      language={language}
      setLanguage={setLanguage}
      onLogout={logout}
    >
      {renderSidebarContent()}
    </SidebarLayout>
  );
};

const App: React.FC = () => (<AuthProvider><AppContent /></AuthProvider>);
export default App;
