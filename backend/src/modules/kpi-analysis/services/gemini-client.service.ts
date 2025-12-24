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
  strengths: string[]; // 新增：优势
  improvements: string[]; // 新增：待改进项
}

export interface Insight { // 新增：洞察接口
  title: string;
  content: string;
  type: 'positive' | 'warning' | 'info';
}

export interface KPIAnalysisResult {
  summary: string;
  period: string;
  employees: EmployeeKPI[];
  insights: Insight[]; // 新增：团队级洞察
  recommendations: string[]; // 新增：改进建议
  risks: string[]; // 新增：风险预警
}

const kpiSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'Comprehensive executive summary of team performance (200-300 words).',
    },
    period: {
      type: Type.STRING,
      description: "Time period (e.g., 'Q3 2024').",
    },
    insights: { // 新增
      type: Type.ARRAY,
      description: '3-5 key insights about team performance',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Short insight title' },
          content: { type: Type.STRING, description: 'Detailed insight explanation' },
          type: { type: Type.STRING, description: "Must be: 'positive', 'warning', 'info'" },
        },
        required: ['title', 'content', 'type'],
      },
    },
    recommendations: { // 新增
      type: Type.ARRAY,
      description: '3-5 actionable recommendations for improvement',
      items: { type: Type.STRING },
    },
    risks: { // 新增
      type: Type.ARRAY,
      description: 'Potential risks or concerns identified',
      items: { type: Type.STRING },
    },
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
          status: {
            type: Type.STRING,
            description: "Must be: 'Excellent', 'Good', 'Average', 'Poor'",
          },
          aiAnalysis: { type: Type.STRING, description: 'Detailed analysis of employee performance (50-100 words)' },
          strengths: { // 新增
            type: Type.ARRAY,
            description: '2-3 key strengths of this employee',
            items: { type: Type.STRING },
          },
          improvements: { // 新增
            type: Type.ARRAY,
            description: '1-3 areas for improvement',
            items: { type: Type.STRING },
          },
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
                comment: { type: Type.STRING, description: 'Brief analysis of this metric performance' },
              },
              required: ['name', 'score', 'actualValue', 'targetValue', 'weight', 'comment'],
            },
          },
        },
        required: ['id', 'name', 'totalScore', 'status', 'metrics', 'department', 'role', 'aiAnalysis', 'strengths', 'improvements'],
      },
    },
  },
  required: ['summary', 'employees', 'period', 'insights', 'recommendations', 'risks'],
};

@Injectable()
export class GeminiClientService {
  private ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const proxyUrl = this.configService.get<string>('HTTPS_PROXY'); // 设置全局代理环境变量
    if (proxyUrl) {
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.HTTP_PROXY = proxyUrl;
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  async analyzeKPIData(csvData: string, language: 'en' | 'zh' = 'en'): Promise<KPIAnalysisResult> {
    try {
      const langInstruction = language === 'zh'
        ? '使用简体中文生成所有文本内容（summary, aiAnalysis, insights, recommendations, risks, strengths, improvements, comment）'
        : 'Generate all text content in English';

      const prompt = `
        You are an expert HR Performance Analyst with deep expertise in KPI evaluation and employee development.
        Analyze the following employee KPI data and provide comprehensive insights.
        
        Raw Data (CSV format):
        ${csvData}

        ANALYSIS INSTRUCTIONS:
        1. Parse the data to identify employees and their KPI metrics.
        2. If specific columns for 'Weight', 'Target', 'Actual' are not explicitly named, infer them from context.
        3. Calculate 'Total Score' for each employee using weighted average: Sum(Metric Score * Weight %).
        4. If individual metric scores are missing, calculate: (Actual / Target) * 100, capped at 120.
        5. Assign status: >90 Excellent, >75 Good, >60 Average, else Poor.
        
        DETAILED ANALYSIS REQUIREMENTS:
        6. For the 'summary' field: Provide a comprehensive 200-300 word executive summary covering:
           - Overall team performance overview
           - Key achievements and highlights
           - Areas needing attention
           - Performance distribution analysis
        
        7. For 'insights' array: Provide 3-5 key insights with:
           - 'positive' type: achievements, improvements, standout performers
           - 'warning' type: concerns, declining trends, attention needed
           - 'info' type: neutral observations, patterns, comparisons
        
        8. For 'recommendations' array: Provide 3-5 specific, actionable recommendations for:
           - Improving team performance
           - Addressing identified issues
           - Leveraging team strengths
        
        9. For 'risks' array: Identify potential risks such as:
           - Flight risk for top performers
           - Burnout indicators
           - Skill gaps
           - Performance decline trends
        
        10. For each employee's 'aiAnalysis': Provide 50-100 word analysis covering:
            - Performance highlights
            - Specific achievements
            - Development needs
            - Career growth suggestions
        
        11. For 'strengths': List 2-3 key strengths based on metrics
        12. For 'improvements': List 1-3 specific areas for improvement
        
        LANGUAGE: ${langInstruction}
        Keep 'status' and 'type' values in English.
        
        Return ONLY valid JSON matching the provided schema.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: kpiSchema,
          temperature: 0.3,
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
