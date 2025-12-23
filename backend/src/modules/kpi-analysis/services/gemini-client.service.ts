import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

export interface KPIMetric {
  name: string;
  weight: number;
  targetValue: string;
  actualValue: string;
  score: number;
  comment: string;
}

export interface EmployeeKPI {
  id: string;
  name: string;
  department: string;
  role: string;
  totalScore: number;
  status: 'Excellent' | 'Good' | 'Average' | 'Poor';
  metrics: KPIMetric[];
  aiAnalysis: string;
}

export interface KPIAnalysisResult {
  summary: string;
  period: string;
  employees: EmployeeKPI[];
}

const kpiSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: 'Executive summary of team performance.' },
    period: { type: Type.STRING, description: "Time period (e.g., 'Q3 2024')." },
    employees: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          department: { type: Type.STRING },
          role: { type: Type.STRING },
          totalScore: { type: Type.NUMBER },
          status: { type: Type.STRING, description: "Must be: 'Excellent', 'Good', 'Average', 'Poor'" },
          aiAnalysis: { type: Type.STRING },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                weight: { type: Type.NUMBER },
                targetValue: { type: Type.STRING },
                actualValue: { type: Type.STRING },
                score: { type: Type.NUMBER },
                comment: { type: Type.STRING },
              },
              required: ['name', 'score', 'actualValue', 'targetValue', 'weight', 'comment'],
            },
          },
        },
        required: ['id', 'name', 'totalScore', 'status', 'metrics', 'department', 'role', 'aiAnalysis'],
      },
    },
  },
  required: ['summary', 'employees', 'period'],
};

@Injectable()
export class GeminiClientService {
  private ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    // 设置全局代理环境变量
    const proxyUrl = this.configService.get<string>('HTTPS_PROXY');
    if (proxyUrl) {
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.HTTP_PROXY = proxyUrl;
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  async analyzeKPIData(csvData: string, language: 'en' | 'zh' = 'en'): Promise<KPIAnalysisResult> {
    try {
      const prompt = `
        You are an expert HR Performance Analyst.
        Analyze the following raw data extracted from an Excel file regarding Employee KPIs.
        
        Raw Data (CSV format):
        ${csvData}

        INSTRUCTIONS:
        1. Parse the data to identify employees and their specific KPI metrics.
        2. If specific columns for 'Weight', 'Target', 'Actual' are not explicitly named, infer them from context.
        3. Calculate the 'Total Score' for each employee if not provided. Use weighted average: Sum(Metric Score * Weight %).
        4. If individual metric scores are missing, calculate them: (Actual / Target) * 100.
        5. Assign status based on Total Score: >90 Excellent, >75 Good, >60 Average, else Poor.
        6. Provide a 'summary' of the entire dataset.
        7. Return ONLY valid JSON matching the provided schema.
        8. Generate 'summary', 'aiAnalysis', and 'comment' fields in ${language === 'zh' ? 'Chinese (Simplified)' : 'English'}.
        9. Keep 'status' values as English: 'Excellent', 'Good', 'Average', 'Poor'.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: kpiSchema,
          temperature: 0.2,
        },
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error('No response from AI');

      return JSON.parse(jsonText) as KPIAnalysisResult;
    } catch (error) {
      console.error('Gemini Analysis Error:', error);
      throw new InternalServerErrorException('Failed to analyze KPI data');
    }
  }
}
