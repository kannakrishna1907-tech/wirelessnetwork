/**
 * Enhanced Cognitive Wireless Sensor Network
 * Types and Data Contracts
 */

export type EnergyState = 'HEALTHY' | 'MODERATE' | 'LOW_ENERGY' | 'CRITICAL';
export type NodeOperationalState = 'ONLINE' | 'TRANSMITTING' | 'RELAYING' | 'FAULTY' | 'OFFLINE';
export type FaultClassification = 'NORMAL' | 'ANOMALOUS' | 'FAULTY';

export interface SensorReading {
  nodeId: string;
  temperature: number; // 20 - 40 °C (BME280)
  humidity: number;    // 30 - 90 % (BME280)
  pressure: number;    // 990 - 1030 hPa (BME280)
  airQuality: number;  // 50 - 500 arbitrary sensor units / PPM (MQ-135)
  voltage: number;     // 3.0 - 4.2 V (INA219 / Li-ion)
  current: number;     // 20 - 250 mA (INA219)
  power: number;       // mW (voltage * current)
  energy: number;      // 0 - 100 % (Remaining battery energy)
  packetLoss: number;  // 0 - 100 % (calculated communication packet loss)
  commStatus: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  mpuVibration: number; // 0 - 10 g (MPU6050 physical vibration/tilt)
  timestamp: string;
  source: 'SIMULATED' | 'ESP32_PHYSICAL';
}

export interface LightGBMFeatureVector {
  temperature: number;
  humidity: number;
  pressure: number;
  airQuality: number;
  voltage: number;
  current: number;
  power: number;
  remainingEnergy: number;
  packetLoss: number;
  commStatusScore: number; // 1.0 = CONNECTED, 0.5 = DEGRADED, 0.0 = DISCONNECTED
}

export interface LightGBMDetectionResult {
  classification: FaultClassification;
  confidence: number; // 0 - 100 %
  anomalyScore: number; // 0.0 - 1.0
  reasons: string[];
  primaryReason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
  detectionTime: string;
  treeSplitsEvaluated: number;
  featureContributions: {
    voltage: number;
    current: number;
    energy: number;
    temperature: number;
    airQuality: number;
    packetLoss: number;
    commStatus: number;
  };
}

export interface WSNNode {
  id: string; // e.g. "Node 1"
  shortId: string; // e.g. "N1"
  name: string;
  x: number; // Canvas / topology coordinates
  y: number;
  range: number; // Wireless communication radius (meters / px)
  sensors: SensorReading;
  energyState: EnergyState;
  nodeStatus: NodeOperationalState;
  faultDetection: LightGBMDetectionResult;
  neighbours: string[]; // List of Node IDs within radio range
  currentRoute: string[]; // e.g. ["Node 1", "Node 3", "Node 5", "Base Station"]
  packetCount: number;
  transmissionCount: number;
  receptionCount: number;
  relayCount: number;
  droppedPackets: number;
  isBaseStation?: boolean;
}

export interface DynaQRoute {
  source: string;
  destination: string;
  path: string[];
  totalHops: number;
  routeCost: number;
  averageEnergy: number;
  estimatedDelayMs: number;
  packetLossRate: number;
  algorithm: 'Dyna-Q' | 'AODV-SelfHealed';
  reason: string;
  qValue: number;
  timestamp: string;
}

export interface AODVEvent {
  id: string;
  timestamp: string;
  type: 'ROUTE_FAIL' | 'RREQ_BROADCAST' | 'RREP_REPLY' | 'ROUTE_RESTORED' | 'NODE_RECOVERED';
  affectedNode: string;
  details: string;
  sourceNode: string;
  targetNode: string;
  discoveredPath?: string[];
  latencyMs: number;
}

export interface BlockchainBlock {
  index: number;
  timestamp: string;
  nodeId: string;
  eventType: 'GENESIS' | 'ROUTE_ESTABLISHED' | 'FAULT_DETECTED' | 'ROUTE_FAILURE' | 'AODV_RECOVERY' | 'ENERGY_WARNING' | 'TAMPER_ATTEMPT';
  payload: {
    eventReason?: string;
    route?: string[];
    sensorSummary?: {
      temp: number;
      voltage: number;
      energy: number;
      airQuality: number;
    };
    notes?: string;
  };
  previousHash: string;
  hash: string;
  isValid?: boolean;
  isTampered?: boolean;
}

export interface BaseStationStats {
  connectedNodes: number;
  activeNodes: number;
  faultyNodes: number;
  totalPackets: number;
  receivedPackets: number;
  lostPackets: number;
  activeRoutesCount: number;
  failedRoutesCount: number;
  averageEnergy: number;
  networkHealth: number; // 0 - 100 %
  throughputBps: number;
  averageLatencyMs: number;
}

export type FaultInjectionType = 
  | 'SENSOR_ANOMALY' 
  | 'LOW_VOLTAGE' 
  | 'HIGH_CURRENT' 
  | 'COMM_FAILURE' 
  | 'NODE_FAILURE' 
  | 'LOW_ENERGY';

export interface FaultInjectionConfig {
  nodeId: string;
  faultType: FaultInjectionType;
}

export interface DemoScenarioStage {
  stage: number;
  title: string;
  description: string;
  triggerAction: string;
  expectedOutcome: string;
}
