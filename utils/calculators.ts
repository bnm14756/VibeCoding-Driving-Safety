
import { DrivingData, CalculatedRisk, EconomicImpact, RiskLevel } from '../types';
import { BEHAVIOR_MAPPING, CO2_PER_LITER } from '../constants';

export const processCsvData = (rawRows: any[]): DrivingData[] => {
  return rawRows.map(row => ({
    carNumber: String(row['차량번호'] || row['CarNumber'] || row['차량 번호'] || 'Unknown'),
    driverName: String(row['운전자명'] || row['DriverName'] || row['운전자 명'] || 'Unknown'),
    date: String(row['운행일자'] || row['Date'] || ''),
    distanceKm: parseFloat(row['운행거리(km)'] || row['Distance'] || row['운행거리']) || 0,
    drivingTimeMin: parseFloat(row['운전시간(분)'] || row['DrivingTime'] || row['운전시간']) || 0,
    maxSpeed: parseFloat(row['최고속도(km/h)'] || row['MaxSpeed'] || row['최고속도']) || 0,
    speedingCount: parseInt(row['과속횟수'] || row['Speeding'] || row['과속']) || 0,
    suddenAccelCount: parseInt(row['급가속횟수'] || row['SuddenAccel'] || row['급가속']) || 0,
    suddenDecelCount: parseInt(row['급감속횟수'] || row['SuddenDecel'] || row['급감속']) || 0,
    suddenStopCount: parseInt(row['급정지횟수'] || row['SuddenStop'] || row['급정지']) || 0,
    suddenStartCount: parseInt(row['급출발횟수'] || row['SuddenStart'] || row['급출발']) || 0,
    longSpeedingMin: parseInt(row['장기과속시간(분)'] || row['LongSpeeding'] || row['장기과속']) || 0,
    gearShiftStoppedCount: parseInt(row['정차중기어변속횟수'] || row['GearShift'] || row['기어변속']) || 0,
    continuousDrivingViolationCount: parseInt(row['연속운행위반횟수'] || row['ContViolation'] || row['연속운행']) || 0,
    fatigueRiskCount: parseInt(row['피로누적위험횟수'] || row['Fatigue'] || row['피로누적']) || 0,
    duiSuspicionCount: parseInt(row['음주운전의심횟수'] || row['DUI'] || row['음주운전']) || 0,
    restViolationCount: parseInt(row['휴식시간미준수횟수'] || row['RestViolation'] || row['휴식시간']) || 0,
    trafficLawViolationCount: parseInt(row['법규위반횟수'] || row['LawViolation'] || row['법규위반']) || 0,
  }));
};

export const calculateRisks = (data: DrivingData[]): CalculatedRisk[] => {
  const risks = data.map(record => {
    let rawScore = 0;
    BEHAVIOR_MAPPING.forEach(behavior => {
      const val = record[behavior.key as keyof DrivingData] as number;
      rawScore += val * behavior.weight;
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
    
    // Improved threshold logic for clearer separation
    if (rankPercent <= 15 || risk.totalScore > 0.35) level = 'Red';
    else if (rankPercent <= 40 || risk.totalScore > 0.15) level = 'Yellow';

    return { ...risk, riskLevel: level };
  });
};

export const calculateEconomicImpact = (data: DrivingData[], fuelPrice: number): EconomicImpact => {
  let totalFuelSaved = 0;
  let totalCostSaved = 0;

  data.forEach(record => {
    BEHAVIOR_MAPPING.forEach(behavior => {
      const val = record[behavior.key as keyof DrivingData] as number;
      if (behavior.fuelPenalty > 0) {
        totalFuelSaved += val * behavior.fuelPenalty;
      }
      if (behavior.costPerIncident > 0) {
        totalCostSaved += val * behavior.costPerIncident;
      }
    });
  });

  const fuelCost = totalFuelSaved * fuelPrice;
  const combinedCost = Math.max(fuelCost, totalCostSaved);

  return {
    fuelSavedLiters: totalFuelSaved,
    costSavedKrw: combinedCost,
    co2ReducedKg: totalFuelSaved * CO2_PER_LITER,
  };
};

export const getAggregatedBehaviors = (data: DrivingData[]) => {
  const totalDistance = data.reduce((sum, r) => sum + r.distanceKm, 0);
  
  return BEHAVIOR_MAPPING.map(behaviorMapping => {
    const behaviorKey = behaviorMapping.key as keyof DrivingData;
    const totalCount = data.reduce((sum, r) => sum + (r[behaviorKey] as number), 0);
    const avgPer100Km = totalDistance > 0 ? (totalCount / totalDistance) * 100 : 0;

    return {
      label: behaviorMapping.label,
      totalCount,
      avgPer100Km: avgPer100Km.toFixed(2)
    };
  });
};
