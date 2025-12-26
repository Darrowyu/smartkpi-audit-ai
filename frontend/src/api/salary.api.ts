import { apiClient } from './client';

export interface SalaryCoefficient {
  id: string;
  grade: string;
  coefficient: number;
  periodId?: string;
  createdAt: string;
}

export interface SalaryCalculation {
  id: string;
  employeeId: string;
  employee?: { name: string; department?: { name: string } };
  periodId: string;
  performanceScore: number;
  performanceGrade: string;
  coefficient: number;
  baseSalary?: number;
  bonusAmount?: number;
  createdAt: string;
}

export const salaryApi = {
  getCoefficients: (periodId?: string) =>
    apiClient.get<SalaryCoefficient[]>('/salary/coefficients', { params: { periodId } }).then(r => r.data),
  
  saveCoefficients: (coefficients: Record<string, number>, periodId?: string) =>
    apiClient.post('/salary/coefficients', { coefficients, periodId }).then(r => r.data),
  
  calculateSalary: (periodId: string) =>
    apiClient.post<SalaryCalculation[]>(`/salary/calculate/${periodId}`).then(r => r.data),
  
  getCalculations: (periodId: string) =>
    apiClient.get<SalaryCalculation[]>(`/salary/calculations/${periodId}`).then(r => r.data),
  
  exportSalaryData: (periodId: string, format: 'csv' | 'excel' = 'csv') =>
    apiClient.get(`/salary/export/${periodId}`, { params: { format }, responseType: 'blob' }).then(r => r.data),
};
