
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  FileUp, 
  ShieldAlert, 
  Download, 
  BrainCircuit,
  Table as TableIcon,
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
  Building2,
  Heart
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DrivingData } from './types.ts';
import { processCsvData, calculateRisks, calculateEconomicImpact } from './utils/calculators.ts';
import { FUEL_PRICE_DEFAULT } from './constants.tsx';
import { getSafetyInsights } from './services/geminiService.ts';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<DrivingData[]>([]);
  const [fuelPrice, setFuelPrice] = useState(FUEL_PRICE_DEFAULT);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);
        const processed = processCsvData(json);
        setRawData(processed);
        setAiInsight(null);
      } catch (err) {
        console.error("File processing error", err);
        alert("데이터 파일을 처리하는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const loadDemoData = useCallback(() => {
    const demo = [
      { '차량번호': '12가 3456', '운전자명': '김종환', '운행거리(km)': 1580, '운전시간(분)': 1800, '과속횟수': 42, '급가속횟수': 38, '급감속횟수': 12, '급출발횟수': 25, '법규위반횟수': 5 },
      { '차량번호': '56나 7890', '운전자명': '박영희', '운행거리(km)': 2100, '운전시간(분)': 2400, '과속횟수': 12, '급가속횟수': 5, '급감속횟수': 2, '급출발횟수': 3, '법규위반횟수': 1 },
      { '차량번호': '34다 1122', '운전자명': '이지영', '운행거리(km)': 950, '운전시간(분)': 1100, '과속횟수': 5, '급가속횟수': 2, '급감속횟수': 1, '급출발횟수': 1, '법규위반횟수': 0 },
      { '차량번호': '99라 5566', '운전자명': '최민수', '운행거리(km)': 1750, '운전시간(분)': 2000, '과속횟수': 85, '급가속횟수': 92, '급감속횟수': 45, '급출발횟수': 58, '법규위반횟수': 12 },
    ];
    setRawData(processCsvData(demo));
    setAiInsight(null);
  }, []);

  const risks = useMemo(() => calculateRisks(rawData), [rawData]);
  const economic = useMemo(() => calculateEconomicImpact(rawData, fuelPrice), [rawData, fuelPrice]);

  const riskDistribution = useMemo(() => {
    const counts = { Red: 0, Yellow: 0, Green: 0 };
    risks.forEach(r => { if (counts[r.riskLevel] !== undefined) counts[r.riskLevel]++; });
    
    return [
      { name: '집중관리(고위험)', value: counts.Red || 0, color: '#FF3B30' },
      { name: '주의운전', value: counts.Yellow || 0, color: '#FFCC00' },
      { name: '안전운전', value: counts.Green || 0, color: '#34C759' },
    ];
  }, [risks]);

  useEffect(() => {
    if (rawData.length > 0 && !aiInsight && !isLoadingAi) {
      setIsLoadingAi(true);
      const summary = {
        totalVehicles: rawData.length,
        riskDistribution: riskDistribution.map(d => `${d.name}: ${d.value}명`),
        economic: `${economic.costSavedKrw.toLocaleString()}원 절감 가능`
      };
      getSafetyInsights(summary).then(res => {
        setAiInsight(res || "안전 분석 리포트 생성이 완료되었습니다.");
        setIsLoadingAi(false);
      }).catch(() => { setIsLoadingAi(false); setAiInsight("AI 엔진 응답 대기 중..."); });
    }
  }, [rawData, economic, riskDistribution, aiInsight, isLoadingAi]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <header className="glass-header sticky top-0 z-[100] px-6 md:px-12 py-4 flex items-center justify-between shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-[#003a75] p-2 rounded-lg shadow-sm"><ShieldCheck className="text-white w-5 h-5" /></div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-[#0f172a] tracking-tight">VibeCoding SafeDrive</h1>
            <span className="text-[10px] font-bold text-[#0054a6] uppercase tracking-wider">TS Standard Analytics</span>
          </div>
        </div>
        <nav className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-300">
          <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#003a75] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>시각화 분석</button>
          <button onClick={() => setActiveTab('table')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'table' ? 'bg-white text-[#003a75] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>전수조사 데이터</button>
        </nav>
      </header>

      <main className="flex-1 max-w-[1440px] mx-auto w-full p-6 md:p-8 space-y-8">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#002147] rounded-[24px] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-600/30 px-3 py-1 rounded-full text-[10px] font-black border border-white/10 uppercase tracking-widest text-blue-100">
                <Building2 className="w-3 h-3" /> Korea Transportation Safety Authority (TS) Standard
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.2]">한국교통안전공단 표준 기반<br/><span className="text-blue-400">지능형 안전 경영 솔루션</span></h2>
              <div className="flex flex-wrap gap-4 pt-4">
                <label className="bg-white text-[#002147] px-8 py-4 rounded-xl font-black flex items-center gap-2 cursor-pointer hover:bg-blue-50 transition-all shadow-xl active:scale-95 text-sm">
                  <FileUp className="w-5 h-5" /><span>데이터 정밀 분석 시작</span>
                  <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={loadDemoData} className="bg-white/10 text-white px-8 py-4 rounded-xl font-black flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10 text-sm">
                  <FileSpreadsheet className="w-5 h-5 text-blue-300" /><span>샘플 리포트 실행</span>
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[120px] opacity-10 -mr-20 -mt-20"></div>
          </div>
          <div className="bg-white rounded-[24px] p-8 flex flex-col justify-between shadow-sm border border-slate-200">
            <div className="space-y-6">
              <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3"><TrendingUp className="w-5 h-5 text-[#0054a6]" /> 시뮬레이션 설정</h3>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">분석 유가 기준 (₩/L)</p>
                <div className="relative">
                  <input type="number" value={fuelPrice} onChange={(e) => setFuelPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none" />
                  <span className="absolute right-4 top-3.5 text-slate-300 font-bold">₩</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-5 rounded-xl mt-6 border border-blue-100 flex items-start gap-3">
              <Heart className="w-4 h-4 text-[#0054a6] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#1e3a8a] font-bold leading-normal">정밀한 전수조사를 통해 단 한 건의 사고도 용납하지 않는 안전 체계를 구축합니다.</p>
            </div>
          </div>
        </section>

        {rawData.length > 0 ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* AI Report Card */}
            <div className="bg-white rounded-[24px] overflow-hidden border border-slate-200 shadow-sm">
              <div className="bg-[#003a75] px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <BrainCircuit className="w-8 h-8 text-blue-200" />
                  <h3 className="text-xl font-bold text-white tracking-tight">TS 표준 AI 안전 경영 전략 리포트</h3>
                </div>
                <button onClick={() => window.print()} className="bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2">
                  <Download className="w-4 h-4" /> PDF 출력
                </button>
              </div>
              <div className="p-8 md:p-10">
                {isLoadingAi ? (
                  <div className="flex items-center gap-3 text-blue-600 font-bold italic animate-pulse">데이터 엔진 정밀 분석 중...</div>
                ) : (
                  <div className="text-lg font-medium text-slate-700 leading-relaxed italic whitespace-pre-wrap">{aiInsight}</div>
                )}
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="grid lg:grid-cols-4 gap-8">
                {/* [핵심] 도넛 그래프 카드 - 무조건 보이도록 높이 강제 설정 */}
                <div className="lg:col-span-3 bg-white rounded-[24px] p-10 border border-slate-200 shadow-xl flex flex-col items-center min-h-[600px]">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-4 w-full justify-start italic">
                    <ShieldAlert className="w-8 h-8 text-[#FF3B30]" /> 안전도 정밀 분포 현황
                  </h3>
                  
                  {/* 그래프 출력 공간: height를 500px로 확실히 점유 */}
                  <div className="w-full relative flex items-center justify-center" style={{ height: '500px', minHeight: '500px' }}>
                    {/* 중앙 텍스트 라벨 (차트가 흰색으로 보여도 이 텍스트는 보임) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                      <span className="text-slate-400 text-sm font-black uppercase tracking-widest">Total Analysis</span>
                      <span className="text-5xl font-black text-[#003a75] tabular-nums tracking-tighter">{risks.length}</span>
                      <span className="text-slate-400 text-xs font-bold">운전자 전수분석</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart key={`final-v5-${rawData.length}`}>
                        <Pie 
                          data={riskDistribution} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={130} 
                          outerRadius={190} 
                          paddingAngle={8} 
                          dataKey="value" 
                          stroke="#ffffff"
                          strokeWidth={6}
                          isAnimationActive={true}
                          animationBegin={0}
                          animationDuration={1000}
                        >
                          {riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)', padding: '16px' }} 
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          align="center"
                          iconType="circle"
                          wrapperStyle={{ paddingTop: '40px', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 우측 요약 카드들 */}
                <div className="flex flex-col gap-6">
                  {riskDistribution.map(item => (
                    <div key={item.name} className="flex-1 p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-center group hover:scale-[1.02] transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                      </div>
                      <div className="text-4xl font-black text-slate-900 tabular-nums">{item.value}<span className="text-sm ml-1 text-slate-300 font-normal">명</span></div>
                    </div>
                  ))}
                  <div className="flex-1 p-6 bg-[#003a75] rounded-[24px] text-white flex flex-col justify-center shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-blue-100 italic">Target Total</span>
                      <div className="text-4xl font-black tabular-nums">{risks.length}<span className="text-sm ml-1 opacity-60 font-normal">대 분석완료</span></div>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-16 h-16" /></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3"><TableIcon className="w-6 h-6 text-[#003a75]" /> 전수조사 정밀 분석 데이터 시트</h3>
                  <div className="bg-[#003a75] text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">TS STANDARD v4.0</div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="sticky top-0 bg-white z-20 shadow-sm border-b border-slate-100">
                      <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-10 py-5">운전자 성함(마스킹)</th>
                        <th className="px-10 py-5">차량 번호</th>
                        <th className="px-10 py-5">위험 지수</th>
                        <th className="px-10 py-5 text-center">안전 등급</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {risks.map((risk) => (
                        <tr key={risk.carNumber} className="hover:bg-blue-50/50 transition-all">
                          <td className="px-10 py-6 font-bold text-xl text-slate-900">{risk.driverName}</td>
                          <td className="px-10 py-6"><span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{risk.carNumber}</span></td>
                          <td className="px-10 py-6 text-4xl font-black text-slate-800 tracking-tighter tabular-nums">{risk.totalScore.toFixed(3)}</td>
                          <td className="px-10 py-6 text-center">
                            <span className={`px-6 py-2 rounded-full text-[11px] font-black tracking-widest uppercase inline-block min-w-[110px] shadow-sm ${
                              risk.riskLevel === 'Red' ? 'bg-[#FF3B30] text-white' : 
                              risk.riskLevel === 'Yellow' ? 'bg-[#FFCC00] text-white' : 
                              'bg-[#34C759] text-white'
                            }`}>
                              {risk.riskLevel === 'Red' ? '고위험군' : risk.riskLevel === 'Yellow' ? '주의군' : '안전군'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-700">
            <div className="bg-white p-20 rounded-[48px] border-2 border-dashed border-slate-300 shadow-sm group hover:border-[#0054a6] transition-all cursor-pointer">
              <FileUp className="w-20 h-20 text-slate-300 mx-auto mb-8 group-hover:text-[#0054a6] transition-all" />
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter">운행 데이터를 업로드해 주세요</h3>
              <p className="text-slate-400 max-w-md mx-auto mt-4 text-base font-medium leading-relaxed">한국교통안전공단(TS) 표준 분석 엔진이<br/>즉각적인 안전 경영 전략을 제시합니다.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-[#0f172a] text-white py-12 px-10 border-t border-white/5 mt-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-1.5 rounded-lg shadow-inner"><ShieldCheck className="text-blue-400 w-4 h-4" /></div>
              <span className="text-lg font-black tracking-tight">VibeCoding SafeDrive</span>
            </div>
            <p className="text-slate-500 font-medium text-xs">한국교통안전공단(TS) 표준 기반 지능형 안전 경영 분석 솔루션</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1.5 opacity-60">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em]">© 2026 VibeCoding Global</span>
            <span className="text-[8px] font-medium text-slate-700 uppercase tracking-tighter">Managed by <span className="text-blue-500 font-bold opacity-80">김종환</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
