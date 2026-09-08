import { BaseStationStats, WSNNode, DynaQRoute } from '../types';

export class BaseStationManager {
  private stats: BaseStationStats = {
    connectedNodes: 8,
    activeNodes: 8,
    faultyNodes: 0,
    totalPackets: 0,
    receivedPackets: 0,
    lostPackets: 0,
    activeRoutesCount: 0,
    failedRoutesCount: 0,
    averageEnergy: 100,
    networkHealth: 100,
    throughputBps: 2400,
    averageLatencyMs: 35,
  };

  private receivedPacketsBuffer: Array<{
    packetId: string;
    source: string;
    route: string[];
    timestamp: string;
    payloadSize: number;
  }> = [];

  public getStats(): BaseStationStats {
    return { ...this.stats };
  }

  public getRecentPackets(): Array<{
    packetId: string;
    source: string;
    route: string[];
    timestamp: string;
    payloadSize: number;
  }> {
    return [...this.receivedPacketsBuffer].slice(0, 15);
  }

  /**
   * Recalculates Base Station aggregated metrics from network node states
   */
  public updateMetrics(
    nodeMap: Map<string, WSNNode>,
    activeRoutes: DynaQRoute[],
    accumulatedTx: number,
    accumulatedRx: number,
    accumulatedLost: number
  ): BaseStationStats {
    const nodes = Array.from(nodeMap.values());
    let activeCount = 0;
    let faultyCount = 0;
    let energySum = 0;

    for (const node of nodes) {
      energySum += node.sensors.energy;
      if (node.nodeStatus === 'FAULTY' || node.nodeStatus === 'OFFLINE' || node.faultDetection.classification === 'FAULTY') {
        faultyCount++;
      } else {
        activeCount++;
      }
    }

    const connectedNodes = nodes.filter(n => n.sensors.commStatus !== 'DISCONNECTED').length;
    const avgEnergy = nodes.length > 0 ? Number((energySum / nodes.length).toFixed(1)) : 0;

    // Network Health Score (0 - 100)
    // 40% from node availability, 30% from average energy, 30% from packet delivery ratio
    const deliveryRatio = (accumulatedRx / Math.max(1, accumulatedTx)) * 100;
    const nodeAvailability = (activeCount / nodes.length) * 100;
    const healthScore = Math.min(
      100,
      Math.max(
        0,
        Number((nodeAvailability * 0.4 + (avgEnergy / 100) * 30 + (deliveryRatio / 100) * 30).toFixed(1))
      )
    );

    this.stats = {
      connectedNodes,
      activeNodes: activeCount,
      faultyNodes: faultyCount,
      totalPackets: accumulatedTx,
      receivedPackets: accumulatedRx,
      lostPackets: accumulatedLost,
      activeRoutesCount: activeRoutes.length,
      failedRoutesCount: this.stats.failedRoutesCount,
      averageEnergy: avgEnergy,
      networkHealth: healthScore,
      throughputBps: Math.round(activeCount * 320 + (deliveryRatio / 100) * 120),
      averageLatencyMs: Math.round(28 + (faultyCount * 14)),
    };

    return { ...this.stats };
  }

  public recordRouteFailure(): void {
    this.stats.failedRoutesCount += 1;
  }

  public logPacketReception(source: string, route: string[]): void {
    this.receivedPacketsBuffer.unshift({
      packetId: `PKT-${Date.now().toString().slice(-5)}`,
      source,
      route,
      timestamp: new Date().toLocaleTimeString(),
      payloadSize: 32, // bytes per LoRa payload
    });
    if (this.receivedPacketsBuffer.length > 50) {
      this.receivedPacketsBuffer.pop();
    }
  }

  public reset(): void {
    this.stats = {
      connectedNodes: 8,
      activeNodes: 8,
      faultyNodes: 0,
      totalPackets: 0,
      receivedPackets: 0,
      lostPackets: 0,
      activeRoutesCount: 0,
      failedRoutesCount: 0,
      averageEnergy: 100,
      networkHealth: 100,
      throughputBps: 2400,
      averageLatencyMs: 35,
    };
    this.receivedPacketsBuffer = [];
  }
}
