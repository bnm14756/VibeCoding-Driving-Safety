
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend
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
  Heart,
  Activity,
  AlertCircle
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
  const [chartReady, setChartReady] = useState(false);

  // 차트 렌더링 안정성을 위한 지연 처리
  useEffect(() => {
    if (rawData.length > 0) {
      const timer = setTimeout(() => setChartReady(true), 300);
      return () => clearTimeout(timer);
    } else {
      setChartReady(false);
    }
  }, [rawData]);

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
    
    if (risks.length === 0) return [];

    return [
      { name: '집중관리(고위험)', value: counts.Red || 0, color: '#FF1744' },
      { name: '주의운전', value: counts.Yellow || 0, color: '#FFD600' },
      { name: '안전운전', value: counts.Green || 0, color: '#00E676' },
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
    <div className="min-h-screen flex flex-col bg-[#f0f4f8]">
      <header className="glass-header sticky top-0 z-[100] px-6 md:px-12 py-4 flex items-center justify-between shadow-md border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-[#003a75] p-2.5 rounded-xl shadow-lg"><ShieldCheck className="text-white w-6 h-6" /></div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-[#0f172a] tracking-tight">VibeCoding SafeDrive</h1>
            <span className="text-[10px] font-bold text-[#0054a6] uppercase tracking-[0.2em]">Safety Intelligence Hub</span>
          </div>
        </div>
        <nav className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-300 shadow-inner">
          <button onClick={() => setActiveTab('dashboard')} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-white text-[#003a75] shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-800'}`}>인텔리전스 대시보드</button>
          <button onClick={() => setActiveTab('table')} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${activeTab === 'table' ? 'bg-white text-[#003a75] shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-800'}`}>데이터 시트</button>
        </nav>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 md:p-10 space-y-10">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#002147] to-[#003a75] rounded-[32px] p-12 text-white relative overflow-hidden shadow-2xl border border-white/10">
            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-black border border-white/20 uppercase tracking-widest text-blue-100">
                <Activity className="w-4 h-4 text-blue-400" /> Real-time DTG Safety Analysis
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1]">
                안전을 넘어선 가치,<br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">데이터로 증명합니다.</span>
              </h2>
              <div className="flex flex-wrap gap-5">
                <label className="bg-white text-[#002147] px-10 py-5 rounded-2xl font-black flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition-all shadow-2xl active:scale-95 group">
                  <FileUp className="w-6 h-6 group-hover:bounce" />
                  <span className="text-lg">분석 데이터 업로드</span>
                  <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={loadDemoData} className="bg-white/5 backdrop-blur-xl text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-white/15 transition-all border border-white/20 shadow-xl group">
                  <FileSpreadsheet className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition-transform" />
                  <span className="text-lg">데모 리포트 보기</span>
                </button>
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-blue-500 rounded-full blur-[150px] opacity-20"></div>
          </div>
          
          <div className="bg-white rounded-[32px] p-10 flex flex-col justify-between shadow-xl border border-slate-100 relative group overflow-hidden">
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <h3 className="text-xl font-black text-slate-800">에코 시뮬레이션</h3>
                <TrendingUp className="w-6 h-6 text-[#0054a6]" />
              </div>
              <div className="space-y-4">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">분석 유가 (KRW)</p>
                <div className="relative group">
                  <input type="number" value={fuelPrice} onChange={(e) => setFuelPrice(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-2xl font-black text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                  <span className="absolute right-6 top-5 text-slate-300 font-bold text-xl">₩</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-600/5 p-6 rounded-2xl mt-8 border border-blue-100/50 flex items-start gap-4">
              <div className="bg-blue-600 p-2 rounded-lg"><Heart className="w-4 h-4 text-white" /></div>
              <p className="text-xs text-[#1e3a8a] font-bold leading-relaxed tracking-tight">안전 운전은 소중한 생명과 경제적 가치를 모두 지키는 가장 확실한 투자입니다.</p>
            </div>
          </div>
        </section>

        {rawData.length > 0 ? (
          <div className="space-y-12 animate-in slide-in-from-bottom-5 duration-700">
            {/* AI Report Card */}
            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl">
              <div className="bg-gradient-to-r from-[#003a75] to-[#0054a6] px-10 py-8 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md"><BrainCircuit className="w-8 h-8 text-white" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">AI 안전 경영 리포트</h3>
                    <p className="text-blue-100/60 text-xs font-bold uppercase tracking-widest">Generative Intelligence Analysis</p>
                  </div>
                </div>
                <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 border border-white/10">
                  <Download className="w-5 h-5" /> PDF 저장
                </button>
              </div>
              <div className="p-12 bg-slate-50/50">
                {isLoadingAi ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-600 font-black italic">데이터 심층 분석 중...</span>
                  </div>
                ) : (
                  <div className="text-lg font-medium text-slate-700 leading-[1.8] italic whitespace-pre-wrap border-l-4 border-blue-600 pl-8 py-2">
                    {aiInsight}
                  </div>
                )}
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-white rounded-[40px] p-10 md:p-14 border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col min-h-[650px]">
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <ShieldAlert className="w-10 h-10 text-[#FF1744]" /> 
                        안전도 정밀 분포
                      </h3>
                    </div>
                  </div>
                  
                  {/* 차트 렌더링 영역 - 명시적 높이와 Div 중앙 정렬 */}
                  <div className="flex-1 w-full flex items-center justify-center relative" style={{ height: '500px' }}>
                    {chartReady ? (
                      <>
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                          <span className="text-slate-400 text-sm font-black uppercase tracking-[0.3em] mb-1">Target</span>
                          <span className="text-6xl font-black text-[#003a75] tabular-nums tracking-tighter">{risks.length}</span>
                          <span className="text-slate-400 text-xs font-bold uppercase">Vehicles</span>
                        </div>
                        <PieChart width={600} height={500} key={`safety-pie-${rawData.length}`}>
                          <Pie 
                            data={riskDistribution} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={150} 
                            outerRadius={210} 
                            paddingAngle={8} 
                            dataKey="value" 
                            stroke="#ffffff"
                            strokeWidth={6}
                            isAnimationActive={true}
                          >
                            {riskDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </>
                    ) : (
                      <div className="text-slate-200 font-black text-xl italic animate-pulse">시각화 엔진 준비 중...</div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                  {riskDistribution.map(item => (
                    <div key={item.name} className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl flex items-center justify-between transition-transform hover:scale-[1.03]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900 tabular-nums">{item.value}<span className="text-sm ml-1 text-slate-300 font-normal">명</span></div>
                      </div>
                      <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xl">
                        {Math.round((item.value / risks.length) * 100)}%
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex-1 bg-[#003a75] rounded-[32px] p-10 text-white flex flex-col justify-center shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="text-slate-400 font-bold text-xs mb-1 uppercase tracking-widest">연료비 절감 예상액</div>
                      <div className="text-4xl font-black tabular-nums tracking-tighter text-emerald-400">₩{economic.costSavedKrw.toLocaleString()}</div>
                    </div>
                    <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp className="w-24 h-24" /></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[700px]">
                <div className="px-10 py-8 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                    <TableIcon className="w-8 h-8 text-[#003a75]" /> 전수조사 정밀 데이터
                  </h3>
                  <div className="bg-[#003a75] text-white px-5 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase">TS STANDARD v5.0</div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="sticky top-0 bg-white z-20 shadow-sm border-b border-slate-100">
                      <tr className="text-slate-400 text-[11px] font-black uppercase tracking-widest">
                        <th className="px-12 py-6">운전자 성명</th>
                        <th className="px-12 py-6">차량 정보</th>
                        <th className="px-12 py-6">위험 지수</th>
                        <th className="px-12 py-6 text-center">안전 등급</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {risks.map((risk) => (
                        <tr key={risk.carNumber} className="hover:bg-blue-50/50 transition-all">
                          <td className="px-12 py-8 font-black text-xl text-slate-900">{risk.driverName}</td>
                          <td className="px-12 py-8">
                            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">{risk.carNumber}</span>
                          </td>
                          <td className="px-12 py-8 text-4xl font-black text-slate-800 tracking-tighter tabular-nums">{risk.totalScore.toFixed(4)}</td>
                          <td className="px-12 py-8 text-center">
                            <span className={`px-8 py-3 rounded-2xl text-[12px] font-black tracking-widest uppercase inline-block min-w-[140px] shadow-md ${
                              risk.riskLevel === 'Red' ? 'bg-[#FF1744] text-white' : 
                              risk.riskLevel === 'Yellow' ? 'bg-[#FFD600] text-black' : 
                              'bg-[#00E676] text-white'
                            }`}>
                              {risk.riskLevel === 'Red' ? '집중관리' : risk.riskLevel === 'Yellow' ? '상시관찰' : '우수운전'}
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
          <div className="flex flex-col items-center justify-center py-52 text-center animate-in zoom-in duration-700">
            <div className="bg-white p-24 rounded-[60px] border-4 border-dashed border-slate-200 shadow-sm group hover:border-blue-500 transition-all cursor-pointer">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 group-hover:bg-blue-600 transition-colors">
                <FileUp className="w-12 h-12 text-slate-300 group-hover:text-white transition-all" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter mb-4">운행 기록 데이터를 업로드하세요</h3>
              <p className="text-slate-400 max-w-lg mx-auto text-lg font-medium leading-relaxed italic">
                한국교통안전공단(TS) 표준 분석 알고리즘이<br/>즉각적인 안전 경영 가이드를 제시합니다.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-[#0f172a] text-white py-16 px-12 border-t border-white/5 mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-xl"><ShieldCheck className="text-blue-400 w-6 h-6" /></div>
              <span className="text-2xl font-black tracking-tighter">VibeCoding SafeDrive</span>
            </div>
            <p className="text-slate-500 font-bold text-sm">한국교통안전공단(TS) 표준 기반 지능형 안전 경영 분석 솔루션</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 opacity-60">
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em]">© 2026 VibeCoding Global</span>
            <span className="text-[10px] font-bold text-slate-700">Managed by <span className="text-blue-500">JongHwan Kim</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
