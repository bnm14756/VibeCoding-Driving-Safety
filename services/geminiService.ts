
import { GoogleGenAI } from "@google/genai";

export const getSafetyInsights = async (summaryData: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 공기업 특성에 맞춰 '안전 중심' 가치 강조 프롬프트
  const prompt = `
    [한국교통안전공단(TS) 표준 기반 안전 경영 정밀 전략 리포트]
    수신: 공공기관 및 운수업체 경영진
    분석 데이터 요약: ${JSON.stringify(summaryData)}

    분석 지침:
    1. 바이브코딩(Vibe-Coding)의 수석 안전 전략가로서, 안전을 최우선 가치로 두어 분석하십시오.
    2. '안전은 타협할 수 없는 최고의 가치'라는 철학을 문장에 녹여내십시오.
    3. 수익 창출보다는 '사고 예방', '운전자 보호', '시민 안전 기여', 'ESG 탄소 중립 실현'에 초점을 맞추십시오.
    4. 고위험군 운전자에 대한 즉각적인 교육적 개입과 시스템적 보완 대책을 제안하십시오.
    5. 전문적이고 신뢰감 있는 문체로 3~4문단 이내로 요약하십시오.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "당신은 한국교통안전공단(TS)의 표준을 따르며, 공공의 안전을 최우선으로 생각하는 바이브코딩 수석 안전 경영 컨설턴트입니다.",
        temperature: 0.3, // 더 신중하고 전문적인 어조를 위해 온도 낮춤
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "현재 안전 엔진 분석에 지연이 발생하고 있습니다. 대시보드의 정밀 지표를 참고하여 안전 경영을 우선해 주십시오.";
  }
};
