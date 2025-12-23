import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { KPIAnalysisResult, KPIStatus } from '../types';
import i18n from '../i18n';
import React from 'react';

type Language = 'en' | 'zh';

Font.register({ // 注册中文字体
  family: 'NotoSansSC',
  src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf',
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'NotoSansSC', fontSize: 10 },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 22, color: '#4f46e5', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#1e293b', marginBottom: 3 },
  period: { fontSize: 10, color: '#64748b' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  summary: { fontSize: 10, color: '#475569', lineHeight: 1.5 },
  statsRow: { flexDirection: 'row', marginBottom: 10 },
  statBox: { flex: 1, padding: 8, backgroundColor: '#f8fafc', marginRight: 8, borderRadius: 4 },
  statLabel: { fontSize: 8, color: '#64748b', marginBottom: 2 },
  statValue: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  table: { marginTop: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#2563EB', padding: 6 },
  tableHeaderCell: { flex: 1, color: '#ffffff', fontSize: 9, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 6 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 6, backgroundColor: '#f8fafc' },
  tableCell: { flex: 1, fontSize: 9, color: '#334155' },
  excellent: { color: '#10b981' },
  good: { color: '#3b82f6' },
  average: { color: '#f59e0b' },
  poor: { color: '#ef4444' },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#94a3b8' },
  employeeSection: { marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 },
  employeeName: { fontSize: 11, fontWeight: 'bold', color: '#4f46e5', marginBottom: 4 },
  employeeInfo: { fontSize: 9, color: '#64748b', marginBottom: 6 },
  analysis: { fontSize: 9, color: '#475569', lineHeight: 1.4 },
});

const getStatusStyle = (status: KPIStatus) => {
  switch (status) {
    case KPIStatus.EXCELLENT: return styles.excellent;
    case KPIStatus.GOOD: return styles.good;
    case KPIStatus.AVERAGE: return styles.average;
    case KPIStatus.POOR: return styles.poor;
    default: return {};
  }
};


const getStatusLabel = (status: KPIStatus, t: (key: string) => string): string => {
  const statusMap: Record<KPIStatus, string> = {
    [KPIStatus.EXCELLENT]: t('statusExcellent'),
    [KPIStatus.GOOD]: t('statusGood'),
    [KPIStatus.AVERAGE]: t('statusAverage'),
    [KPIStatus.POOR]: t('statusPoor'),
  };
  return statusMap[status] || status;
};

const KPIReportDocument = ({ data, language }: { data: KPIAnalysisResult; language: Language }) => {
  const t = (key: string) => i18n.t(key, { lng: language });
  const totalEmployees = data.employees.length;
  const avgScore = (data.employees.reduce((acc, emp) => acc + emp.totalScore, 0) / totalEmployees).toFixed(1);
  const topPerformer = [...data.employees].sort((a, b) => b.totalScore - a.totalScore)[0];
  const lowPerformer = [...data.employees].sort((a, b) => a.totalScore - b.totalScore)[0];

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'SmartKPI.AI'),
        React.createElement(Text, { style: styles.subtitle }, t('reportTitle')),
        React.createElement(Text, { style: styles.period }, `${t('period')}: ${data.period}`)
      ),
      // Summary
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, t('execSummary')),
        React.createElement(Text, { style: styles.summary }, data.summary)
      ),
      // Stats
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, language === 'zh' ? '统计概览' : 'Statistics'),
        React.createElement(View, { style: styles.statsRow },
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statLabel }, t('teamAvg')),
            React.createElement(Text, { style: styles.statValue }, `${avgScore}%`)
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statLabel }, t('totalEmp')),
            React.createElement(Text, { style: styles.statValue }, String(totalEmployees))
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statLabel }, t('topPerf')),
            React.createElement(Text, { style: styles.statValue }, `${topPerformer?.name} (${topPerformer?.totalScore}%)`)
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statLabel }, t('lowPerf')),
            React.createElement(Text, { style: styles.statValue }, `${lowPerformer?.name} (${lowPerformer?.totalScore}%)`)
          )
        )
      ),
      // Employee Table
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, t('detailedRecords')),
        React.createElement(View, { style: styles.table },
          React.createElement(View, { style: styles.tableHeader },
            React.createElement(Text, { style: styles.tableHeaderCell }, language === 'zh' ? '员工' : 'Employee'),
            React.createElement(Text, { style: styles.tableHeaderCell }, language === 'zh' ? '部门' : 'Department'),
            React.createElement(Text, { style: styles.tableHeaderCell }, language === 'zh' ? '总分' : 'Score'),
            React.createElement(Text, { style: styles.tableHeaderCell }, language === 'zh' ? '状态' : 'Status')
          ),
          ...data.employees.map((emp, i) =>
            React.createElement(View, { key: emp.id, style: i % 2 === 0 ? styles.tableRow : styles.tableRowAlt },
              React.createElement(Text, { style: styles.tableCell }, emp.name),
              React.createElement(Text, { style: styles.tableCell }, emp.department),
              React.createElement(Text, { style: styles.tableCell }, `${emp.totalScore}%`),
              React.createElement(Text, { style: [styles.tableCell, getStatusStyle(emp.status)] }, getStatusLabel(emp.status, t))
            )
          )
        )
      ),
      // Footer
      React.createElement(Text, { style: styles.footer }, `SmartKPI.AI - ${new Date().toLocaleDateString()}`)
    ),
    // Page 2: Employee Details
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.sectionTitle }, language === 'zh' ? '员工详细分析' : 'Employee Details'),
      ...data.employees.slice(0, 6).map(emp =>
        React.createElement(View, { key: emp.id, style: styles.employeeSection },
          React.createElement(Text, { style: styles.employeeName }, emp.name),
          React.createElement(Text, { style: styles.employeeInfo }, `${emp.department} | ${emp.role} | ${emp.totalScore}%`),
          React.createElement(Text, { style: styles.analysis }, emp.aiAnalysis.slice(0, 200) + (emp.aiAnalysis.length > 200 ? '...' : ''))
        )
      ),
      React.createElement(Text, { style: styles.footer }, `SmartKPI.AI - ${new Date().toLocaleDateString()}`)
    )
  );
};

export const exportKPIReport = async (data: KPIAnalysisResult, language: Language) => {
  const blob = await pdf(React.createElement(KPIReportDocument, { data, language })).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `KPI_Report_${data.period.replace(/\s+/g, '_')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
