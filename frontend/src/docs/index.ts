import gettingStarted from './getting-started.md?raw';
import kpiManagement from './kpi-management.md?raw';
import dataEntry from './data-entry.md?raw';
import reports from './reports.md?raw';
import assessment from './assessment.md?raw';
import teamManagement from './team-management.md?raw';
import permissions from './permissions.md?raw';
import systemSettings from './system-settings.md?raw';

export interface DocItem {
  id: string;
  title: string;
  icon: string;
  content: string;
}

export const docs: DocItem[] = [
  { id: 'getting-started', title: '快速入门', icon: 'Rocket', content: gettingStarted },
  { id: 'kpi-management', title: 'KPI管理', icon: 'Target', content: kpiManagement },
  { id: 'data-entry', title: '数据录入', icon: 'FileSpreadsheet', content: dataEntry },
  { id: 'reports', title: '报表查看', icon: 'FileText', content: reports },
  { id: 'assessment', title: '考核周期', icon: 'Calendar', content: assessment },
  { id: 'team-management', title: '团队管理', icon: 'Users', content: teamManagement },
  { id: 'permissions', title: '权限设置', icon: 'Shield', content: permissions },
  { id: 'system-settings', title: '系统设置', icon: 'Settings', content: systemSettings },
];

export const getDocById = (id: string): DocItem | undefined => docs.find(d => d.id === id);
