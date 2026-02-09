
export interface DrivingData {
  carNumber: string;
  driverName: string;
  date: string;
  distanceKm: number;
  drivingTimeMin: number;
  maxSpeed: number;
  speedingCount: number;
  suddenAccelCount: number;
  suddenDecelCount: number;
  suddenStopCount: number;
  suddenStartCount: number;
  longSpeedingMin: number;
  gearShiftStoppedCount: number;
  continuousDrivingViolationCount: number;
  fatigueRiskCount: number;
  duiSuspicionCount: number;
  restViolationCount: number;
  trafficLawViolationCount: number;
}

export type RiskLevel = 'Red' | 'Yellow' | 'Green';

export interface CalculatedRisk {
  carNumber: string;
  driverName: string;
  totalScore: number;
  riskLevel: RiskLevel;
}

export interface EconomicImpact {
  fuelSavedLiters: number;
  costSavedKrw: number;
  co2ReducedKg: number;
}
