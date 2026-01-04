import React from 'react';
import { Trophy, Medal } from 'lucide-react';

interface DepartmentRankItem {
  departmentId: string;
  departmentName: string;
  score: number;
  employeeCount: number;
  rank: number;
}

interface DepartmentRankingProps {
  departments: DepartmentRankItem[];
}

const getRankBadge = (rank: number) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-slate-500">{rank}</span>;
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

export const DepartmentRanking: React.FC<DepartmentRankingProps> = ({ departments }) => {
  if (departments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">部门排名</h3>
        <p className="text-center text-slate-400 py-8">暂无部门排名数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">部门排名</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.departmentId}
            className="border border-slate-100 rounded-lg p-4 hover:border-slate-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getRankBadge(dept.rank)}
                <span className="font-medium text-slate-900 truncate max-w-[120px]" title={dept.departmentName}>
                  {dept.departmentName}
                </span>
              </div>
              <span className="text-xs text-slate-400">{dept.employeeCount}人</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">{dept.score.toFixed(1)}</span>
                <span className="text-xs text-slate-400">/ 100分</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreColor(dept.score)} rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(dept.score, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export type { DepartmentRankItem };
