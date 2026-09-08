import { 
  WSNNode, 
  SensorReading, 
  DynaQRoute, 
  BaseStationStats, 
  BlockchainBlock, 
  AODVEvent, 
  FaultInjectionType 
} from '../types';
import { SensorSimulator } from '../sensors/simulatedSensors';
import { EnergyMonitor } from '../energy/energyMonitor';
import { LightgbmDetector } from '../faultDetection/lightgbmDetector';
import { DynaQRoutingEngine } from '../routing/dynaQ';
import { AODVSelfHealingEngine } from '../selfHealing/aodv';
import { BlockchainManager } from '../blockchain/blockchainManager';
import { BaseStationManager } from '../baseStation/baseStation';

export interface NetworkStateSnapshot {
  nodes: WSNNode[];
  baseStationCoords: { x: number; y: number };
  activeRoutes: DynaQRoute[];
  baseStationStats: BaseStationStats;
  recentBlockchain: BlockchainBlock[];
  aodvEvents: AODVEvent[];
  systemStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  simulationRunning: boolean;
  simulationSpeed: number; // 1, 2, 5
  lastCycleTimestamp: string;
  activePacketsInFlight: Array<{
    id: string;
    source: string;
    target: string;
    progress: number; // 0 to 100%
  }>;
}

export class NetworkManager {
  private sensorSimulator: SensorSimulator;
  private dynaQEngine: DynaQRoutingEngine;
  private aodvEngine: AODVSelfHealingEngine;
  private blockchain: BlockchainManager;
  private baseStation: BaseStationManager;

  private nodeMap: Map<string, WSNNode> = new Map();
  private baseStationCoords = { x: 740, y: 240 };
  private activeRoutes: DynaQRoute[] = [];
  private accumulatedTx = 0;
  private accumulatedRx = 0;
  private accumulatedLost = 0;

  private simulationRunning = false;
  private simulationSpeed = 1;
  private timerId: any = null;
  private stateChangeListeners: Array<(state: NetworkStateSnapshot) => void> = [];

  constructor() {
    this.sensorSimulator = new SensorSimulator();
    this.dynaQEngine = new DynaQRoutingEngine();
    this.aodvEngine = new AODVSelfHealingEngine();
    this.blockchain = new BlockchainManager();
    this.baseStation = new BaseStationManager();

    this.initializeTopology();
    this.runClosedLoopCycle();
  }

  /**
   * Defines physical 2D layout and wireless radio neighbors for 8 nodes + Base Station
   */
  private initializeTopology(): void {
    const defaultCoords: Record<string, { x: number; y: number; neighbours: string[] }> = {
      'Node 1': { x: 130, y: 150, neighbours: ['Node 2', 'Node 3', 'Node 4'] },
      'Node 2': { x: 130, y: 330, neighbours: ['Node 1', 'Node 4', 'Node 5'] },
      'Node 3': { x: 330, y: 120, neighbours: ['Node 1', 'Node 4', 'Node 6', 'Node 7'] },
      'Node 4': { x: 330, y: 240, neighbours: ['Node 1', 'Node 2', 'Node 3', 'Node 5', 'Node 6', 'Node 7', 'Node 8'] },
      'Node 5': { x: 330, y: 370, neighbours: ['Node 2', 'Node 4', 'Node 7', 'Node 8'] },
      'Node 6': { x: 540, y: 130, neighbours: ['Node 3', 'Node 4', 'Node 7', 'Base Station'] },
      'Node 7': { x: 540, y: 240, neighbours: ['Node 3', 'Node 4', 'Node 5', 'Node 6', 'Node 8', 'Base Station'] },
      'Node 8': { x: 540, y: 360, neighbours: ['Node 4', 'Node 5', 'Node 7', 'Base Station'] },
    };

    this.nodeMap.clear();
    for (let i = 1; i <= 8; i++) {
      const id = `Node ${i}`;
      const layout = defaultCoords[id];

      // Initial dummy reading to pass through pipeline
      const dummyReading: SensorReading = {
        nodeId: id,
        temperature: 24.5 + i,
        humidity: 50 + i,
        pressure: 1013,
        airQuality: 90 + i * 10,
        voltage: 4.10,
        current: 45,
        power: 184.5,
        energy: 100 - i * 0.5,
        packetLoss: 1.0,
        commStatus: 'CONNECTED',
        mpuVibration: 0.05,
        timestamp: new Date().toISOString(),
        source: 'SIMULATED',
      };

      const fault = LightgbmDetector.detectFault(dummyReading);

      const node: WSNNode = {
        id,
        shortId: `N${i}`,
        name: `Cognitive Sensor Node ${i}`,
        x: layout.x,
        y: layout.y,
        range: 240,
        sensors: dummyReading,
        energyState: 'HEALTHY',
        nodeStatus: 'ONLINE',
        faultDetection: fault,
        neighbours: layout.neighbours,
        currentRoute: [],
        packetCount: 0,
        transmissionCount: 0,
        receptionCount: 0,
        relayCount: 0,
        droppedPackets: 0,
      };

      this.nodeMap.set(id, node);
    }
  }

  /**
   * Executes the full closed loop pipeline:
   * SENSING -> ENERGY MONITORING -> FAULT DETECTION -> ROUTING OPTIMIZATION -> SELF-HEALING -> BLOCKCHAIN -> BASE STATION
   */
  public runClosedLoopCycle(): void {
    const nodeEntries = Array.from(this.nodeMap.entries());

    // 1. SENSING & PHYSICAL TELEMETRY UPDATE
    for (const [nodeId, node] of nodeEntries) {
      const isRelay = node.relayCount > 0;
      const reading = this.sensorSimulator.updateNodeReading(nodeId, {
        txCount: node.transmissionCount,
        rxCount: node.receptionCount,
        isRelay,
      });

      // 2. ENERGY MONITORING (INA219 Simulation)
      const updatedEnergy = EnergyMonitor.calculateEnergyDrain(
        reading.energy,
        node.transmissionCount % 4,
        node.receptionCount % 4,
        isRelay,
        node.faultDetection.classification === 'FAULTY'
      );
      reading.energy = updatedEnergy;
      this.sensorSimulator.setRemainingEnergy(nodeId, updatedEnergy);

      const energyState = EnergyMonitor.classifyEnergyState(updatedEnergy);
      node.energyState = energyState;

      // 3. FAULT DETECTION (LightGBM-compatible inference)
      const faultResult = LightgbmDetector.detectFault(reading);
      const previousClassification = node.faultDetection.classification;
      node.faultDetection = faultResult;
      node.sensors = reading;

      // Update Node Operational State
      if (reading.commStatus === 'DISCONNECTED' || reading.voltage <= 0.2) {
        node.nodeStatus = 'OFFLINE';
      } else if (faultResult.classification === 'FAULTY') {
        node.nodeStatus = 'FAULTY';
      } else if (isRelay) {
        node.nodeStatus = 'RELAYING';
      } else {
        node.nodeStatus = 'ONLINE';
      }

      // Check for state transition event for Blockchain logging
      if (previousClassification !== 'FAULTY' && faultResult.classification === 'FAULTY') {
        this.blockchain.addBlock(nodeId, 'FAULT_DETECTED', {
          eventReason: faultResult.primaryReason,
          sensorSummary: {
            temp: reading.temperature,
            voltage: reading.voltage,
            energy: reading.energy,
            airQuality: reading.airQuality,
          },
          notes: `LightGBM classification shifted to FAULTY. Severity: ${faultResult.severity}`,
        });
      } else if (energyState === 'CRITICAL' && previousClassification === 'NORMAL') {
        this.blockchain.addBlock(nodeId, 'ENERGY_WARNING', {
          eventReason: `Critical Energy Depletion (${reading.energy}%)`,
          sensorSummary: {
            temp: reading.temperature,
            voltage: reading.voltage,
            energy: reading.energy,
            airQuality: reading.airQuality,
          },
        });
      }
    }

    // 4. ROUTING OPTIMIZATION (Dyna-Q) & 5. SELF-HEALING (AODV)
    // Compute primary multi-hop routes from edge sensors (Node 1 and Node 2) to Base Station
    const monitoredSources = ['Node 1', 'Node 2'];
    const updatedRoutes: DynaQRoute[] = [];

    for (const sourceId of monitoredSources) {
      const existingRouteObj = this.activeRoutes.find(r => r.source === sourceId);
      const oldPath = existingRouteObj?.path || [];

      // Check if existing route suffered a hop failure
      const brokenCheck = this.aodvEngine.isRouteBroken(oldPath, this.nodeMap);

      if (brokenCheck.broken && brokenCheck.failedNode) {
        // AODV Self-Healing initiated
        this.baseStation.recordRouteFailure();

        const { recoveredRoute } = this.aodvEngine.recoverRoute(
          sourceId,
          brokenCheck.failedNode,
          oldPath,
          this.nodeMap
        );

        if (recoveredRoute) {
          updatedRoutes.push(recoveredRoute);
          this.blockchain.addBlock(sourceId, 'AODV_RECOVERY', {
            eventReason: `Route bypass around failed ${brokenCheck.failedNode}`,
            route: recoveredRoute.path,
            notes: `AODV route discovery succeeded with ${recoveredRoute.totalHops} hops.`,
          });
        } else {
          // Fallback to fresh Dyna-Q exploration
          const dynaRoute = this.dynaQEngine.findOptimalRoute(sourceId, this.nodeMap, this.baseStationCoords);
          updatedRoutes.push(dynaRoute);
        }
      } else {
        // Normal operation: Dyna-Q reinforcement learning route optimization
        const dynaRoute = this.dynaQEngine.findOptimalRoute(sourceId, this.nodeMap, this.baseStationCoords);
        updatedRoutes.push(dynaRoute);

        // Record route establishment if new
        if (oldPath.join('->') !== dynaRoute.path.join('->')) {
          this.blockchain.addBlock(sourceId, 'ROUTE_ESTABLISHED', {
            eventReason: 'Dyna-Q optimal route selected based on energy and latency',
            route: dynaRoute.path,
          });
        }
      }
    }

    this.activeRoutes = updatedRoutes;

    // Apply routes to nodes & accumulate packet delivery counts
    for (const route of updatedRoutes) {
      for (let i = 0; i < route.path.length; i++) {
        const nodeId = route.path[i];
        if (nodeId === 'Base Station') continue;
        const node = this.nodeMap.get(nodeId);
        if (node) {
          node.currentRoute = route.path;
          node.transmissionCount += 1;
          node.packetCount += 1;
          if (i > 0) {
            node.relayCount += 1;
            node.receptionCount += 1;
          }
        }
      }

      this.accumulatedTx += 1;
      if (route.path.includes('Base Station')) {
        this.accumulatedRx += 1;
        this.baseStation.logPacketReception(route.source, route.path);
      } else {
        this.accumulatedLost += 1;
      }
    }

    // 6. BASE STATION TELEMETRY AGGREGATION
    this.baseStation.updateMetrics(
      this.nodeMap,
      this.activeRoutes,
      this.accumulatedTx,
      this.accumulatedRx,
      this.accumulatedLost
    );

    // Broadcast state snapshot to UI
    this.notifyListeners();
  }

  public getSnapshot(): NetworkStateSnapshot {
    const nodes = Array.from(this.nodeMap.values());
    const stats = this.baseStation.getStats();

    let systemStatus: NetworkStateSnapshot['systemStatus'] = 'NORMAL';
    if (stats.faultyNodes >= 2 || stats.networkHealth < 50) {
      systemStatus = 'CRITICAL';
    } else if (stats.faultyNodes >= 1 || stats.networkHealth < 75) {
      systemStatus = 'WARNING';
    }

    // Active in-flight packet animations for routes
    const activePackets: NetworkStateSnapshot['activePacketsInFlight'] = [];
    for (const r of this.activeRoutes) {
      if (r.path.length >= 2) {
        for (let i = 0; i < r.path.length - 1; i++) {
          activePackets.push({
            id: `pkt-${r.source}-${i}`,
            source: r.path[i],
            target: r.path[i + 1],
            progress: (Date.now() / 20) % 100,
          });
        }
      }
    }

    return {
      nodes,
      baseStationCoords: this.baseStationCoords,
      activeRoutes: this.activeRoutes,
      baseStationStats: stats,
      recentBlockchain: this.blockchain.getChain().slice(-15).reverse(),
      aodvEvents: this.aodvEngine.getEvents(),
      systemStatus,
      simulationRunning: this.simulationRunning,
      simulationSpeed: this.simulationSpeed,
      lastCycleTimestamp: new Date().toLocaleTimeString(),
      activePacketsInFlight: activePackets,
    };
  }

  // --- Controls ---
  public startSimulation(): void {
    if (this.simulationRunning) return;
    this.simulationRunning = true;
    const intervalMs = Math.max(500, 2400 / this.simulationSpeed);
    this.timerId = setInterval(() => {
      this.runClosedLoopCycle();
    }, intervalMs);
    this.notifyListeners();
  }

  public stopSimulation(): void {
    this.simulationRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notifyListeners();
  }

  public toggleSimulation(): void {
    if (this.simulationRunning) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  public setSpeed(speed: number): void {
    this.simulationSpeed = speed;
    if (this.simulationRunning) {
      this.stopSimulation();
      this.startSimulation();
    } else {
      this.notifyListeners();
    }
  }

  public resetSimulation(): void {
    this.stopSimulation();
    this.sensorSimulator.initializeAllNodes();
    this.dynaQEngine.initialize();
    this.aodvEngine.clearEvents();
    this.blockchain.reset();
    this.baseStation.reset();
    this.accumulatedTx = 0;
    this.accumulatedRx = 0;
    this.accumulatedLost = 0;
    this.initializeTopology();
    this.runClosedLoopCycle();
  }

  public stepOnce(): void {
    this.runClosedLoopCycle();
  }

  // --- Fault Injection API ---
  public injectFault(nodeId: string, faultType: FaultInjectionType): void {
    this.sensorSimulator.injectFault(nodeId, faultType);
    // Immediately execute a closed-loop step to trigger detection & routing response
    this.runClosedLoopCycle();
  }

  public recoverNode(nodeId: string): void {
    this.sensorSimulator.clearFault(nodeId);
    const node = this.nodeMap.get(nodeId);
    if (node) {
      node.nodeStatus = 'ONLINE';
      node.droppedPackets = 0;
    }
    this.runClosedLoopCycle();
  }

  // --- Blockchain Actions ---
  public verifyBlockchain(): { isValid: boolean; corruptedIndex: number | null; reason?: string; verifiedBlocks: number } {
    const result = this.blockchain.verifyBlockchain();
    this.notifyListeners();
    return result;
  }

  public tamperBlockchain(): { tamperedIndex: number; originalContent: string; falsifiedContent: string } {
    const result = this.blockchain.tamperBlock();
    this.notifyListeners();
    return result;
  }

  public repairBlockchain(): void {
    this.blockchain.repairChain();
    this.notifyListeners();
  }

  public getBlockchainManager(): BlockchainManager {
    return this.blockchain;
  }

  public getDynaQEngine(): DynaQRoutingEngine {
    return this.dynaQEngine;
  }

  public getNodeMap(): Map<string, WSNNode> {
    return this.nodeMap;
  }

  // --- External ESP32 Ingestion ---
  public ingestEsp32Reading(reading: SensorReading): void {
    this.sensorSimulator.ingestExternalReading(reading);
    this.runClosedLoopCycle();
  }

  // --- Observer Pattern ---
  public subscribe(listener: (state: NetworkStateSnapshot) => void): () => void {
    this.stateChangeListeners.push(listener);
    listener(this.getSnapshot());
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.stateChangeListeners) {
      listener(snapshot);
    }
  }
}

// Global singleton instance for easy access across UI components
export const globalNetworkManager = new NetworkManager();
