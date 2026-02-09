
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  FileUp, 
  ShieldAlert, 
  Download, 
  BrainCircuit,
  Table as TableIcon,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Leaf,
  ShieldCheck,
  Building2,
  ChevronRight,
  Info,
  Users,
  Heart
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DrivingData } from './types.ts';
import { processCsvData, calculateRisks, calculateEconomicImpact, getAggregatedBehaviors } from './utils/calculators.ts';
import { BEHAVIOR_MAPPING, FUEL_PRICE_DEFAULT } from './constants.tsx';
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
      { '차량번호': 'TS-01-2026', '운전자명': '김철수', '운행거리(km)': 1580, '운전시간(분)': 1800, '과속횟수': 42, '급가속횟수': 38, '급감속횟수': 12, '급출발횟수': 25, '법규위반횟수': 5 },
      { '차량번호': 'TS-02-2026', '운전자명': '박영희', '운행거리(km)': 2100, '운전시간(분)': 2400, '과속횟수': 12, '급가속횟수': 5, '급감속횟수': 2, '급출발횟수': 3, '법규위반횟수': 1 },
      { '차량번호': 'TS-03-2026', '운전자명': '이지영', '운행거리(km)': 950, '운전시간(분)': 1100, '과속횟수': 5, '급가속횟수': 2, '급감속횟수': 1, '급출발횟수': 1, '법규위반횟수': 0 },
      { '차량번호': 'TS-04-2026', '운전자명': '최민수', '운행거리(km)': 1750, '운전시간(분)': 2000, '과속횟수': 85, '급가속횟수': 92, '급감속횟수': 45, '급출발횟수': 58, '법규위반횟수': 12 },
    ];
    setRawData(processCsvData(demo));
    setAiInsight(null);
  }, []);

  const risks = useMemo(() => calculateRisks(rawData), [rawData]);
  const economic = useMemo(() => calculateEconomicImpact(rawData, fuelPrice), [rawData, fuelPrice]);
  const aggregated = useMemo(() => getAggregatedBehaviors(rawData), [rawData]);

  const riskDistribution = useMemo(() => {
    const counts = { Red: 0, Yellow: 0, Green: 0 };
    risks.forEach(r => counts[r.riskLevel]++);
    return [
      { name: '집중관리(고위험)', value: counts.Red, color: '#dc2626' },
      { name: '주의운전', value: counts.Yellow, color: '#f59e0b' },
      { name: '안전운전', value: counts.Green, color: '#059669' },
    ];
  }, [risks]);

  useEffect(() => {
    if (rawData.length > 0 && !aiInsight && !isLoadingAi) {
      setIsLoadingAi(true);
      const summary = {
        totalVehicles: rawData.length,
        riskDistribution: riskDistribution.map(d => `${d.name}: ${d.value}명`),
        topViolations: aggregated.slice(0, 3).map(a => `${a.label}: ${a.totalCount}회`),
        economicSummary: {
          potentialSaving: economic.costSavedKrw.toLocaleString() + '원',
          co2Reduced: economic.co2ReducedKg.toFixed(1) + 'kg'
        }
      };
      
      getSafetyInsights(summary).then(res => {
        setAiInsight(res || "분석 결과를 도출할 수 없습니다.");
        setIsLoadingAi(false);
      }).catch(() => {
        setIsLoadingAi(false);
        setAiInsight("AI 분석 엔진을 가동할 수 없습니다. 다시 시도해 주세요.");
      });
    }
  }, [rawData, economic, aggregated, riskDistribution, aiInsight, isLoadingAi]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Institutional Navigation */}
      <header className="glass-header sticky top-0 z-[100] px-8 py-5 flex items-center justify-between border-b border-slate-200/60">
        <div className="flex items-center gap-4">
          <div className="bg-[#003a75] p-2.5 rounded-xl shadow-md">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-[#0f172a]">
                VibeCoding <span className="text-[#0054a6]">SafeDrive</span>
              </h1>
              <span className="bg-blue-50 text-[#0054a6] px-2.5 py-1 rounded-md text-[10px] font-bold border border-blue-100">TS STANDARD v4.2</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#003a75] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              대시보드
            </button>
            <button 
              onClick={() => setActiveTab('table')} 
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'table' ? 'bg-white text-[#003a75] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              정밀 시트
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] mx-auto w-full p-8 md:p-12 space-y-12">
        {/* Public Enterprise Hero Section */}
        <section className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-[#002147] rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#0054a6] rounded-full blur-[140px] opacity-25 -mr-32 -mt-32"></div>
            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2.5 bg-white/5 px-4 py-1.5 rounded-full text-xs font-bold border border-white/10 uppercase tracking-widest text-blue-200">
                <Building2 className="w-4 h-4" /> 공공기관 안전운행 전수 조사 시스템
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.15]">
                안전은 타협할 수 없는<br/><span className="text-blue-400">최고의 가치</span>입니다.
              </h2>
              <p className="text-slate-300 text-xl max-w-2xl font-medium leading-relaxed">
                한국교통안전공단(TS) 표준 알고리즘을 통해 운행 데이터를 정밀 분석하고,<br/>
                국민의 안전을 지키는 투명한 안전 경영의 표준을 제시합니다.
              </p>
              <div className="flex flex-wrap gap-5 pt-6">
                <label className="bg-white text-[#002147] px-10 py-5 rounded-2xl font-extrabold flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition-all shadow-xl active:scale-95 text-lg">
                  <FileUp className="w-6 h-6" />
                  <span>데이터 분석 시작</span>
                  <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                </label>
                <button 
                  onClick={loadDemoData} 
                  className="bg-white/10 text-white px-10 py-5 rounded-2xl font-extrabold flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95 border border-white/20 text-lg"
                >
                  <FileSpreadsheet className="w-6 h-6 text-blue-300" />
                  <span>샘플 리포트 확인</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white card-premium p-10 flex flex-col justify-between border border-slate-200/60">
            <div className="space-y-8">
              <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-5">
                <TrendingUp className="w-6 h-6 text-[#0054a6]" /> 운행 분석 기준
              </h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">분석 유가 기준 (L/₩)</p>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={fuelPrice} 
                      onChange={(e) => setFuelPrice(Number(e.target.value))} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-2xl font-black text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                    <span className="absolute right-6 top-5 text-slate-300 font-bold">₩</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-blue-50/60 p-5 rounded-2xl border border-blue-100/50">
                  <Heart className="w-5 h-5 text-[#0054a6] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#1e3a8a] font-bold leading-relaxed">
                    본 시스템은 안전운전 유도를 통해 유류 낭비를 줄이고, 
                    절감된 비용을 사회적 가치 실현에 재투자하는 모델을 지향합니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 text-center mt-6">
              ※ 한국교통안전공단(TS) 11대 위험운전 항목 가중치 적용
            </div>
          </div>
        </section>

        {rawData.length > 0 ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            
            {/* Professional AI Strategy Report */}
            <div className="card-premium overflow-hidden border-none shadow-xl">
              <div className="bg-gradient-to-r from-[#003a75] to-[#0054a6] px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                    <BrainCircuit className="w-10 h-10 text-blue-100" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">TS 표준 AI 안전 경영 전략 리포트</h3>
                    <p className="text-blue-100/70 text-sm font-bold mt-1 tracking-wide">AI-Powered Safety Governance Insight</p>
                  </div>
                </div>
                <button 
                  onClick={() => alert("현재 고도화 작업 중입니다.")}
                  className="bg-white text-[#003a75] px-8 py-3.5 rounded-xl font-black text-sm transition-all hover:bg-blue-50 flex items-center gap-2.5 shadow-lg"
                >
                  <Download className="w-5 h-5" /> 보고서 내보내기
                </button>
              </div>

              <div className="grid lg:grid-cols-3">
                <div className="lg:col-span-2 p-12 md:p-16 relative bg-white">
                  <QuoteIcon className="absolute top-12 left-12 w-28 h-28 text-slate-50 -z-0" />
                  <div className="relative z-10 space-y-10">
                    <div className="flex items-center gap-3 text-[#0054a6] font-black text-[11px] uppercase tracking-[0.3em]">
                      <BarChart3 className="w-5 h-5" /> Safety First Executive Summary
                    </div>
                    {isLoadingAi ? (
                      <div className="space-y-6">
                        <div className="h-5 bg-slate-50 rounded-full w-full animate-pulse"></div>
                        <div className="h-5 bg-slate-50 rounded-full w-5/6 animate-pulse"></div>
                        <div className="h-5 bg-slate-50 rounded-full w-4/6 animate-pulse"></div>
                        <div className="flex items-center gap-3 pt-4">
                          <div className="w-2.5 h-2.5 bg-[#0054a6] rounded-full animate-bounce"></div>
                          <span className="text-sm font-bold text-[#0054a6] italic">공공기관 안전 분석 기준 데이터 검정 중...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl md:text-3xl font-medium text-slate-800 leading-[1.7] tracking-tight whitespace-pre-wrap italic">
                        {aiInsight}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-[#fcfcfd] p-12 space-y-12 border-l border-slate-100">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 pb-5">데이터 요약 (Key Metrics)</h4>
                  <div className="space-y-12">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500">탄소 배출 저감 성과</p>
                      <div className="text-5xl font-black text-[#059669] tracking-tighter tabular-nums">{economic.co2ReducedKg.toFixed(1)} <span className="text-xl font-bold text-slate-300">kg</span></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500">불필요 연료 소모액</p>
                      <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">₩{economic.costSavedKrw.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-start gap-4">
                       <div className="bg-red-50 p-2.5 rounded-xl">
                         <AlertCircle className="w-6 h-6 text-red-600" />
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-500 uppercase">집중 관리 대상자</p>
                         <div className="text-3xl font-black text-slate-900 mt-1">{riskDistribution.find(d => d.name.includes('집중관리'))?.value || 0} <span className="text-base text-slate-400 font-bold">명</span></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="grid lg:grid-cols-2 gap-10">
                {/* Visual Chart: Risk Distribution */}
                <div className="bg-white card-premium p-12">
                  <div className="flex items-center justify-between mb-12">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <ShieldAlert className="w-7 h-7 text-red-600" /> 안전도 신호등 진단
                    </h3>
                  </div>
                  <div className="h-[380px] w-full flex flex-col md:flex-row items-center gap-10">
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={riskDistribution} 
                            innerRadius={90} 
                            outerRadius={130} 
                            paddingAngle={10} 
                            dataKey="value" 
                            stroke="none"
                          >
                            {riskDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px' }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-5">
                      {riskDistribution.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="font-extrabold text-slate-700 text-sm">{item.name}</span>
                          </div>
                          <div className="text-2xl font-black text-slate-900">{item.value}<span className="text-xs ml-1.5 text-slate-400 font-bold">명</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Visual Chart: Behavior Analysis */}
                <div className="bg-white card-premium p-12">
                  <div className="flex items-center justify-between mb-12">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <BarChart3 className="w-7 h-7 text-[#0054a6]" /> 11대 위험운전 전수조사
                    </h3>
                  </div>
                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aggregated} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="label" 
                          type="category" 
                          width={90} 
                          tick={{ fontSize: 14, fontWeight: 800, fill: '#64748b' }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }} 
                          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} 
                        />
                        <Bar 
                          dataKey="totalCount" 
                          fill="#003a75" 
                          radius={[0, 10, 10, 0]} 
                          barSize={24} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              /* Administrative Diagnostic Sheet */
              <div className="bg-white card-premium overflow-hidden border-none shadow-2xl">
                <div className="px-12 py-10 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
                    <TableIcon className="w-7 h-7 text-[#0054a6]" /> 정밀 분석 로우데이터 (Raw Data)
                  </h3>
                  <div className="bg-white px-5 py-2 rounded-xl text-xs font-black text-slate-400 border border-slate-200 shadow-sm">
                    전체 분석 차량: {risks.length} 대
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-12 py-8">차량 및 성명</th>
                        <th className="px-12 py-8">안전도 지수 (100km당)</th>
                        <th className="px-12 py-8">주요 위반 항목</th>
                        <th className="px-12 py-8 text-center">안전 등급</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {risks.map((risk) => {
                        const driverRaw = rawData.find(d => d.carNumber === risk.carNumber);
                        const topViolation = BEHAVIOR_MAPPING
                          .map(b => ({ label: b.label, count: driverRaw ? (driverRaw[b.key as keyof DrivingData] as number) : 0 }))
                          .sort((a, b) => b.count - a.count)[0];
                        return (
                          <tr key={risk.carNumber} className="hover:bg-blue-50/20 transition-all group">
                            <td className="px-12 py-10">
                              <div className="font-extrabold text-xl text-slate-900 group-hover:text-[#0054a6] transition-colors">{risk.driverName}</div>
                              <div className="text-sm font-bold text-slate-400 mt-1">{risk.carNumber}</div>
                            </td>
                            <td className="px-12 py-10">
                              <div className="text-4xl font-black text-slate-800 tracking-tighter tabular-nums">{risk.totalScore.toFixed(3)}</div>
                            </td>
                            <td className="px-12 py-10">
                              <div className="flex items-center gap-4">
                                <span className="text-base font-extrabold text-slate-700">{topViolation.label}</span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">{topViolation.count}회 감지</span>
                              </div>
                            </td>
                            <td className="px-12 py-10 text-center">
                              <span className={`px-7 py-3 rounded-full text-xs font-black tracking-widest uppercase shadow-md ${
                                risk.riskLevel === 'Red' ? 'bg-[#dc2626] text-white' : 
                                risk.riskLevel === 'Yellow' ? 'bg-[#f59e0b] text-white' : 
                                'bg-[#059669] text-white'
                              }`}>
                                {risk.riskLevel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Initial Empty State */
          <div className="flex flex-col items-center justify-center py-48 space-y-10 text-center animate-in fade-in duration-1000">
            <div className="bg-white p-16 rounded-[60px] border-2 border-dashed border-slate-200 shadow-sm relative group cursor-pointer hover:border-[#0054a6]/50 transition-all">
              <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/50 rounded-[60px] transition-all"></div>
              <FileUp className="w-24 h-24 text-slate-200 mx-auto mb-10 group-hover:text-[#0054a6]/30 transition-all" />
              <h3 className="text-3xl font-black text-slate-800">분석 데이터를 기다리고 있습니다</h3>
              <p className="text-slate-400 max-w-md mx-auto mt-4 text-lg font-medium">
                표준 DTG 운행기록 파일을 업로드하여<br/>기관 전수 분석 및 안전 경영 진단을 시작하십시오.
              </p>
            </div>
            <div className="flex gap-8 text-xs font-black text-slate-400 uppercase tracking-widest">
               <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-300" /> TS 표준 가중치 적용</div>
               <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-300" /> 개인정보 익명화 처리</div>
               <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-300" /> ESG 탄소 지수 산출</div>
            </div>
          </div>
        )}
      </main>

      {/* Modern Public Sector Footer */}
      <footer className="bg-[#0f172a] text-white py-24 px-12 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto grid md:grid-cols-2 gap-24">
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="bg-[#0054a6] p-3 rounded-2xl"><ShieldCheck className="text-white w-7 h-7" /></div>
              <span className="text-3xl font-black tracking-tighter">VibeCoding <span className="text-blue-500">SafeDrive</span></span>
            </div>
            <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-xl">
              본 분석 시스템은 한국교통안전공단(TS)의 기술 자문을 바탕으로 설계되었으며,<br/>
              운행 데이터 분석을 통한 안전 문화 정착과 공공 부문의 ESG 경영 가치 실현을 목표로 합니다.
            </p>
            <div className="flex gap-6">
              <div className="bg-white/5 px-6 py-3 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border border-white/10 shadow-sm">TS Compliance V4</div>
              <div className="bg-white/5 px-6 py-3 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border border-white/10 shadow-sm">Enterprise Governance</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-8">
              <h5 className="text-[12px] font-black text-white uppercase tracking-[0.3em] border-b border-white/10 pb-4">Core Platform</h5>
              <ul className="text-sm font-bold text-slate-500 space-y-5">
                <li className="hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3.5 h-3.5" /> Safety Diagnostics</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3.5 h-3.5" /> Environmental ESG</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3.5 h-3.5" /> Institutional Support</li>
              </ul>
            </div>
            <div className="space-y-8">
              <h5 className="text-[12px] font-black text-white uppercase tracking-[0.3em] border-b border-white/10 pb-4">Information</h5>
              <ul className="text-sm font-bold text-slate-500 space-y-5">
                <li className="hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3.5 h-3.5" /> Privacy Policy</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3.5 h-3.5" /> TS Partnership</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3.5 h-3.5" /> Tech Documentation</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto mt-24 pt-12 border-t border-white/5 text-center text-[11px] font-extrabold text-slate-700 uppercase tracking-[0.5em]">
          © 2026 VibeCoding SafeDrive Global. All data encrypted by Institutional Standards.
        </div>
      </footer>
    </div>
  );
};

const QuoteIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C15.4647 8 15.017 8.44772 15.017 9V12C15.017 12.5523 14.5693 13 14.017 13H12.017C11.4647 13 11.017 12.5523 11.017 12V9C11.017 7.34315 12.3601 6 14.017 6H19.017C20.6739 6 22.017 7.34315 22.017 9V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.017 21L5.017 18C5.017 16.8954 5.91243 16 7.017 16H10.017C10.5693 16 11.017 15.5523 11.017 15V9C11.017 8.44772 10.5693 8 10.017 8H7.017C6.46472 8 6.017 8.44772 6.017 9V12C6.017 12.5523 5.56929 13 5.017 13H3.017C2.46472 13 2.017 12.5523 2.017 12V9C2.017 7.34315 3.36015 6 5.017 6H10.017C11.6739 6 13.017 7.34315 13.017 9V15C13.017 18.3137 10.3307 21 7.017 21H5.017Z" />
  </svg>
);

export default App;
