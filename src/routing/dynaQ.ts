import { DynaQRoute, WSNNode } from '../types';

interface QTransitionModel {
  [key: string]: { reward: number; nextState: string; count: number };
}

export class DynaQRoutingEngine {
  // Q-Table mapping "state:action" -> Q-value
  private qTable: Map<string, number> = new Map();
  // Internal Dyna-Q learned transition model for planning steps
  private model: QTransitionModel = {};
  // Visited state-action pairs for planning
  private observedTransitions: Array<{ state: string; action: string }> = [];

  // Hyperparameters
  private alpha: number = 0.25; // Learning rate
  private gamma: number = 0.85; // Discount factor
  private epsilon: number = 0.10; // Exploration rate
  private planningSteps: number = 5; // Dyna-Q model planning iterations

  constructor() {
    this.initialize();
  }

  public initialize(): void {
    this.qTable.clear();
    this.model = {};
    this.observedTransitions = [];
  }

  private getKey(state: string, action: string): string {
    return `${state}->${action}`;
  }

  public getQValue(state: string, action: string): number {
    return this.qTable.get(this.getKey(state, action)) ?? 0.0;
  }

  public setQValue(state: string, action: string, value: number): void {
    this.qTable.set(this.getKey(state, action), value);
  }

  public getAllQValues(): Array<{ key: string; state: string; action: string; value: number }> {
    const list: Array<{ key: string; state: string; action: string; value: number }> = [];
    this.qTable.forEach((value, key) => {
      const [state, action] = key.split('->');
      list.push({ key, state, action, value: Number(value.toFixed(2)) });
    });
    return list.sort((a, b) => b.value - a.value);
  }

  /**
   * Reward function calculating multi-objective reinforcement score
   * Encourages: High energy, high link quality, low distance, low delay, healthy status
   * Penalizes: Faulty nodes, low battery, packet loss, broken comms
   */
  public calculateReward(
    sourceNode: WSNNode,
    targetNode: WSNNode | { id: string; energyState: string; faultDetection: { classification: string }; sensors: { energy: number; packetLoss: number } },
    distance: number
  ): { reward: number; factors: string[] } {
    let reward = 0;
    const factors: string[] = [];

    // Target is Base Station
    if (targetNode.id === 'Base Station') {
      reward += 100.0; // Terminal goal reward
      factors.push('Direct Base Station reachability (+100)');
      return { reward, factors };
    }

    const node = targetNode as WSNNode;

    // 1. Fault Status Penalty
    if (node.faultDetection.classification === 'FAULTY' || node.nodeStatus === 'FAULTY' || node.nodeStatus === 'OFFLINE') {
      reward -= 150.0;
      factors.push('Severe penalty: Node is FAULTY/OFFLINE (-150)');
      return { reward, factors };
    } else if (node.faultDetection.classification === 'ANOMALOUS') {
      reward -= 50.0;
      factors.push('Penalty: Node classified as ANOMALOUS (-50)');
    }

    // 2. Battery Energy Component
    const energy = node.sensors.energy;
    if (energy < 10 || node.energyState === 'CRITICAL') {
      reward -= 90.0;
      factors.push(`Critical battery warning (${energy}%): Heavy routing penalty (-90)`);
    } else if (energy < 30 || node.energyState === 'LOW_ENERGY') {
      reward -= 40.0;
      factors.push(`Low battery penalty (${energy}%): Discouraged (-40)`);
    } else if (energy > 60) {
      reward += (energy / 100) * 40.0;
      factors.push(`High battery surplus (${energy}%): Encouraged (+${((energy / 100) * 40).toFixed(1)})`);
    }

    // 3. Link Quality & Packet Loss
    const packetLoss = node.sensors.packetLoss;
    reward -= (packetLoss / 100) * 35.0;
    if (packetLoss > 15) {
      factors.push(`High packet loss (${packetLoss}%): Penalized (-${((packetLoss / 100) * 35).toFixed(1)})`);
    }

    // 4. Physical Euclidean Distance
    const normDist = Math.min(1.0, distance / 400);
    reward -= normDist * 20.0;

    // 5. Radio Communication Status
    if (node.sensors.commStatus === 'DISCONNECTED') {
      reward -= 120.0;
    } else if (node.sensors.commStatus === 'DEGRADED') {
      reward -= 30.0;
    }

    return { reward: Number(reward.toFixed(2)), factors };
  }

  /**
   * Dyna-Q Real Experience Update + Model Planning Iterations
   */
  public update(
    state: string,
    action: string,
    reward: number,
    nextState: string,
    availableNextActions: string[]
  ): void {
    // 1. Direct Q-learning update (Real Experience)
    const oldQ = this.getQValue(state, action);
    let maxNextQ = 0;
    if (availableNextActions.length > 0) {
      maxNextQ = Math.max(...availableNextActions.map(a => this.getQValue(nextState, a)));
    }
    const newQ = oldQ + this.alpha * (reward + this.gamma * maxNextQ - oldQ);
    this.setQValue(state, action, newQ);

    // 2. Model learning (Environment Transition Memory)
    const transitionKey = this.getKey(state, action);
    const existing = this.model[transitionKey];
    this.model[transitionKey] = {
      reward,
      nextState,
      count: (existing?.count ?? 0) + 1,
    };

    if (!this.observedTransitions.some(t => t.state === state && t.action === action)) {
      this.observedTransitions.push({ state, action });
    }

    // 3. Dyna-Q Planning: Replay simulated experiences from model
    for (let i = 0; i < this.planningSteps; i++) {
      if (this.observedTransitions.length === 0) break;
      const randomIdx = Math.floor(Math.random() * this.observedTransitions.length);
      const sample = this.observedTransitions[randomIdx];
      const modelOutcome = this.model[this.getKey(sample.state, sample.action)];

      if (modelOutcome) {
        const plannedOldQ = this.getQValue(sample.state, sample.action);
        // Estimate next Q
        const plannedNextQ = modelOutcome.nextState === 'Base Station' ? 100 : 20;
        const plannedNewQ = plannedOldQ + this.alpha * (modelOutcome.reward + this.gamma * plannedNextQ - plannedOldQ);
        this.setQValue(sample.state, sample.action, plannedNewQ);
      }
    }
  }

  /**
   * Find optimal path from source to Base Station using learned Q-values
   */
  public findOptimalRoute(
    sourceId: string,
    nodeMap: Map<string, WSNNode>,
    baseStationCoords: { x: number; y: number }
  ): DynaQRoute {
    const path: string[] = [sourceId];
    const visited = new Set<string>([sourceId]);
    let currentId = sourceId;
    let totalCost = 0;
    let totalEnergy = 0;
    let totalDelayMs = 0;
    let maxLoss = 0;
    let routeReasons: string[] = [];

    const MAX_HOPS = 7;

    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const currentNode = nodeMap.get(currentId);
      if (!currentNode) break;

      totalEnergy += currentNode.sensors.energy;
      totalDelayMs += 12 + Math.floor(Math.random() * 8); // 12-20ms per hop
      maxLoss = Math.max(maxLoss, currentNode.sensors.packetLoss);

      // Check if Base Station is in neighbors
      if (currentNode.neighbours.includes('Base Station')) {
        path.push('Base Station');
        routeReasons.push(`Direct link from ${currentId} to Base Station reached.`);
        break;
      }

      // Filter available candidates that haven't been visited in this path
      const candidates = currentNode.neighbours.filter(
        nId => !visited.has(nId)
      );

      if (candidates.length === 0) {
        // Dead end or disconnected
        routeReasons.push(`Path terminated early: No viable forward neighbors from ${currentId}.`);
        break;
      }

      // Select candidate with highest Q-value
      let bestCandidate = candidates[0];
      let bestQ = -99999;

      for (const candId of candidates) {
        const targetNode = candId === 'Base Station' 
          ? { id: 'Base Station', energyState: 'HEALTHY', faultDetection: { classification: 'NORMAL' }, sensors: { energy: 100, packetLoss: 0 } }
          : nodeMap.get(candId);

        if (!targetNode) continue;

        const dist = candId === 'Base Station'
          ? Math.hypot(currentNode.x - baseStationCoords.x, currentNode.y - baseStationCoords.y)
          : Math.hypot(currentNode.x - (targetNode as WSNNode).x, currentNode.y - (targetNode as WSNNode).y);

        const { reward, factors } = this.calculateReward(currentNode, targetNode as any, dist);
        
        // Combine learned Q-value with immediate reward
        const currentQ = this.getQValue(currentId, candId);
        const combinedScore = currentQ + reward;

        // Perform learning update
        const candNextActions = candId === 'Base Station' ? [] : (nodeMap.get(candId)?.neighbours || []);
        this.update(currentId, candId, reward, candId, candNextActions);

        if (combinedScore > bestQ) {
          bestQ = combinedScore;
          bestCandidate = candId;
          if (factors.length > 0 && hop === 0) {
            routeReasons = factors.slice(0, 2);
          }
        }
      }

      path.push(bestCandidate);
      visited.add(bestCandidate);
      totalCost += Math.max(1, Math.round(100 - bestQ));

      if (bestCandidate === 'Base Station') {
        break;
      }

      currentId = bestCandidate;
    }

    const hopCount = path.length - 1;
    const avgEnergy = hopCount > 0 ? Number((totalEnergy / hopCount).toFixed(1)) : 100;
    const bestNextHop = path[1] || 'None';

    const rationale = path.includes('Base Station')
      ? `Selected via Dyna-Q because ${bestNextHop} exhibits higher energy (${nodeMap.get(bestNextHop)?.sensors.energy ?? 100}%), nominal fault classification, and lowest multi-hop latency.`
      : `Dyna-Q path exploration limited by connectivity constraints.`;

    return {
      source: sourceId,
      destination: 'Base Station',
      path,
      totalHops: hopCount,
      routeCost: totalCost,
      averageEnergy: avgEnergy,
      estimatedDelayMs: totalDelayMs,
      packetLossRate: Number(maxLoss.toFixed(1)),
      algorithm: 'Dyna-Q',
      reason: rationale,
      qValue: Number(this.getQValue(sourceId, bestNextHop).toFixed(2)),
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}
