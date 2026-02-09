
import React from 'react';
import { 
  Zap, 
  ArrowDownToLine, 
  Gauge, 
  Clock, 
  RotateCcw, 
  PauseCircle, 
  AlertTriangle, 
  GlassWater, 
  Ban, 
  Navigation,
  StopCircle
} from 'lucide-react';

export const BEHAVIOR_MAPPING = [
  // 5 Core Waste Factors (연료 소모와 직접 연계)
  { key: 'speedingCount', label: '과속', icon: <Gauge className="w-4 h-4" />, weight: 0.005, fuelPenalty: 0.05, costPerIncident: 50 },
  { key: 'suddenAccelCount', label: '급가속', icon: <Zap className="w-4 h-4" />, weight: 0.015, fuelPenalty: 0.10, costPerIncident: 75 },
  { key: 'suddenDecelCount', label: '급감속', icon: <ArrowDownToLine className="w-4 h-4" />, weight: 0.008, fuelPenalty: 0.03, costPerIncident: 40 },
  { key: 'suddenStopCount', label: '급정지', icon: <StopCircle className="w-4 h-4" />, weight: 0.012, fuelPenalty: 0.05, costPerIncident: 60 },
  { key: 'suddenStartCount', label: '급출발', icon: <Navigation className="w-4 h-4" />, weight: 0.015, fuelPenalty: 0.10, costPerIncident: 75 },
  
  // Safety Critical Factors
  { key: 'longSpeedingMin', label: '장기과속', icon: <Clock className="w-4 h-4" />, weight: 0.02, fuelPenalty: 0.15, costPerIncident: 100 },
  { key: 'gearShiftStoppedCount', label: '정차중 기어변속', icon: <RotateCcw className="w-4 h-4" />, weight: 0.002, fuelPenalty: 0.02, costPerIncident: 20 },
  { key: 'continuousDrivingViolationCount', label: '연속운행 위반', icon: <Ban className="w-4 h-4" />, weight: 0.05, fuelPenalty: 0, costPerIncident: 0 },
  { key: 'fatigueRiskCount', label: '피로누적 위험', icon: <AlertTriangle className="w-4 h-4" />, weight: 0.08, fuelPenalty: 0, costPerIncident: 0 },
  { key: 'duiSuspicionCount', label: '음주운전 의심', icon: <GlassWater className="w-4 h-4" />, weight: 0.2, fuelPenalty: 0, costPerIncident: 0 },
  { key: 'restViolationCount', label: '휴식시간 미준수', icon: <PauseCircle className="w-4 h-4" />, weight: 0.05, fuelPenalty: 0, costPerIncident: 0 },
  { key: 'trafficLawViolationCount', label: '법규위반', icon: <AlertTriangle className="w-4 h-4" />, weight: 0.03, fuelPenalty: 0, costPerIncident: 0 },
];

export const FUEL_PRICE_DEFAULT = 1650;
export const CO2_PER_LITER = 2.31;
