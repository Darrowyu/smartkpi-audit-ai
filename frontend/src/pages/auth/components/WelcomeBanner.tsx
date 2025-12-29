import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard } from 'lucide-react';

interface WelcomeStats {
  completionRate: number;
  activeKPIs: number;
  teamMembers: number;
  pendingTasks: number;
}

interface WelcomeBannerProps {
  userName: string;
  stats: WelcomeStats;
  onViewDashboard?: () => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 17) return '下午好';
  if (hour < 19) return '傍晚好';
  return '晚上好';
};

const formatDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `今天是${year}年${month}月${day}日，祝您工作顺利！`;
};

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ userName, stats, onViewDashboard }) => {
  return (
    <div className="bg-gradient-to-r from-brand-primary to-brand-dark rounded-2xl p-6 text-brand-text">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">{getGreeting()}，{userName}</h1>
          <p className="text-brand-text-muted text-sm">{formatDate()}</p>
        </div>
        {onViewDashboard && (
          <Button 
            variant="secondary" 
            className="bg-brand-text/10 hover:bg-brand-text/20 text-brand-text border-brand-text/20 backdrop-blur-sm"
            onClick={onViewDashboard}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            查看仪表盘
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-brand-text/10 backdrop-blur-sm rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.completionRate}%</p>
          <p className="text-brand-text-muted text-sm mt-1">整体完成率</p>
        </div>
        <div className="bg-brand-text/10 backdrop-blur-sm rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.activeKPIs}</p>
          <p className="text-brand-text-muted text-sm mt-1">进行中指标</p>
        </div>
        <div className="bg-brand-text/10 backdrop-blur-sm rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.teamMembers}</p>
          <p className="text-brand-text-muted text-sm mt-1">团队成员</p>
        </div>
        <div className="bg-brand-text/10 backdrop-blur-sm rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.pendingTasks}</p>
          <p className="text-brand-text-muted text-sm mt-1">待处理任务</p>
        </div>
      </div>
    </div>
  );
};

export type { WelcomeStats };
