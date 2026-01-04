import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Search, ChevronDown, FileText, Mail, ArrowRight, X } from 'lucide-react';
import { SectionCard } from '../components/SectionCard';
import { docs } from '@/docs';

interface FAQItem {
  question: string;
  answer: string;
}

interface SearchResult {
  docId: string;
  title: string;
  matches: string[];
}

const FAQ_ITEMS: FAQItem[] = [
  { question: '如何创建新的KPI指标？', answer: '进入KPI库页面，点击"新建KPI"按钮，填写指标名称、计算方式、目标值等信息后保存即可。' },
  { question: '如何查看团队成员的KPI进度？', answer: '在团队管理页面，选择对应的团队成员，即可查看其KPI完成情况和历史记录。' },
  { question: '如何设置KPI提醒？', answer: '在通知设置中开启KPI提醒功能，系统会在截止日期前自动发送提醒通知。' },
  { question: '如何导出KPI报告？', answer: '在报表页面，选择需要导出的数据范围和格式，点击"导出"按钮即可下载报告。' },
  { question: '忘记密码怎么办？', answer: '在登录页面点击"忘记密码"，输入注册邮箱，系统会发送密码重置链接到您的邮箱。' },
];

const RESOURCES = [
  { icon: FileText, title: '使用手册', desc: '详细的功能使用说明', color: 'bg-primary/10 text-primary', action: 'manual' },
  { icon: Mail, title: '邮件支持', desc: '发送邮件获取帮助', color: 'bg-amber-50 text-amber-600', action: 'email' },
];

const extractMatchContext = (content: string, query: string, contextLength = 50): string[] => {
  const matches: string[] = [];
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let startIndex = 0;
  while (matches.length < 3) {
    const index = lowerContent.indexOf(lowerQuery, startIndex);
    if (index === -1) break;
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + query.length + contextLength);
    let match = content.slice(start, end).replace(/\n/g, ' ').replace(/#{1,6}\s*/g, '').replace(/\*{1,2}/g, '').replace(/\|/g, ' ');
    if (start > 0) match = '...' + match;
    if (end < content.length) match = match + '...';
    matches.push(match);
    startIndex = index + query.length;
  }
  return matches;
};

export const HelpTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleResourceClick = (action: string) => {
    switch (action) {
      case 'manual': navigate('/app/help'); break;
      case 'email': window.location.href = 'mailto:support@makrite.com?subject=KPI系统帮助请求'; break;
      default: break;
    }
  };

  const docSearchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return docs
      .filter(doc => doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q))
      .map(doc => ({ docId: doc.id, title: doc.title, matches: extractMatchContext(doc.content, searchQuery) }))
      .slice(0, 5);
  }, [searchQuery]);

  const filteredFAQ = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = () => setShowResults(true);
  const handleResultClick = (docId: string) => { navigate(`/app/help/${docId}`); setShowResults(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('settings.help.title', '帮助与支持')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('settings.help.subtitle', '获取帮助和联系支持团队')}</p>
      </div>

      {/* 快速搜索 */}
      <SectionCard icon={<HelpCircle className="w-5 h-5" />} title={t('settings.help.quickSearch', '快速搜索')} description={t('settings.help.quickSearchDesc', '搜索常见问题和帮助文档')}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowResults(true)}
                placeholder={t('settings.help.searchPlaceholder', '输入关键词搜索帮助...')}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={handleSearch} className="px-4 py-2 bg-brand-primary text-brand-text rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Search className="w-4 h-4" />
              {t('settings.help.search', '搜索')}
            </button>
          </div>

          {/* 搜索结果 */}
          {showResults && searchQuery.length >= 2 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {docSearchResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {docSearchResults.map((result) => (
                    <button
                      key={result.docId}
                      onClick={() => handleResultClick(result.docId)}
                      className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="font-medium text-slate-800">{result.title}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                      {result.matches.length > 0 && (
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                          {result.matches[0]}
                        </p>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => { navigate('/app/help'); setShowResults(false); }}
                    className="w-full p-3 text-center text-sm text-primary hover:bg-slate-50 transition-colors"
                  >
                    {t('settings.help.viewAllDocs', '查看全部帮助文档')} →
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500">
                  <p>{t('settings.help.noResults', '未找到相关文档')}</p>
                  <button
                    onClick={() => navigate('/app/help')}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    {t('settings.help.browseAll', '浏览全部帮助文档')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* 常见问题 */}
      <SectionCard title={t('settings.help.faq', '常见问题')}>
        <div className="divide-y divide-slate-100">
          {filteredFAQ.map((item, index) => (
            <div key={index} className="py-3">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-brand-primary font-medium hover:underline">{item.question}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedFAQ === index ? 'rotate-180' : ''}`} />
              </button>
              {expandedFAQ === index && (
                <p className="mt-2 text-sm text-slate-600 pl-0">{item.answer}</p>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 帮助资源 */}
      <SectionCard title={t('settings.help.resources', '帮助资源')}>
        <div className="grid grid-cols-2 gap-4">
          {RESOURCES.map((item, index) => {
            const Icon = item.icon;
            return (
              <button key={index} onClick={() => handleResourceClick(item.action)} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-brand-primary">{item.title}</div>
                  <div className="text-sm text-slate-500">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* 需要更多帮助 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{t('settings.help.needMore', '需要更多帮助？')}</h3>
          <p className="text-sm text-slate-500">{t('settings.help.needMoreDesc', '我们的支持团队随时为您提供帮助')}</p>
        </div>
        <button className="px-4 py-2 bg-brand-primary text-brand-text rounded-lg hover:opacity-90 transition-opacity">
          {t('settings.help.contactSupport', '联系管理员')}
        </button>
      </div>

      {/* 版本信息 */}
      <div className="text-center text-sm text-slate-400 py-4">
        <p>KPI绩效管理系统 v{__APP_VERSION__}</p>
        <p>© 2025 Makrite. All rights reserved.</p>
      </div>
    </div>
  );
};
