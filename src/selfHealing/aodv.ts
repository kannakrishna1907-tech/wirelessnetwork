import { AODVEvent, WSNNode, DynaQRoute } from '../types';

export class AODVSelfHealingEngine {
  private events: AODVEvent[] = [];
  private eventCounter: number = 1;

  public getEvents(): AODVEvent[] {
    return [...this.events].slice(-25).reverse();
  }

  public clearEvents(): void {
    this.events = [];
  }

  private addEvent(
    type: AODVEvent['type'],
    affectedNode: string,
    sourceNode: string,
    targetNode: string,
    details: string,
    discoveredPath?: string[],
    latencyMs: number = 24
  ): AODVEvent {
    const event: AODVEvent = {
      id: `AODV-${Date.now()}-${this.eventCounter++}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      affectedNode,
      details,
      sourceNode,
      targetNode,
      discoveredPath,
      latencyMs,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Checks if an existing active route contains a broken/faulty node
   */
  public isRouteBroken(route: string[], nodeMap: Map<string, WSNNode>): {
    broken: boolean;
    failedNode: string | null;
    failureReason: string | null;
  } {
    for (let i = 0; i < route.length; i++) {
      const nodeId = route[i];
      if (nodeId === 'Base Station') continue;

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      if (
        node.faultDetection.classification === 'FAULTY' ||
        node.nodeStatus === 'FAULTY' ||
        node.nodeStatus === 'OFFLINE' ||
        node.sensors.commStatus === 'DISCONNECTED'
      ) {
        return {
          broken: true,
          failedNode: nodeId,
          failureReason: node.faultDetection.primaryReason || 'Node unreachable or offline',
        };
      }
    }

    return { broken: false, failedNode: null, failureReason: null };
  }

  /**
   * Initiates AODV reactive route discovery:
   * 1. Broadcast RREQ (Route Request) to all neighbors of source
   * 2. Exclude faulty / offline / degraded nodes
   * 3. Forward RREQ until Base Station is reached
   * 4. Return optimal alternative RREP path
   */
  public recoverRoute(
    sourceId: string,
    failedNodeId: string,
    oldRoute: string[],
    nodeMap: Map<string, WSNNode>
  ): {
    recoveredRoute: DynaQRoute | null;
    recoveryEvents: AODVEvent[];
  } {
    const newEvents: AODVEvent[] = [];

    // Step 1: Detect failed node & route failure
    const failEvent = this.addEvent(
      'ROUTE_FAIL',
      failedNodeId,
      sourceId,
      'Base Station',
      `Route failure detected: intermediate hop ${failedNodeId} became unresponsive. Link broken.`
    );
    newEvents.push(failEvent);

    // Step 2 & 3: RREQ broadcast
    const rreqEvent = this.addEvent(
      'RREQ_BROADCAST',
      failedNodeId,
      sourceId,
      'Base Station',
      `AODV RREQ broadcast initiated by ${sourceId} to find alternative bypass avoiding ${failedNodeId}.`
    );
    newEvents.push(rreqEvent);

    // Step 4 & 5: BFS Search for healthy bypass path
    const queue: Array<{ current: string; path: string[] }> = [
      { current: sourceId, path: [sourceId] },
    ];
    const visited = new Set<string>([sourceId, failedNodeId]); // exclude failed node
    let discoveredPath: string[] | null = null;

    while (queue.length > 0) {
      const { current, path } = queue.shift()!;
      const node = nodeMap.get(current);
      if (!node) continue;

      if (node.neighbours.includes('Base Station')) {
        discoveredPath = [...path, 'Base Station'];
        break;
      }

      // Sort neighbors by highest remaining energy & lowest loss
      const candidates = node.neighbours
        .filter(n => !visited.has(n))
        .map(n => nodeMap.get(n))
        .filter((n): n is WSNNode => !!n && n.faultDetection.classification !== 'FAULTY' && n.nodeStatus !== 'FAULTY' && n.nodeStatus !== 'OFFLINE')
        .sort((a, b) => b.sensors.energy - a.sensors.energy);

      for (const candidate of candidates) {
        visited.add(candidate.id);
        queue.push({
          current: candidate.id,
          path: [...path, candidate.id],
        });
      }
    }

    if (!discoveredPath) {
      // Route discovery failed (network partitioned)
      return { recoveredRoute: null, recoveryEvents: newEvents };
    }

    // Step 6: RREP reply
    const rrepEvent = this.addEvent(
      'RREP_REPLY',
      failedNodeId,
      sourceId,
      'Base Station',
      `AODV RREP unicast returned: alternative path [${discoveredPath.join(' → ')}] validated.`,
      discoveredPath
    );
    newEvents.push(rrepEvent);

    // Step 7: Transmission restored
    const restoreEvent = this.addEvent(
      'ROUTE_RESTORED',
      failedNodeId,
      sourceId,
      'Base Station',
      `Data transmission restored via healthy bypass. Communication operational.`,
      discoveredPath,
      18
    );
    newEvents.push(restoreEvent);

    // Calculate metrics for recovered route
    let totalEnergy = 0;
    let maxLoss = 0;
    for (const hopId of discoveredPath) {
      if (hopId !== 'Base Station') {
        const h = nodeMap.get(hopId);
        if (h) {
          totalEnergy += h.sensors.energy;
          maxLoss = Math.max(maxLoss, h.sensors.packetLoss);
        }
      }
    }

    const hopCount = discoveredPath.length - 1;
    const avgEnergy = hopCount > 0 ? Number((totalEnergy / hopCount).toFixed(1)) : 100;

    const recoveredRoute: DynaQRoute = {
      source: sourceId,
      destination: 'Base Station',
      path: discoveredPath,
      totalHops: hopCount,
      routeCost: Math.max(5, Math.round(95 - avgEnergy * 0.5)),
      averageEnergy: avgEnergy,
      estimatedDelayMs: 14 * hopCount,
      packetLossRate: Number(maxLoss.toFixed(1)),
      algorithm: 'AODV-SelfHealed',
      reason: `AODV self-healed route: Automatically bypassed faulty ${failedNodeId} through ${discoveredPath.slice(1, -1).join(', ') || 'direct hop'}.`,
      qValue: 85.0,
      timestamp: new Date().toLocaleTimeString(),
    };

    return { recoveredRoute, recoveryEvents: newEvents };
  }
}
