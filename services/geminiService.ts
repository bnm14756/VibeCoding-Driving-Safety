
import { GoogleGenAI } from "@google/genai";

export const getSafetyInsights = async (summaryData: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 빠른 응답을 위해 프롬프트를 명확하고 간결하게 구조화
  const prompt = `
    [한국교통안전공단(TS) 표준 기반 전문가 전략 보고서]
    대상: 운수업체 경영진
    데이터: ${JSON.stringify(summaryData)}

    지침:
    1. 바이브코딩(Vibe-Coding) 전문가로서 TS 11대 위험운전 항목을 기반으로 분석하십시오.
    2. 경제성(유류비 절감)과 ESG 가치를 최우선으로 다루십시오.
    3. 5대 핵심 낭비 요소(과속, 급가속 등) 개선을 통한 수익성 회수 방안을 명확히 제시하십시오.
    4. 권위 있고 간결한 어조로 3~4문단 이내로 핵심만 작성하십시오.
  `;

  try {
    const response = await ai.models.generateContent({
      // 속도가 훨씬 빠른 Flash 모델로 변경하여 대기 시간 단축
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "당신은 한국교통안전공단(TS) 데이터 표준을 준수하는 바이브코딩 수석 전략가입니다. 핵심 위주로 빠르게 통찰력 있는 리포트를 생성하십시오.",
        temperature: 0.4, // 낮은 온도로 더 일관되고 빠른 응답 유도
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "TS 표준 데이터 분석 중 지연이 발생했습니다. 대시보드 지표를 우선 확인해 주십시오.";
  }
};
