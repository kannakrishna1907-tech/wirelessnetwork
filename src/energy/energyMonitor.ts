import { EnergyState, SensorReading } from '../types';

export class EnergyMonitor {
  /**
   * Energy drain model simulating INA219 current sensing and battery discharge:
   * Standby baseline drain: ~0.015% per cycle
   * Sensor sampling drain (BME280, MQ-135 heater, MPU6050): ~0.02% per cycle
   * LoRa Transmission drain: ~0.08% per active TX packet
   * LoRa Relaying/Reception drain: ~0.04% per RX packet
   */
  public static calculateEnergyDrain(
    currentEnergy: number,
    txPackets: number,
    rxPackets: number,
    isRelayNode: boolean,
    isFaulty: boolean
  ): number {
    if (currentEnergy <= 0) return 0;

    let drain = 0.02; // Baseline quiescent per cycle

    // Additional active RF transmission consumption
    if (txPackets > 0) {
      drain += 0.04 * Math.min(txPackets, 4);
    }
    if (rxPackets > 0 || isRelayNode) {
      drain += 0.03 * Math.min(rxPackets, 4);
    }

    // High current short circuit or latchup drains battery much faster
    if (isFaulty) {
      drain += 0.15;
    }

    const updatedEnergy = Math.max(0, currentEnergy - drain);
    return Number(updatedEnergy.toFixed(2));
  }

  /**
   * Classifies battery level into project specified thresholds:
   * > 60%: Healthy
   * 30% - 60%: Moderate
   * < 30%: Low Energy
   * < 10%: Critical
   */
  public static classifyEnergyState(energyPercent: number): EnergyState {
    if (energyPercent > 60) return 'HEALTHY';
    if (energyPercent >= 30) return 'MODERATE';
    if (energyPercent >= 10) return 'LOW_ENERGY';
    return 'CRITICAL';
  }

  /**
   * Computes INA219 power metrics
   */
  public static computePowerMetrics(voltage: number, currentMa: number): {
    voltage: number;
    currentMa: number;
    powerMw: number;
    powerWatts: number;
  } {
    const powerMw = Number((voltage * currentMa).toFixed(2));
    const powerWatts = Number((powerMw / 1000).toFixed(4));
    return {
      voltage: Number(voltage.toFixed(2)),
      currentMa: Number(currentMa.toFixed(1)),
      powerMw,
      powerWatts,
    };
  }
}
