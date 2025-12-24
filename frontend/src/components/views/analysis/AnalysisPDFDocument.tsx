import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// 注册中文字体 - 使用 Google Fonts 在线字体（更可靠）
Font.register({
    family: 'NotoSansSC',
    src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf',
});

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'NotoSansSC', fontSize: 10 },
    header: { marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
    subtitle: { fontSize: 10, color: '#666' },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
    summaryBox: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 4, marginBottom: 16 },
    summaryText: { fontSize: 10, lineHeight: 1.6, color: '#334155' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    statCard: { flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4, marginHorizontal: 4, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    statLabel: { fontSize: 8, color: '#64748b', marginTop: 2 },
    table: { marginTop: 8 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    cell: { flex: 1 },
    cellName: { flex: 2 },
    headerText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
    cellText: { fontSize: 9, color: '#334155' },
    badge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, fontSize: 8 },
    badgeExcellent: { backgroundColor: '#dcfce7', color: '#166534' },
    badgeGood: { backgroundColor: '#dbeafe', color: '#1e40af' },
    badgeAverage: { backgroundColor: '#fef3c7', color: '#92400e' },
    badgePoor: { backgroundColor: '#fee2e2', color: '#991b1b' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8' },
});

interface EmployeeKPI {
    name: string;
    department: string;
    role: string;
    totalScore: number;
    status: string;
}

interface AnalysisPDFProps {
    fileName: string;
    period: string;
    createdAt: string;
    summary: string;
    employees: EmployeeKPI[];
}

const statusLabels: Record<string, string> = { Excellent: '优秀', Good: '良好', Average: '合格', Poor: '待改进' };

export const AnalysisPDFDocument: React.FC<AnalysisPDFProps> = ({ fileName, period, createdAt, summary, employees }) => {
    const teamAvg = employees.length > 0 ? (employees.reduce((sum, e) => sum + e.totalScore, 0) / employees.length).toFixed(1) : '0';
    const topPerformer = employees.length > 0 ? employees.reduce((a, b) => a.totalScore > b.totalScore ? a : b) : null;
    const ratingCounts = employees.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {} as Record<string, number>);

    const getBadgeStyle = (status: string) => {
        switch (status) {
            case 'Excellent': return styles.badgeExcellent;
            case 'Good': return styles.badgeGood;
            case 'Average': return styles.badgeAverage;
            case 'Poor': return styles.badgePoor;
            default: return styles.badgeAverage;
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>KPI绩效分析报告</Text>
                    <Text style={styles.subtitle}>{fileName} · {period} · {createdAt}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Executive Summary</Text>
                    <View style={styles.summaryBox}><Text style={styles.summaryText}>{summary}</Text></View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}><Text style={styles.statValue}>{teamAvg}%</Text><Text style={styles.statLabel}>团队平均</Text></View>
                    <View style={styles.statCard}><Text style={styles.statValue}>{employees.length}</Text><Text style={styles.statLabel}>参与人数</Text></View>
                    <View style={styles.statCard}><Text style={styles.statValue}>{topPerformer?.name || '-'}</Text><Text style={styles.statLabel}>最佳员工</Text></View>
                    <View style={styles.statCard}><Text style={styles.statValue}>{ratingCounts.Excellent || 0}</Text><Text style={styles.statLabel}>优秀人数</Text></View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 员工绩效明细</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerText, styles.cellName]}>姓名</Text>
                            <Text style={[styles.headerText, styles.cell]}>部门</Text>
                            <Text style={[styles.headerText, styles.cell]}>职位</Text>
                            <Text style={[styles.headerText, styles.cell, { textAlign: 'right' }]}>得分</Text>
                            <Text style={[styles.headerText, styles.cell, { textAlign: 'center' }]}>评级</Text>
                        </View>
                        {employees.map((emp, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.cellText, styles.cellName]}>{emp.name}</Text>
                                <Text style={[styles.cellText, styles.cell]}>{emp.department}</Text>
                                <Text style={[styles.cellText, styles.cell]}>{emp.role}</Text>
                                <Text style={[styles.cellText, styles.cell, { textAlign: 'right', fontWeight: 'bold' }]}>{emp.totalScore}%</Text>
                                <View style={[styles.cell, { alignItems: 'center' }]}>
                                    <Text style={[styles.badge, getBadgeStyle(emp.status)]}>{statusLabels[emp.status] || emp.status}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={styles.footer}>Generated by SmartKPI AI · {new Date().toLocaleDateString('zh-CN')}</Text>
            </Page>
        </Document>
    );
};
