import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  globalNetworkManager, 
  NetworkStateSnapshot 
} from './network/networkManager';
import { DemoScenarioRunner } from './network/demoScenarioRunner';
import { Header } from './components/Header';
import { NetworkOverview } from './components/NetworkOverview';
import { NetworkTopology } from './components/NetworkTopology';
import { SensorTable } from './components/SensorTable';
import { FaultDetectionPanel } from './components/FaultDetectionPanel';
import { RoutingPanel } from './components/RoutingPanel';
import { SelfHealingPanel } from './components/SelfHealingPanel';
import { BlockchainPanel } from './components/BlockchainPanel';
import { RealtimeCharts } from './components/RealtimeCharts';
import { FaultInjector } from './components/FaultInjector';
import { DemoScenarioModal } from './components/DemoScenarioModal';
import { Esp32IntegrationModal } from './components/Esp32IntegrationModal';
import { SensorReading, FaultInjectionType } from './types';

export default function App() {
  const [snapshot, setSnapshot] = useState<NetworkStateSnapshot>(() => globalNetworkManager.getSnapshot());
  const [selectedNodeId, setSelectedNodeId] = useState<string>('Node 1');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isEsp32ModalOpen, setIsEsp32ModalOpen] = useState(false);
  const faultInjectorRef = useRef<HTMLDivElement>(null);

  // Singleton demo runner instance
  const demoRunner = useMemo(() => new DemoScenarioRunner(globalNetworkManager), []);

  useEffect(() => {
    // Subscribe to reactive state updates from the cognitive network manager
    const unsubscribe = globalNetworkManager.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });

    // Start simulation automatically for immediate live experience
    globalNetworkManager.startSimulation();

    return () => {
      unsubscribe();
      globalNetworkManager.stopSimulation();
    };
  }, []);

  const handleToggleSimulation = () => {
    globalNetworkManager.toggleSimulation();
  };

  const handleResetSimulation = () => {
    globalNetworkManager.resetSimulation();
  };

  const handleSetSpeed = (speed: number) => {
    globalNetworkManager.setSpeed(speed);
  };

  const handleInjectFault = (nodeId: string, type: FaultInjectionType) => {
    globalNetworkManager.injectFault(nodeId, type);
  };

  const handleRecoverNode = (nodeId: string) => {
    globalNetworkManager.recoverNode(nodeId);
  };

  const handleVerifyBlockchain = () => {
    return globalNetworkManager.verifyBlockchain();
  };

  const handleTamperBlockchain = () => {
    return globalNetworkManager.tamperBlockchain();
  };

  const handleRepairBlockchain = () => {
    globalNetworkManager.repairBlockchain();
  };

  const handleInjectLiveReading = (reading: SensorReading) => {
    globalNetworkManager.ingestEsp32Reading(reading);
  };

  const handleScrollToFaultInjector = () => {
    faultInjectorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. Header with Controls & Academic Badges */}
      <Header
        snapshot={snapshot}
        onToggleSimulation={handleToggleSimulation}
        onResetSimulation={handleResetSimulation}
        onSetSpeed={handleSetSpeed}
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenEsp32Modal={() => setIsEsp32ModalOpen(true)}
        onOpenFaultInjector={handleScrollToFaultInjector}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 space-y-5">
        {/* 2. Network Overview Cards */}
        <NetworkOverview stats={snapshot.baseStationStats} />

        {/* 3. Graphical Network Topology Visualizer */}
        <NetworkTopology
          snapshot={snapshot}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          onQuickFault={(id) => handleInjectFault(id, 'SENSOR_ANOMALY')}
          onQuickRecover={(id) => handleRecoverNode(id)}
        />

        {/* 4. Sensor Telemetry & Energy Monitoring Table */}
        <SensorTable
          nodes={snapshot.nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          onInjectFault={(id, type) => handleInjectFault(id, type)}
          onRecoverNode={(id) => handleRecoverNode(id)}
        />

        {/* 5. Closed-Loop Machine Learning & Routing Layer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Fault Detection Panel (LightGBM) */}
          <FaultDetectionPanel
            nodes={snapshot.nodes}
            onSelectNode={(id) => setSelectedNodeId(id)}
          />

          {/* Intelligent Routing Panel (Dyna-Q) */}
          <RoutingPanel
            routes={snapshot.activeRoutes}
            dynaQEngine={globalNetworkManager.getDynaQEngine()}
          />
        </div>

        {/* 6. Self-Healing & Blockchain Layer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* AODV Autonomous Self-Healing Panel */}
          <SelfHealingPanel events={snapshot.aodvEvents} />

          {/* Blockchain Event & Telemetry Ledger (SHA-256) */}
          <BlockchainPanel
            blocks={snapshot.recentBlockchain}
            onVerify={handleVerifyBlockchain}
            onTamper={handleTamperBlockchain}
            onRepair={handleRepairBlockchain}
          />
        </div>

        {/* 7. Real-Time Graphs and Performance Curves */}
        <RealtimeCharts
          nodes={snapshot.nodes}
          stats={snapshot.baseStationStats}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
        />

        {/* 8. Dedicated Fault Injection Studio */}
        <div ref={faultInjectorRef}>
          <FaultInjector
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(id)}
            onInject={(id, type) => handleInjectFault(id, type)}
            onRecover={(id) => handleRecoverNode(id)}
            onResetAll={handleResetSimulation}
          />
        </div>
      </main>

      {/* Footer with Academic Attribution */}
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-400 py-4 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-slate-200 font-bold">
              Enhanced Cognitive Wireless Sensor Network
            </span>
            <span className="text-slate-500 ml-2">
              Software Prototype & Digital Twin Architecture
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">ESP32 • BME280 • MQ-135 • INA219 • MPU6050 • LoRa</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-mono">POST /api/sensor-data Ready</span>
          </div>
        </div>
      </footer>

      {/* 14-Stage Demonstration Modal */}
      <DemoScenarioModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        runner={demoRunner}
      />

      {/* ESP32 Hardware Integration Modal */}
      <Esp32IntegrationModal
        isOpen={isEsp32ModalOpen}
        onClose={() => setIsEsp32ModalOpen(false)}
        onInjectLiveReading={handleInjectLiveReading}
      />
    </div>
  );
}
