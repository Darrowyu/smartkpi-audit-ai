import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { companiesApi } from '../api/companies.api';
import { getDepartments } from '../api/departments.api';
import { Language } from '../types';
import { ChevronRight, ChevronDown, Building2, Briefcase, Users, Folder } from 'lucide-react';

interface Props {
  language: Language;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'group' | 'company' | 'department';
  count?: number;
  children?: TreeNode[];
}

const OrganizationOverview: React.FC<Props> = ({ language }) => {
  const { user } = useAuth();
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [loading, setLoading] = useState(true);

  const isGroupAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadOrganizationTree();
  }, []);

  const loadOrganizationTree = async () => {
    try {
      if (isGroupAdmin && user?.groupId) {
        // GROUP_ADMIN: 加载所有子公司
        const companiesRes = await companiesApi.getCompanies({ limit: 100 });
        const companies = companiesRes.data;

        // 为每个公司加载部门
        const companiesWithDepts = await Promise.all(
          companies.map(async (company) => {
            try {
              // 注意：这里需要后端支持跨公司查询部门，或者前端切换context
              // 暂时简化处理
              return {
                id: company.id,
                name: company.name,
                type: 'company' as const,
                count: company._count?.users || 0,
                children: [],
              };
            } catch {
              return {
                id: company.id,
                name: company.name,
                type: 'company' as const,
                count: company._count?.users || 0,
                children: [],
              };
            }
          })
        );

        setTreeData({
          id: 'root',
          name: user.company?.name || 'Makrite',
          type: 'group',
          children: companiesWithDepts,
        });
      } else {
        // ADMIN: 只显示当前公司和部门
        const [company, deptsRes] = await Promise.all([
          companiesApi.getCompany(),
          getDepartments({ limit: 100 }),
        ]);

        const departments: TreeNode[] = deptsRes.data.map(dept => ({
          id: dept.id,
          name: dept.name,
          type: 'department',
          count: dept._count?.users || 0,
        }));

        setTreeData({
          id: 'root',
          name: company.name,
          type: 'company',
          children: departments,
        });
      }
    } catch (e) {
      console.error('Failed to load organization tree:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: TreeNode, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const getIcon = () => {
      if (node.type === 'group') return <Folder className="w-5 h-5 text-blue-600" />;
      if (node.type === 'company') return <Building2 className="w-5 h-5 text-green-600" />;
      if (node.type === 'department') return <Briefcase className="w-5 h-5 text-purple-600" />;
      return <Users className="w-5 h-5 text-orange-600" />;
    };

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-slate-50 rounded-lg cursor-pointer"
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )
          ) : (
            <div className="w-4" />
          )}
          {getIcon()}
          <span className="font-medium text-slate-900">{node.name}</span>
          {node.count !== undefined && (
            <span className="ml-auto text-sm text-slate-500">
              {node.count} {language === 'zh' ? '人' : 'users'}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">{language === 'zh' ? '加载中...' : 'Loading...'}</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        {language === 'zh' ? '组织架构' : 'Organization Structure'}
      </h3>
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
        {treeData && renderNode(treeData)}
      </div>
    </div>
  );
};

export default OrganizationOverview;

