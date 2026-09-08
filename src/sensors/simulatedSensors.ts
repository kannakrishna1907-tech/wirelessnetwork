import { SensorReading, FaultInjectionType } from '../types';

interface InternalNodePhysicsState {
  temperature: number;
  humidity: number;
  pressure: number;
  airQuality: number;
  voltage: number;
  current: number;
  energy: number;
  packetLoss: number;
  mpuVibration: number;
  commStatus: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  forcedFault: FaultInjectionType | null;
  activeOverrides?: Partial<SensorReading>;
}

export class SensorSimulator {
  private nodeStates: Map<string, InternalNodePhysicsState> = new Map();

  constructor() {
    this.initializeAllNodes();
  }

  public initializeAllNodes(): void {
    this.nodeStates.clear();
    for (let i = 1; i <= 8; i++) {
      const nodeId = `Node ${i}`;
      // Baseline initial realistic values with small deterministic offset per node
      const baseTemp = 24.0 + (i * 1.2);
      const baseHumidity = 55.0 - (i * 1.5);
      const basePressure = 1012.0 + (i * 0.4);
      const baseAirQuality = 90 + (i * 12);
      const baseVoltage = 4.15 - (i * 0.03);
      const baseCurrent = 45 + (i * 4); // mA base quiescent
      const baseEnergy = 98.0 - (i * 1.5);

      this.nodeStates.set(nodeId, {
        temperature: baseTemp,
        humidity: baseHumidity,
        pressure: basePressure,
        airQuality: baseAirQuality,
        voltage: baseVoltage,
        current: baseCurrent,
        energy: baseEnergy,
        packetLoss: 1.5 + (i * 0.3),
        mpuVibration: 0.05 + (i * 0.01),
        commStatus: 'CONNECTED',
        forcedFault: null,
      });
    }
  }

  /**
   * Smooth physics-based random walk update for a node
   * Maintains state and updates values gradually so it behaves like real BME280/MQ-135/INA219 sensors
   */
  public updateNodeReading(
    nodeId: string, 
    activityFactor: { txCount: number; rxCount: number; isRelay: boolean }
  ): SensorReading {
    let state = this.nodeStates.get(nodeId);
    if (!state) {
      this.initializeAllNodes();
      state = this.nodeStates.get(nodeId)!;
    }

    // If node has an active injected fault, apply distinct anomaly profiles
    if (state.forcedFault) {
      this.applyInjectedFaultPhysics(state, state.forcedFault);
    } else {
      // Normal Brownian drift with boundary bounce
      // Temperature: 20 - 40 °C (gentle drift ±0.15 °C)
      state.temperature += (Math.random() - 0.5) * 0.3;
      state.temperature = Math.max(21.0, Math.min(38.0, state.temperature));

      // Humidity: 30 - 90 % (drift ±0.4 %)
      state.humidity += (Math.random() - 0.5) * 0.8;
      state.humidity = Math.max(32.0, Math.min(88.0, state.humidity));

      // Pressure: 990 - 1030 hPa (drift ±0.2 hPa)
      state.pressure += (Math.random() - 0.5) * 0.4;
      state.pressure = Math.max(995.0, Math.min(1028.0, state.pressure));

      // Air Quality: 50 - 500 units (drift ±3 units)
      state.airQuality += (Math.random() - 0.48) * 5;
      state.airQuality = Math.max(60, Math.min(320, state.airQuality));

      // INA219 Current (mA): depends on RF transmission and reception
      const baseRadioCurrent = activityFactor.isRelay ? 95 : 55;
      const rfSpike = (activityFactor.txCount % 2 === 0 ? 45 : 15);
      state.current = baseRadioCurrent + rfSpike + (Math.random() - 0.5) * 8;
      state.current = Math.max(25, Math.min(180, state.current));

      // INA219 Voltage (V): gradual Li-ion curve (3.6V - 4.2V nominal)
      const voltageDip = (state.current / 1000) * 0.05; // IR internal resistance drop
      state.voltage = 3.6 + (state.energy / 100) * 0.55 - voltageDip;
      state.voltage = Math.max(3.1, Math.min(4.2, state.voltage));

      // Packet loss: 0 - 6% under normal RF propagation
      state.packetLoss = Math.max(0.5, Math.min(8.0, state.packetLoss + (Math.random() - 0.5) * 0.8));
      state.commStatus = 'CONNECTED';
      state.mpuVibration = 0.04 + Math.random() * 0.03;
    }

    // Calculate Power (mW) = Voltage (V) * Current (mA)
    const power = Number((state.voltage * state.current).toFixed(2));

    return {
      nodeId,
      temperature: Number(state.temperature.toFixed(1)),
      humidity: Number(state.humidity.toFixed(1)),
      pressure: Number(state.pressure.toFixed(1)),
      airQuality: Math.round(state.airQuality),
      voltage: Number(state.voltage.toFixed(2)),
      current: Number(state.current.toFixed(1)),
      power,
      energy: Number(state.energy.toFixed(1)),
      packetLoss: Number(state.packetLoss.toFixed(1)),
      commStatus: state.commStatus,
      mpuVibration: Number(state.mpuVibration.toFixed(2)),
      timestamp: new Date().toISOString(),
      source: 'SIMULATED',
    };
  }

  private applyInjectedFaultPhysics(state: InternalNodePhysicsState, faultType: FaultInjectionType): void {
    switch (faultType) {
      case 'SENSOR_ANOMALY':
        // Sudden spike in air quality (gas leak) and elevated temperature
        state.airQuality = Math.min(500, state.airQuality + 25 + Math.random() * 15);
        state.temperature = Math.min(46.0, state.temperature + 0.8);
        state.mpuVibration = 1.8 + Math.random() * 0.5;
        break;

      case 'LOW_VOLTAGE':
        // Sudden severe voltage collapse (battery cell degradation / short)
        state.voltage = Math.max(2.85, state.voltage - 0.18);
        state.current = Math.min(235, state.current + 10);
        state.energy = Math.max(12, state.energy - 3);
        state.commStatus = 'DEGRADED';
        break;

      case 'HIGH_CURRENT':
        // High current surge (e.g. short circuit or RF amplifier latchup >240mA)
        state.current = 245 + Math.random() * 20;
        state.voltage = Math.max(3.05, state.voltage - 0.08);
        state.energy = Math.max(5, state.energy - 1.2);
        break;

      case 'COMM_FAILURE':
        // Radio link loss / LoRa packet drops
        state.packetLoss = Math.min(100, state.packetLoss + 18);
        state.commStatus = state.packetLoss > 60 ? 'DISCONNECTED' : 'DEGRADED';
        state.current = 30 + Math.random() * 10;
        break;

      case 'NODE_FAILURE':
        // Total hardware freeze / reboot failure
        state.commStatus = 'DISCONNECTED';
        state.packetLoss = 100;
        state.current = 2; // idle quiescent leak
        state.voltage = 0.0;
        state.energy = 0;
        break;

      case 'LOW_ENERGY':
        // Battery nearly exhausted (<10% Critical)
        state.energy = Math.max(4.2, state.energy - 5.0);
        state.voltage = 3.12 - (10 - state.energy) * 0.03;
        state.current = 35 + Math.random() * 5;
        if (state.energy < 5) {
          state.commStatus = 'DEGRADED';
        }
        break;
    }
  }

  public injectFault(nodeId: string, faultType: FaultInjectionType): void {
    const state = this.nodeStates.get(nodeId);
    if (state) {
      state.forcedFault = faultType;
      // Immediate initial shift to emphasize reaction
      if (faultType === 'SENSOR_ANOMALY') state.airQuality = 420;
      if (faultType === 'LOW_VOLTAGE') state.voltage = 2.98;
      if (faultType === 'HIGH_CURRENT') state.current = 255;
      if (faultType === 'COMM_FAILURE') {
        state.packetLoss = 88;
        state.commStatus = 'DISCONNECTED';
      }
      if (faultType === 'NODE_FAILURE') {
        state.commStatus = 'DISCONNECTED';
        state.packetLoss = 100;
        state.voltage = 0.0;
      }
      if (faultType === 'LOW_ENERGY') {
        state.energy = 8.5;
        state.voltage = 3.15;
      }
    }
  }

  public clearFault(nodeId: string): void {
    const state = this.nodeStates.get(nodeId);
    if (state) {
      state.forcedFault = null;
      state.commStatus = 'CONNECTED';
      state.packetLoss = 2.0;
      state.current = 45.0;
      state.voltage = 3.92;
      state.energy = Math.max(50, state.energy);
      state.temperature = 26.0;
      state.airQuality = 110;
    }
  }

  public setRemainingEnergy(nodeId: string, newEnergy: number): void {
    const state = this.nodeStates.get(nodeId);
    if (state) {
      state.energy = Math.max(0, Math.min(100, newEnergy));
    }
  }

  public ingestExternalReading(reading: SensorReading): void {
    this.nodeStates.set(reading.nodeId, {
      temperature: reading.temperature,
      humidity: reading.humidity,
      pressure: reading.pressure,
      airQuality: reading.airQuality,
      voltage: reading.voltage,
      current: reading.current,
      energy: reading.energy,
      packetLoss: reading.packetLoss,
      mpuVibration: reading.mpuVibration,
      commStatus: reading.commStatus,
      forcedFault: null,
    });
  }
}
