import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsApi, GroupStats } from '../api/groups.api';
import { companiesApi, CompanyStats } from '../api/companies.api';
import { Language } from '../types';
import { Building2, Users, Briefcase, LayoutGrid, ChevronRight, Settings } from 'lucide-react';
import OrganizationOverview from './OrganizationOverview';
import CompanyList from './CompanyList';
import DepartmentManagement from './DepartmentManagement';
import UserManagement from './UserManagement';
import GroupSettings from './GroupSettings';
import { translations } from '../utils/i18n';

interface Props {
  language: Language;
}

type SidebarView = 'overview' | 'group-settings' | 'companies' | 'departments' | 'users';

const OrganizationManagement: React.FC<Props> = ({ language }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<SidebarView>('overview');
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [groupName, setGroupName] = useState('Makrite');

  const isGroupAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';
  const groupId = user?.groupId || (user as { company?: { groupId?: string } })?.company?.groupId;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      if (isGroupAdmin && groupId) {
        const [group, gStats, cStats] = await Promise.all([
          groupsApi.getGroup(groupId),
          groupsApi.getGroupStats(groupId),
          companiesApi.getStats(),
        ]);
        setGroupName(group.name);
        setGroupStats(gStats);
        setCompanyStats(cStats);
      } else {
        const [company, cStats] = await Promise.all([
          companiesApi.getCompany(),
          companiesApi.getStats(),
        ]);
        setGroupName(company.name);
        setCompanyStats(cStats);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const sidebarItems = [
    { id: 'overview' as SidebarView, icon: LayoutGrid, label: language === 'zh' ? '概览' : 'Overview', visible: true },
    { id: 'group-settings' as SidebarView, icon: Settings, label: language === 'zh' ? '集团设置' : 'Group Settings', visible: isGroupAdmin },
    { id: 'companies' as SidebarView, icon: Building2, label: language === 'zh' ? '子公司' : 'Companies', visible: isGroupAdmin },
    { id: 'departments' as SidebarView, icon: Briefcase, label: language === 'zh' ? '部门' : 'Departments', visible: isGroupAdmin },
    { id: 'users' as SidebarView, icon: Users, label: language === 'zh' ? '用户' : 'Users', visible: isGroupAdmin },
  ];

  const breadcrumbs = [
    { label: language === 'zh' ? '组织管理' : 'Organization', active: currentView === 'overview' },
    { label: sidebarItems.find(item => item.id === currentView)?.label || '', active: true },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 统计卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* 集团/公司信息卡片 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{isGroupAdmin ? (language === 'zh' ? '集团' : 'Group') : (language === 'zh' ? '公司' : 'Company')}</p>
              <p className="text-xl font-bold text-slate-900">{groupName}</p>
            </div>
          </div>
        </div>

        {/* 子公司卡片 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{language === 'zh' ? '子公司' : 'Companies'}</p>
              <p className="text-xl font-bold text-slate-900">{isGroupAdmin ? (groupStats?.totalCompanies || 0) : 1}</p>
            </div>
          </div>
        </div>

        {/* 部门卡片 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{language === 'zh' ? '部门' : 'Departments'}</p>
              <p className="text-xl font-bold text-slate-900">{groupStats?.totalDepartments || companyStats?.departments || 0}</p>
            </div>
          </div>
        </div>

        {/* 用户卡片 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{language === 'zh' ? '用户' : 'Users'}</p>
              <p className="text-xl font-bold text-slate-900">{groupStats?.totalUsers || companyStats?.users || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 面包屑 */}
      <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-4 h-4" />}
            <span className={crumb.active ? 'text-blue-600 font-medium' : ''}>{crumb.label}</span>
          </React.Fragment>
        ))}
      </div>

      {/* 主内容区域：侧边栏 + 内容 */}
      <div className="flex gap-6 flex-1">
        {/* 左侧边栏 */}
        <div className="w-64 bg-white rounded-lg border border-slate-200 p-4 h-fit">
          <nav className="space-y-1">
            {sidebarItems.filter(item => item.visible).map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6">
          {currentView === 'overview' && <OrganizationOverview language={language} />}
          {currentView === 'group-settings' && <GroupSettings language={language} onUpdate={loadStats} />}
          {currentView === 'companies' && <CompanyList language={language} />}
          {currentView === 'departments' && <DepartmentManagement language={language} />}
          {currentView === 'users' && <UserManagement language={language} t={translations[language]} />}
        </div>
      </div>
    </div>
  );
};

export default OrganizationManagement;

