
import { DrivingData, CalculatedRisk, EconomicImpact, RiskLevel } from '../types';
import { BEHAVIOR_MAPPING, CO2_PER_LITER } from '../constants';

// 개인정보 보호를 위한 성명 마스킹 (김종환 -> 김o환, 이산 -> 이o)
const maskName = (name: string): string => {
  if (!name || name === 'Unknown' || name === 'undefined' || name === 'null') return '운전자';
  const n = name.trim();
  if (n.length <= 1) return n;
  if (n.length === 2) return n[0] + 'o';
  // 3글자 이상: 김종환 -> 김o환, 홍길동 -> 홍o동
  return n[0] + 'o'.repeat(n.length - 2) + n[n.length - 1];
};

export const processCsvData = (rawRows: any[]): DrivingData[] => {
  return rawRows.map(row => {
    const getVal = (keys: string[]) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
      }
      return undefined;
    };

    return {
      carNumber: String(getVal(['차량번호', '차량', '번호', 'CarNumber', 'CarNo', 'Plate']) || '미등록'),
      driverName: maskName(String(getVal(['운전자명', '성명', '이름', 'DriverName', 'Name', '운전자']) || 'Unknown')),
      date: String(getVal(['운행일자', '날짜', 'Date']) || ''),
      distanceKm: parseFloat(getVal(['운행거리(km)', '거리', 'Distance', 'km']) || 0),
      drivingTimeMin: parseFloat(getVal(['운전시간(분)', '시간', 'DrivingTime', 'min']) || 0),
      maxSpeed: parseFloat(getVal(['최고속도(km/h)', '최고속도', 'MaxSpeed']) || 0),
      speedingCount: parseInt(getVal(['과속횟수', '과속', 'Speeding']) || 0),
      suddenAccelCount: parseInt(getVal(['급가속횟수', '급가속', 'SuddenAccel']) || 0),
      suddenDecelCount: parseInt(getVal(['급감속횟수', '급감속', 'SuddenDecel']) || 0),
      suddenStopCount: parseInt(getVal(['급정지횟수', '급정지', 'SuddenStop']) || 0),
      suddenStartCount: parseInt(getVal(['급출발횟수', '급출발', 'SuddenStart']) || 0),
      longSpeedingMin: parseInt(getVal(['장기과속시간(분)', '장기과속', 'LongSpeeding']) || 0),
      gearShiftStoppedCount: parseInt(getVal(['정차중기어변속횟수', '기어변속', 'GearShift']) || 0),
      continuousDrivingViolationCount: parseInt(getVal(['연속운행위반횟수', '연속운행', 'ContViolation']) || 0),
      fatigueRiskCount: parseInt(getVal(['피로누적위험횟수', '피로누적', 'Fatigue']) || 0),
      duiSuspicionCount: parseInt(getVal(['음주운전의심횟수', '음주운전', 'DUI']) || 0),
      restViolationCount: parseInt(getVal(['휴식시간미준수횟수', '휴식시간', 'RestViolation']) || 0),
      trafficLawViolationCount: parseInt(getVal(['법규위반횟수', '법규위반', 'LawViolation']) || 0),
    };
  });
};

export const calculateRisks = (data: DrivingData[]): CalculatedRisk[] => {
  const risks = data.map(record => {
    let rawScore = 0;
    BEHAVIOR_MAPPING.forEach(behavior => {
      const val = record[behavior.key as keyof DrivingData] as number;
      rawScore += (val || 0) * behavior.weight;
    });

    const distanceNorm = record.distanceKm > 0 ? record.distanceKm / 100 : 1;
    const safetyIndex = rawScore / distanceNorm;

    return {
      carNumber: record.carNumber,
      driverName: record.driverName,
      totalScore: safetyIndex,
      riskLevel: 'Green' as RiskLevel,
    };
  });

  const sorted = [...risks].sort((a, b) => b.totalScore - a.totalScore);
  const totalCount = sorted.length;

  return sorted.map((risk, index) => {
    const rankPercent = totalCount > 1 ? (index / (totalCount - 1)) * 100 : 0;
    let level: RiskLevel = 'Green';
    
    if (rankPercent <= 20 || risk.totalScore > 0.25) level = 'Red';
    else if (rankPercent <= 50 || risk.totalScore > 0.08) level = 'Yellow';

    return { ...risk, riskLevel: level };
  });
};

export const calculateEconomicImpact = (data: DrivingData[], fuelPrice: number): EconomicImpact => {
  let totalFuelSaved = 0;
  let totalCostSaved = 0;

  data.forEach(record => {
    BEHAVIOR_MAPPING.forEach(behavior => {
      const val = (record[behavior.key as keyof DrivingData] as number) || 0;
      if (behavior.fuelPenalty > 0) totalFuelSaved += val * behavior.fuelPenalty;
      if (behavior.costPerIncident > 0) totalCostSaved += val * behavior.costPerIncident;
    });
  });

  return {
    fuelSavedLiters: totalFuelSaved,
    costSavedKrw: Math.max(totalFuelSaved * fuelPrice, totalCostSaved),
    co2ReducedKg: totalFuelSaved * CO2_PER_LITER,
  };
};

export const getAggregatedBehaviors = (data: DrivingData[]) => {
  const totalDistance = data.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
  return BEHAVIOR_MAPPING.map(b => {
    const totalCount = data.reduce((sum, r) => sum + ((r[b.key as keyof DrivingData] as number) || 0), 0);
    return { label: b.label, totalCount, avgPer100Km: totalDistance > 0 ? (totalCount / totalDistance) * 100 : 0 };
  });
};
