import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Search, ChevronDown, FileText, Video, MessageCircle, Mail } from 'lucide-react';
import { SectionCard } from '../components/SectionCard';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  { question: '如何创建新的KPI指标？', answer: '进入KPI库页面，点击"新建KPI"按钮，填写指标名称、计算方式、目标值等信息后保存即可。' },
  { question: '如何查看团队成员的KPI进度？', answer: '在团队管理页面，选择对应的团队成员，即可查看其KPI完成情况和历史记录。' },
  { question: '如何设置KPI提醒？', answer: '在通知设置中开启KPI提醒功能，系统会在截止日期前自动发送提醒通知。' },
  { question: '如何导出KPI报告？', answer: '在报表页面，选择需要导出的数据范围和格式，点击"导出"按钮即可下载报告。' },
  { question: '忘记密码怎么办？', answer: '在登录页面点击"忘记密码"，输入注册邮箱，系统会发送密码重置链接到您的邮箱。' },
];

const RESOURCES = [
  { icon: FileText, title: '使用手册', desc: '详细的功能使用说明', color: 'bg-primary/10 text-primary' },
  { icon: Video, title: '视频教程', desc: '观看操作演示视频', color: 'bg-purple-50 text-purple-600' },
  { icon: MessageCircle, title: '在线客服', desc: '实时在线咨询', color: 'bg-green-50 text-green-600' },
  { icon: Mail, title: '邮件支持', desc: '发送邮件获取帮助', color: 'bg-amber-50 text-amber-600' },
];

export const HelpTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const filteredFAQ = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('settings.help.title', '帮助与支持')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('settings.help.subtitle', '获取帮助和联系支持团队')}</p>
      </div>

      {/* 快速搜索 */}
      <SectionCard icon={<HelpCircle className="w-5 h-5" />} title={t('settings.help.quickSearch', '快速搜索')} description={t('settings.help.quickSearchDesc', '搜索常见问题和帮助文档')}>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('settings.help.searchPlaceholder', '输入关键词搜索帮助...')}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary"
          />
          <button className="px-4 py-2 bg-brand-primary text-brand-text rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
            <Search className="w-4 h-4" />
            {t('settings.help.search', '搜索')}
          </button>
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
              <button key={index} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left">
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
