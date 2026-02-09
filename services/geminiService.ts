
import { GoogleGenAI } from "@google/genai";

export const getSafetyInsights = async (summaryData: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    당신은 '바이브코딩(Vibe-Coding)' 기술과 한국교통안전공단(TS)의 DTG 분석 표준을 결합한 물류/운송 전문 AI 전략 컨설턴트입니다.
    제공된 데이터를 바탕으로 운수업체 경영진을 위한 [한국교통안전공단 표준 기반 전문가 전략 보고서]를 작성하세요.

    [분석 데이터 요약]
    ${JSON.stringify(summaryData, null, 2)}

    [보고서 핵심 지침]
    1. 기관 신뢰성 강조: '한국교통안전공단(TS) 표준 분석 모델'을 적용하여 도출된 결과임을 명시하십시오.
    2. 전문 용어 사용: '바이브코딩 능동형 리포트', 'TS 위험운전 11대 항목', '유류비 절감액 환산 지표' 등을 활용하십시오.
    3. 현상 진단: 단순히 법적 의무 이행을 위해 제출하던 DTG 데이터를 어떻게 수익성 개선의 자산으로 전환할지 분석하십시오.
    4. 경제적 임팩트: 5대 핵심 낭비 요소(과속, 급가속, 급출발, 급감속, 급정지) 개선이 가져올 실질적 '버려지는 유류비' 회수 방안을 제시하십시오.
    5. 어조: 매우 권위 있고 신뢰감 있는 국가 공인 전문가의 어조를 유지하십시오.

    형식: 서론-본론-결론의 형식을 갖춘 4~5개 문단으로 작성하십시오.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "당신은 한국교통안전공단(TS)의 데이터 표준을 준수하며 물류 기업의 수익 극대화를 지원하는 '바이브코딩' 수석 전략가입니다. 신뢰와 전문성을 최우선으로 리포트를 생성하십시오.",
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "한국교통안전공단(TS) 표준 데이터 정밀 분석 중 예외가 발생했습니다. 실시간 대시보드 지표를 확인해 주시기 바랍니다.";
  }
};
