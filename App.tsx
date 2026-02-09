
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  FileUp, 
  ShieldAlert, 
  TrendingDown, 
  Download, 
  BrainCircuit,
  Table as TableIcon,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Quote,
  AlertCircle,
  BarChart3,
  Leaf,
  Trophy,
  ShieldCheck,
  Building2
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
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setRawData(processCsvData(json));
      setAiInsight(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const loadDemoData = () => {
    // 71.74회 등 기획안에 기반한 고위험군 샘플 데이터
    const demo = [
      { '차량번호': 'TS-2026-01', '운전자명': '김철수', '운행거리(km)': 1200, '운전시간(분)': 1500, '과속횟수': 350, '급가속횟수': 480, '급감속횟수': 210, '급출발횟수': 150, '법규위반횟수': 45 },
      { '차량번호': 'TS-2026-02', '운전자명': '박영희', '운행거리(km)': 2500, '운전시간(분)': 3000, '과속횟수': 120, '급가속횟수': 80, '급감속횟수': 50, '급출발횟수': 40, '법규위반횟수': 12 },
      { '차량번호': 'TS-2026-03', '운전자명': '이지영', '운행거리(km)': 800, '운전시간(분)': 1000, '과속횟수': 15, '급가속횟수': 10, '급감속횟수': 5, '급출발횟수': 5, '법규위반횟수': 2 },
    ];
    setRawData(processCsvData(demo));
  };

  const risks = useMemo(() => calculateRisks(rawData), [rawData]);
  const economic = useMemo(() => calculateEconomicImpact(rawData, fuelPrice), [rawData, fuelPrice]);
  const aggregated = useMemo(() => getAggregatedBehaviors(rawData), [rawData]);

  const riskDistribution = useMemo(() => {
    const counts = { Red: 0, Yellow: 0, Green: 0 };
    risks.forEach(r => counts[r.riskLevel]++);
    return [
      { name: 'Red (고위험)', value: counts.Red, color: '#e11d48' },
      { name: 'Yellow (주의)', value: counts.Yellow, color: '#f59e0b' },
      { name: 'Green (양호)', value: counts.Green, color: '#10b981' },
    ];
  }, [risks]);

  const exportToExcel = () => {
    if (risks.length === 0) return;
    const exportData = risks.map(risk => {
      const driverRaw = rawData.find(d => d.carNumber === risk.carNumber);
      return {
        '차량번호': risk.carNumber,
        '운전자명': risk.driverName,
        'TS 위험도 스코어': risk.totalScore.toFixed(3),
        '위험 등급': risk.riskLevel,
        '운행거리(km)': driverRaw?.distanceKm || 0,
        '급가속횟수': driverRaw?.suddenAccelCount || 0,
        '급출발횟수': driverRaw?.suddenStartCount || 0,
        '법규위반횟수': driverRaw?.trafficLawViolationCount || 0,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TS_Safety_Report");
    XLSX.writeFile(workbook, `VibeCoding_TS_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  useEffect(() => {
    if (rawData.length > 0 && !aiInsight) {
      setIsLoadingAi(true);
      const summary = {
        totalVehicles: rawData.length,
        riskDistribution: riskDistribution.map(d => `${d.name}: ${d.value}`),
        economicImpact: economic,
        topViolations: aggregated.slice(0, 3).map(a => `${a.label}: ${a.totalCount}회`),
        vibeCodingContext: "한국교통안전공단(TS) 공인 분석 표준 기반 능동형 안전운전 솔루션"
      };
      getSafetyInsights(summary).then(res => {
        setAiInsight(res || "");
        setIsLoadingAi(false);
      });
    }
  }, [rawData, economic, aggregated, riskDistribution, aiInsight]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100">
      <header className="glass-morphism border-b border-slate-200 sticky top-0 z-50 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-950 p-3 rounded-2xl shadow-lg">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">
                VibeCoding <span className="text-indigo-600">Active</span>
              </h1>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">TS Partner</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.4em]">한국교통안전공단 운행기록 분석 표준 공식 준수</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>대시보드</button>
            <button onClick={() => setActiveTab('table')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'table' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>정밀진단</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-10 max-w-[1600px] mx-auto w-full space-y-16">
        <section className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 bg-indigo-950 p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[150px] opacity-10"></div>
            <div className="relative space-y-8">
              <div className="flex gap-3">
                <div className="bg-white/10 text-indigo-100 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
                  <Building2 className="w-3 h-3" /> 한국교통안전공단(TS) 공인
                </div>
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight">
                DTG 데이터의 혁신,<br/>
                <span className="text-indigo-400">수익형 안전운전</span>의 시작
              </h2>
              <p className="text-xl text-indigo-100/70 font-medium leading-relaxed max-w-2xl">
                한국교통안전공단 표준을 기반으로 '버려지는 유류비'를 정확히 산출합니다.<br/>
                단순 법적 의무 이행을 넘어, 기업의 실질적 이익과 ESG 성과를 창출하십시오.
              </p>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-3 bg-white text-indigo-950 px-10 py-5 rounded-3xl font-black transition-all cursor-pointer shadow-xl hover:-translate-y-1 active:scale-95">
                  <FileUp className="w-6 h-6" />
                  <span>데이터 분석 시작</span>
                  <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={loadDemoData} className="flex items-center gap-3 bg-indigo-900 text-indigo-100 border border-indigo-700 px-10 py-5 rounded-3xl font-black transition-all active:scale-95">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                  <span>데모 리포트 확인</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl flex flex-col justify-between h-full">
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-indigo-600" /> 전략 전환 (As-Is → To-Be)
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">As-Is</div>
                    <p className="text-xs font-bold text-slate-500">법적 의무를 위한 단순 자료 제출</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-md">
                    <div className="text-[9px] font-black text-indigo-400 mb-1 uppercase tracking-widest">To-Be</div>
                    <p className="text-sm font-black text-indigo-900 italic">수익 개선 및 ESG 경영 자산화</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-100">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">현재 유류 단가 (₩/L)</label>
                <div className="relative">
                  <input type="number" value={fuelPrice} onChange={(e) => setFuelPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:border-indigo-500 outline-none text-2xl font-black text-slate-900 transition-all" />
                  <span className="absolute right-6 top-4 text-slate-300 font-black text-xl">₩</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {rawData.length > 0 && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="bg-white strategic-shadow rounded-[4rem] overflow-hidden border border-slate-100">
              <div className="bg-slate-900 px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-800 p-5 rounded-3xl shadow-2xl">
                    <BrainCircuit className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">TS 표준 AI 심층 전략 리포트</h3>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] mt-2">Korea Transportation Safety Authority Certified</p>
                  </div>
                </div>
                <button onClick={exportToExcel} className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-xl">
                  <Download className="w-5 h-5" /> 보고서(XLSX) 다운로드
                </button>
              </div>

              <div className="grid lg:grid-cols-12">
                <div className="lg:col-span-8 p-12 md:p-20 border-r border-slate-100 relative">
                  <Quote className="absolute top-12 left-12 w-24 h-24 text-slate-50 -z-0" />
                  <div className="relative z-10 space-y-10">
                    <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-[0.3em]">
                      <BarChart3 className="w-5 h-5" /> Executive Summary
                    </div>
                    {isLoadingAi ? (
                      <div className="space-y-4">
                        <div className="h-6 bg-slate-100 rounded-full w-full animate-pulse"></div>
                        <div className="h-6 bg-slate-100 rounded-full w-5/6 animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="report-font text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed whitespace-pre-wrap italic">
                        {aiInsight}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-slate-50/50 p-12 space-y-12">
                   <div className="space-y-10">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-4">핵심 성과 지표 (KPI)</h4>
                      <div className="grid gap-10">
                        <div>
                          <p className="text-xs font-black text-slate-500 mb-2">총 절감 가능 유류비</p>
                          <div className="text-5xl font-black text-indigo-700 tracking-tighter tabular-nums">₩{economic.costSavedKrw.toLocaleString()}</div>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-500 mb-2">탄소 저감 성과 (ESG)</p>
                          <div className="text-5xl font-black text-emerald-600 tabular-nums">{economic.co2ReducedKg.toFixed(0)} <span className="text-lg">kg</span></div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                           <div className="text-[9px] font-black text-rose-600 mb-3 uppercase tracking-widest flex items-center gap-2">
                             <AlertCircle className="w-3 h-3" /> 고위험군 집중 관리
                           </div>
                           <div className="text-4xl font-black text-slate-900">{riskDistribution.find(d => d.name.includes('Red'))?.value || 0} <span className="text-lg text-slate-400">명</span></div>
                           <p className="text-[10px] font-bold text-slate-500 mt-2 italic">상위 15% 운전자 대상 즉시 교육 필요</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100">
                  <div className="flex items-center gap-5 mb-12">
                    <div className="p-3 bg-rose-50 rounded-2xl"><ShieldAlert className="w-8 h-8 text-rose-500" /></div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">TS 신호등 진단 현황</h2>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={riskDistribution} innerRadius={90} outerRadius={130} paddingAngle={12} dataKey="value" stroke="none">
                            {riskDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '1.5rem', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-6">
                      {riskDistribution.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="font-black text-slate-700">{item.name}</span>
                          </div>
                          <div className="text-2xl font-black text-slate-900">{item.value}<span className="text-sm ml-1 text-slate-400">건</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100">
                  <div className="flex items-center gap-5 mb-12">
                    <div className="p-3 bg-indigo-50 rounded-2xl"><BarChart3 className="w-8 h-8 text-indigo-600" /></div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">11대 위험운전 전수 조사</h2>
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aggregated} layout="vertical" margin={{ left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 16, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '1.5rem' }} />
                        <Bar dataKey="totalCount" fill="url(#behaviorGradient)" radius={[0, 15, 15, 0]} barSize={28} />
                        <defs><linearGradient id="behaviorGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1e1b4b" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient></defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-12 bg-slate-50/50 border-b border-slate-100">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4"><TableIcon className="w-10 h-10 text-indigo-600" /> TS 표준 정밀 진단 시트</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th className="px-12 py-8">운전자 정보</th>
                        <th className="px-12 py-8">위험도 스코어 (100km당)</th>
                        <th className="px-12 py-8">핵심 관리 위반</th>
                        <th className="px-12 py-8 text-center">안전 등급</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {risks.map((risk) => {
                        const driverRaw = rawData.find(d => d.carNumber === risk.carNumber);
                        const topOff = BEHAVIOR_MAPPING.map(b => ({ label: b.label, count: driverRaw ? (driverRaw[b.key as keyof DrivingData] as number) : 0 })).sort((a, b) => b.count - a.count)[0];
                        return (
                          <tr key={risk.carNumber} className="hover:bg-indigo-50/30 transition-all group">
                            <td className="px-12 py-10">
                              <div className="font-black text-2xl text-slate-900">{risk.driverName}</div>
                              <div className="text-xs font-bold text-slate-400 uppercase">{risk.carNumber}</div>
                            </td>
                            <td className="px-12 py-10">
                              <div className="text-5xl font-black text-slate-800 tracking-tighter tabular-nums">{risk.totalScore.toFixed(3)}</div>
                            </td>
                            <td className="px-12 py-10">
                              <div className="flex items-center gap-4">
                                <span className="text-lg font-black text-slate-700">{topOff.label}</span>
                                <span className="px-4 py-1.5 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">{topOff.count}회 위반</span>
                              </div>
                            </td>
                            <td className="px-12 py-10 text-center">
                              <span className={`px-10 py-4 rounded-[2rem] text-sm font-black shadow-lg ${risk.riskLevel === 'Red' ? 'bg-rose-600 text-white' : risk.riskLevel === 'Yellow' ? 'bg-amber-400 text-slate-900' : 'bg-emerald-600 text-white'}`}>
                                {risk.riskLevel.toUpperCase()}
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
        )}
      </main>

      <footer className="bg-slate-950 text-white py-24 px-12 mt-32 border-t border-indigo-900/30">
        <div className="max-w-[1600px] mx-auto grid md:grid-cols-2 gap-20 items-start">
          <div className="space-y-8">
            <div className="text-4xl font-black tracking-tighter">VibeCoding <span className="text-indigo-500">TS Active</span></div>
            <p className="text-slate-400 font-bold text-xl leading-relaxed report-font italic">"바이브코딩은 한국교통안전공단(TS)과의 기술 협력을 통해 데이터 기반의 능동적 운전 습관 교정을 선도합니다."</p>
            <div className="flex gap-10">
              <div className="bg-white/5 p-5 rounded-3xl border border-white/10 flex items-center gap-3"><ShieldCheck className="text-emerald-500 w-6 h-6" /><span className="text-[10px] font-black uppercase tracking-widest">TS Compliance Certified</span></div>
              <div className="bg-white/5 p-5 rounded-3xl border border-white/10 flex items-center gap-3"><Building2 className="text-emerald-500 w-6 h-6" /><span className="text-[10px] font-black uppercase tracking-widest">Public Safety Partner</span></div>
            </div>
          </div>
          <div className="flex justify-end gap-24 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
             <div className="space-y-6"><div className="text-white border-b-2 border-indigo-500 pb-2 mb-4">TS Standards</div><div>Safety Assessment</div><div>Behavior Mapping</div></div>
             <div className="space-y-6"><div className="text-white border-b-2 border-indigo-500 pb-2 mb-4">Resources</div><div>Regulatory Guide</div><div>API Archive</div></div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto mt-24 pt-12 border-t border-white/5 text-center text-[9px] font-black text-slate-700 tracking-[0.6em] uppercase">© 2026 VibeCoding Global Inc. Powered by Gemini AI & TS Data Architecture.</div>
      </footer>
    </div>
  );
};

export default App;
