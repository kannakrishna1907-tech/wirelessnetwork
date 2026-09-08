import { NetworkManager } from './networkManager';

export interface DemoStepInfo {
  stage: number;
  title: string;
  category: 'INITIALIZATION' | 'SENSING' | 'ROUTING' | 'FAULT_INJECTION' | 'LIGHTGBM' | 'DYNA_Q' | 'AODV_HEALING' | 'BLOCKCHAIN' | 'STEADY_STATE';
  description: string;
  systemAction: string;
  expectedObservation: string;
}

export const DEMO_STAGES: DemoStepInfo[] = [
  {
    stage: 1,
    title: 'Initialize 8-Node Cognitive Network',
    category: 'INITIALIZATION',
    description: 'Start all 8 nodes with full healthy energy (>95%) and nominal baseline parameters.',
    systemAction: 'Resetting network state, clearing faults, and seeding initial battery charge.',
    expectedObservation: 'All nodes display Healthy (Green) with 0 faults.',
  },
  {
    stage: 2,
    title: 'Generate Normal Sensor Telemetry',
    category: 'SENSING',
    description: 'BME280, MQ-135, and INA219 simulate smooth environmental readings within nominal physical limits.',
    systemAction: 'Triggering physics walk (Temp 24-26°C, AQ 80-120 PPM, Voltage 4.1V, Current 45mA).',
    expectedObservation: 'Sensor table populates with active telemetry labeled SIMULATED SENSOR DATA.',
  },
  {
    stage: 3,
    title: 'Dyna-Q Reinforcement Learning Route Convergence',
    category: 'ROUTING',
    description: 'Dyna-Q agent explores neighbor states and converges on initial optimal multi-hop paths to Base Station.',
    systemAction: 'Running Dyna-Q Bellman updates and model planning across graph nodes.',
    expectedObservation: 'Initial route active: Node 1 → Node 4 → Node 7 → Base Station (or Node 3 → Node 6).',
  },
  {
    stage: 4,
    title: 'Inject Abnormal Sensor Reading into Node 4',
    category: 'FAULT_INJECTION',
    description: 'Simulate environmental contamination / gas leakage or temperature surge on intermediate relay Node 4.',
    systemAction: 'Injecting air quality surge (>420 units) and thermal drift into Node 4.',
    expectedObservation: 'Node 4 sensor table reflects elevated air quality reading.',
  },
  {
    stage: 5,
    title: 'LightGBM Detects Anomaly',
    category: 'LIGHTGBM',
    description: 'The LightGBM-compatible decision ensemble processes feature vector and flags anomaly.',
    systemAction: 'LightGBM multi-split inference evaluates Air Quality > 380 cutoff.',
    expectedObservation: 'Node 4 status transitions to ANOMALOUS with explanation: "Hazardous air quality".',
  },
  {
    stage: 6,
    title: 'Node 4 Marked as Unreliable',
    category: 'LIGHTGBM',
    description: 'Cognitive supervisor tags Node 4 as degraded and broadcasts warning state.',
    systemAction: 'Node 4 flagged in routing cost matrix as high-risk intermediate candidate.',
    expectedObservation: 'Routing cost increases for any candidate hop through Node 4.',
  },
  {
    stage: 7,
    title: 'Dyna-Q Reduces Routing Preference',
    category: 'DYNA_Q',
    description: 'Dyna-Q reinforcement penalty (-50) reduces Q(s, Node 4) in the Q-table.',
    systemAction: 'Applying reinforcement learning penalty to discourage Node 4 forwarding.',
    expectedObservation: 'Q-value for Node 4 drops; agent prepares bypass candidates.',
  },
  {
    stage: 8,
    title: 'Simulate Node 4 Physical Failure',
    category: 'FAULT_INJECTION',
    description: 'Induce total communication breakdown / hardware failure on Node 4 to test self-healing.',
    systemAction: 'Node 4 communication severed (Packet loss = 100%, Status = FAULTY/OFFLINE).',
    expectedObservation: 'Node 4 turns Red (FAULTY); existing active route breaks.',
  },
  {
    stage: 9,
    title: 'AODV Detects Route Failure',
    category: 'AODV_HEALING',
    description: 'AODV routing layer detects link timeout and issues Route Error (RERR) packet.',
    systemAction: 'RERR generated for broken path [Node 1 → Node 4 → Node 7 → Base Station].',
    expectedObservation: 'Self-Healing panel logs: "Route failure detected: intermediate hop Node 4 unresponsive".',
  },
  {
    stage: 10,
    title: 'AODV Route Discovery (RREQ / RREP)',
    category: 'AODV_HEALING',
    description: 'AODV broadcasts RREQ to healthy neighbors and discovers alternative bypass path.',
    systemAction: 'Flooding RREQ across Node 1 → Node 3 → Node 6/7 → Base Station.',
    expectedObservation: 'AODV panel logs: "AODV route discovery initiated" followed by "Alternative route found".',
  },
  {
    stage: 11,
    title: 'Data Transmission Resumes via Alternative Route',
    category: 'AODV_HEALING',
    description: 'Traffic seamlessly switches to healthy bypass path (e.g., Node 1 → Node 3 → Node 6 → Base Station).',
    systemAction: 'RREP unicast commits new routing table entry.',
    expectedObservation: 'Topology lines dynamically reroute around Node 4. Packet flow continues.',
  },
  {
    stage: 12,
    title: 'Secure Event Stored in SHA-256 Blockchain',
    category: 'BLOCKCHAIN',
    description: 'Cryptographic block minted logging the fault detection and AODV recovery event.',
    systemAction: 'Mining SHA-256 block with previousHash linkage and tamper-evident payload.',
    expectedObservation: 'New block appended to Blockchain Explorer with event type AODV_RECOVERY.',
  },
  {
    stage: 13,
    title: 'Base Station & Dashboard Updated',
    category: 'INITIALIZATION',
    description: 'Central Base Station aggregates updated packet delivery ratio, active routes, and system status.',
    systemAction: 'Updating Network Health score and Base Station route counters.',
    expectedObservation: 'Active routes count restored; system health stabilizes.',
  },
  {
    stage: 14,
    title: 'Continuous Closed-Loop Adaptation',
    category: 'STEADY_STATE',
    description: 'The network maintains continuous autonomous operation under the new topology.',
    systemAction: 'Resuming regular closed-loop sensing and energy monitoring cycles.',
    expectedObservation: 'Full closed-loop loop completed: Sensing → Energy → LightGBM → Dyna-Q → AODV → Blockchain → Dashboard.',
  },
];

export class DemoScenarioRunner {
  private networkManager: NetworkManager;
  private currentStageIndex = 0;
  private isRunning = false;
  private timer: any = null;
  private onStageChangeCallback: ((stage: DemoStepInfo, isComplete: boolean) => void) | null = null;

  constructor(networkManager: NetworkManager) {
    this.networkManager = networkManager;
  }

  public setCallback(cb: (stage: DemoStepInfo, isComplete: boolean) => void): void {
    this.onStageChangeCallback = cb;
  }

  public getCurrentStage(): DemoStepInfo {
    return DEMO_STAGES[this.currentStageIndex];
  }

  public getStageIndex(): number {
    return this.currentStageIndex;
  }

  public isAutoPlaying(): boolean {
    return this.isRunning;
  }

  public startAutoDemo(intervalMs: number = 3800): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.executeStage(this.currentStageIndex);

    this.timer = setInterval(() => {
      if (this.currentStageIndex < DEMO_STAGES.length - 1) {
        this.nextStage();
      } else {
        this.stopAutoDemo();
      }
    }, intervalMs);
  }

  public stopAutoDemo(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public resetDemo(): void {
    this.stopAutoDemo();
    this.currentStageIndex = 0;
    this.networkManager.resetSimulation();
    this.executeStage(0);
  }

  public nextStage(): void {
    if (this.currentStageIndex < DEMO_STAGES.length - 1) {
      this.currentStageIndex += 1;
      this.executeStage(this.currentStageIndex);
    }
  }

  public prevStage(): void {
    if (this.currentStageIndex > 0) {
      this.currentStageIndex -= 1;
      this.executeStage(this.currentStageIndex);
    }
  }

  public jumpToStage(index: number): void {
    if (index >= 0 && index < DEMO_STAGES.length) {
      this.currentStageIndex = index;
      this.executeStage(index);
    }
  }

  private executeStage(stageIndex: number): void {
    const stage = DEMO_STAGES[stageIndex];

    switch (stage.stage) {
      case 1:
        this.networkManager.resetSimulation();
        break;

      case 2:
        this.networkManager.runClosedLoopCycle();
        break;

      case 3:
        // Establish initial routes
        this.networkManager.runClosedLoopCycle();
        break;

      case 4:
        // Abnormal sensor reading into Node 4
        this.networkManager.injectFault('Node 4', 'SENSOR_ANOMALY');
        break;

      case 5:
      case 6:
      case 7:
        this.networkManager.runClosedLoopCycle();
        break;

      case 8:
        // Communication / node failure on Node 4
        this.networkManager.injectFault('Node 4', 'NODE_FAILURE');
        break;

      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
        this.networkManager.runClosedLoopCycle();
        break;
    }

    if (this.onStageChangeCallback) {
      this.onStageChangeCallback(stage, stageIndex === DEMO_STAGES.length - 1);
    }
  }
}
