import React, { useState, useMemo, useEffect, createElement, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, Menu, X, Rocket, Target, FileSpreadsheet, FileText, Calendar, Users, Shield, Settings, type LucideIcon } from 'lucide-react';
import { docs, getDocById, type DocItem } from '@/docs';

const iconMap: Record<string, LucideIcon> = {
  Rocket, Target, FileSpreadsheet, FileText, Calendar, Users, Shield, Settings,
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const [Component, setComponent] = useState<React.ComponentType<{ children: string; remarkPlugins?: unknown[] }> | null>(null);
  const [remarkGfm, setRemarkGfm] = useState<unknown>(null);

  useEffect(() => {
    Promise.all([
      import('react-markdown'),
      import('remark-gfm'),
    ]).then(([md, gfm]) => {
      setComponent(() => md.default as React.ComponentType<{ children: string; remarkPlugins?: unknown[] }>);
      setRemarkGfm(() => gfm.default);
    });
  }, []);

  if (!Component || !remarkGfm) return <div className="animate-pulse bg-muted h-40 rounded-lg" />;

  return createElement(Component, { children: content, remarkPlugins: [remarkGfm] });
};

export const HelpCenterView: React.FC = () => {
  const { t } = useTranslation();
  const { docId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  const currentDocId = docId || 'getting-started';
  const currentDoc = getDocById(currentDocId) || docs[0];

  useEffect(() => {
    setMobileMenuOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [docId]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    const q = searchQuery.toLowerCase();
    return docs.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleDocClick = (id: string) => {
    navigate(`/app/help/${id}`);
    setMobileMenuOpen(false);
  };

  const DocList = ({ items }: { items: DocItem[] }) => (
    <div className="space-y-1">
      {items.map((doc) => {
        const Icon = iconMap[doc.icon] || FileText;
        const isActive = doc.id === currentDocId;
        return (
          <button
            key={doc.id}
            onClick={() => handleDocClick(doc.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{doc.title}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* 顶部栏 */}
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors" title={t('common.back', '返回')}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">{t('help.title', '帮助中心')}</h1>
        <div className="flex-1" />
        {/* 搜索框 - 桌面端 */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted rounded-lg w-64">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('help.searchPlaceholder', '搜索文档...')}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {/* 移动端菜单按钮 */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 移动端搜索框 */}
      <div className="md:hidden py-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('help.searchPlaceholder', '搜索文档...')}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex gap-6 pt-4 overflow-hidden">
        {/* 左侧目录 - 桌面端 */}
        <aside className="hidden md:block w-60 flex-shrink-0 overflow-y-auto pr-2">
          <DocList items={filteredDocs} />
        </aside>

        {/* 移动端目录抽屉 */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">{t('help.toc', '目录')}</h2>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-muted rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <DocList items={filteredDocs} />
            </div>
          </div>
        )}

        {/* 右侧文档内容 */}
        <main ref={contentRef} className="flex-1 overflow-y-auto pr-4">
          <article className="prose prose-slate dark:prose-invert max-w-4xl
            prose-headings:font-semibold prose-headings:text-foreground
            prose-h1:text-2xl prose-h1:border-b prose-h1:border-border prose-h1:pb-3 prose-h1:mb-6
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-muted-foreground prose-p:leading-7 prose-p:my-4
            prose-li:text-muted-foreground prose-li:my-1
            prose-ul:my-4 prose-ol:my-4
            prose-strong:text-foreground prose-strong:font-semibold
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-muted-foreground
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
            prose-table:text-sm prose-table:border prose-table:border-border
            prose-th:bg-muted prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:font-medium prose-th:border-border
            prose-td:px-4 prose-td:py-2.5 prose-td:border-border
            prose-tr:border-b prose-tr:border-border
            prose-hr:border-border prose-hr:my-8
          ">
            <MarkdownRenderer content={currentDoc.content} />
          </article>

          {/* 底部导航 */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {docs.findIndex(d => d.id === currentDocId) > 0 ? (
              <button
                onClick={() => handleDocClick(docs[docs.findIndex(d => d.id === currentDocId) - 1].id)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {docs[docs.findIndex(d => d.id === currentDocId) - 1].title}
              </button>
            ) : <div />}
            {docs.findIndex(d => d.id === currentDocId) < docs.length - 1 ? (
              <button
                onClick={() => handleDocClick(docs[docs.findIndex(d => d.id === currentDocId) + 1].id)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {docs[docs.findIndex(d => d.id === currentDocId) + 1].title}
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            ) : <div />}
          </div>
        </main>
      </div>
    </div>
  );
};
