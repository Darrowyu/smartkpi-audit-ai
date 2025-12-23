import * as XLSX from 'xlsx';
import { Language } from '../types';

export const downloadTemplate = (lang: Language) => {
  const isZh = lang === 'zh';
  
  const headers = isZh ? {
    empId: "员工ID", name: "姓名", dept: "部门", role: "职位",
    metric: "指标名称", weight: "权重(%)", target: "目标值", actual: "实际完成"
  } : {
    empId: "Employee ID", name: "Name", dept: "Department", role: "Role",
    metric: "Metric Name", weight: "Weight", target: "Target", actual: "Actual"
  };

  const templateData = [
    { [headers.empId]: "EMP001", [headers.name]: isZh ? "张伟" : "Alice Chen", [headers.dept]: isZh ? "销售部" : "Sales", [headers.role]: isZh ? "客户经理" : "Account Executive", [headers.metric]: isZh ? "季度营收" : "Quarterly Revenue", [headers.weight]: 50, [headers.target]: 150000, [headers.actual]: 180000 },
    { [headers.empId]: "EMP001", [headers.name]: isZh ? "张伟" : "Alice Chen", [headers.dept]: isZh ? "销售部" : "Sales", [headers.role]: isZh ? "客户经理" : "Account Executive", [headers.metric]: isZh ? "新客户开发" : "New Leads Generated", [headers.weight]: 30, [headers.target]: 20, [headers.actual]: 25 },
    { [headers.empId]: "EMP001", [headers.name]: isZh ? "张伟" : "Alice Chen", [headers.dept]: isZh ? "销售部" : "Sales", [headers.role]: isZh ? "客户经理" : "Account Executive", [headers.metric]: isZh ? "CRM合规率" : "CRM Compliance", [headers.weight]: 20, [headers.target]: 100, [headers.actual]: 95 },
    { [headers.empId]: "EMP002", [headers.name]: isZh ? "李娜" : "Bob Smith", [headers.dept]: isZh ? "研发部" : "Engineering", [headers.role]: isZh ? "前端开发" : "Frontend Dev", [headers.metric]: isZh ? "Sprint完成率" : "Sprint Completion Rate", [headers.weight]: 60, [headers.target]: 90, [headers.actual]: 85 },
    { [headers.empId]: "EMP002", [headers.name]: isZh ? "李娜" : "Bob Smith", [headers.dept]: isZh ? "研发部" : "Engineering", [headers.role]: isZh ? "前端开发" : "Frontend Dev", [headers.metric]: isZh ? "代码评审参与度" : "Code Review Participation", [headers.weight]: 40, [headers.target]: 50, [headers.actual]: 45 }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "KPI_Template");
  worksheet['!cols'] = [{wch: 12}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 25}, {wch: 10}, {wch: 10}, {wch: 10}];
  XLSX.writeFile(workbook, isZh ? "KPI_考核模板.xlsx" : "KPI_Assessment_Template.xlsx");
};
