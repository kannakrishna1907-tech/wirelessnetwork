import React, { useState } from 'react';
import { FaultInjectionType } from '../types';
import { 
  Flame, 
  ShieldCheck, 
  Zap, 
  BatteryLow, 
  WifiOff, 
  PowerOff, 
  Radio, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';

interface FaultInjectorProps {
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onInject: (nodeId: string, type: FaultInjectionType) => void;
  onRecover: (nodeId: string) => void;
  onResetAll: () => void;
}

export const FaultInjector: React.FC<FaultInjectorProps> = ({
  selectedNodeId,
  onSelectNode,
  onInject,
  onRecover,
  onResetAll,
}) => {
  const [selectedType, setSelectedType] = useState<FaultInjectionType>('SENSOR_ANOMALY');
  const [lastInjectedInfo, setLastInjectedInfo] = useState<string | null>(null);

  const faultOptions: Array<{
    type: FaultInjectionType;
    label: string;
    description: string;
    icon: any;
    color: string;
  }> = [
    {
      type: 'SENSOR_ANOMALY',
      label: 'Sensor Anomaly',
      description: 'Elevated air quality (>420 PPM) & thermal spike (MQ-135/BME280)',
      icon: Flame,
      color: 'text-amber-400',
    },
    {
      type: 'LOW_VOLTAGE',
      label: 'Low Voltage',
      description: 'Sudden battery drop (<3.1V) below minimum operating threshold (INA219)',
      icon: BatteryLow,
      color: 'text-rose-400',
    },
    {
      type: 'HIGH_CURRENT',
      label: 'High Current Surge',
      description: 'Excessive current draw (>240mA) indicating hardware short circuit',
      icon: Zap,
      color: 'text-orange-400',
    },
    {
      type: 'COMM_FAILURE',
      label: 'Communication Failure',
      description: 'LoRa radio link failure causing severe packet loss (>85%)',
      icon: WifiOff,
      color: 'text-rose-500',
    },
    {
      type: 'NODE_FAILURE',
      label: 'Node Hardware Failure',
      description: 'Total microcontroller freeze / power loss (Node goes Offline)',
      icon: PowerOff,
      color: 'text-rose-600',
    },
    {
      type: 'LOW_ENERGY',
      label: 'Low Energy Depletion',
      description: 'Battery drained into critical zone (<10%) requiring immediate routing bypass',
      icon: BatteryLow,
      color: 'text-pink-500',
    },
  ];

  const handleInject = () => {
    onInject(selectedNodeId, selectedType);
    setLastInjectedInfo(`Injected ${selectedType} into ${selectedNodeId}. Closed-loop cascade initiated!`);
  };

  const handleRecover = () => {
    onRecover(selectedNodeId);
    setLastInjectedInfo(`Node ${selectedNodeId} restored to nominal healthy status.`);
  };

  return (
    <div id="panel-fault-injection-studio" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-400" />
            Autonomous Closed-Loop Fault Injection Studio
          </h2>
          <p className="text-xs text-slate-400">
            Inject synthetic faults to verify the automated pipeline: LightGBM Detection → Dyna-Q Penalty → AODV Rerouting → Blockchain Logging
          </p>
        </div>

        <button
          onClick={onResetAll}
          className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3 text-slate-400" />
          Reset All Nodes
        </button>
      </div>

      {/* Control Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Col: Target Node Selector */}
        <div className="lg:col-span-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            1. Select Target Sensor Node:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }, (_, i) => `Node ${i + 1}`).map((nodeId) => (
              <button
                key={nodeId}
                onClick={() => onSelectNode(nodeId)}
                className={`py-2 px-1 text-xs font-bold rounded-md border transition-all ${
                  selectedNodeId === nodeId
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {nodeId}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              id="btn-trigger-fault-injection"
              onClick={handleInject}
              className="w-full py-2 px-3 rounded-md font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow flex items-center justify-center gap-1.5 transition-all"
            >
              <Flame className="h-4 w-4 text-white" />
              Inject Fault into {selectedNodeId}
            </button>

            <button
              onClick={handleRecover}
              className="w-full py-1.5 px-3 rounded-md font-semibold text-xs bg-emerald-800 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Recover {selectedNodeId}
            </button>
          </div>
        </div>

        {/* Right Col: Fault Type Matrix */}
        <div className="lg:col-span-8 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <label className="block text-xs font-bold text-slate-300 mb-2">
            2. Select Fault Signature:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {faultOptions.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = selectedType === opt.type;

              return (
                <div
                  key={opt.type}
                  onClick={() => setSelectedType(opt.type)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <IconComp className={`h-4 w-4 shrink-0 ${opt.color}`} />
                    <span className={`text-xs font-bold ${isSelected ? 'text-rose-200' : 'text-slate-200'}`}>
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {opt.description}
                  </p>
                </div>
              );
            })}
          </div>

          {lastInjectedInfo && (
            <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 font-mono flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
              {lastInjectedInfo}
            </div>
          )}
        </div>
      </div>

      {/* Closed-Loop Cascade Architecture Diagram */}
      <div className="mt-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Closed-Loop Autonomous Reaction Pipeline:
        </span>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold text-slate-300">
          <span className="px-2 py-1 rounded bg-slate-800 text-cyan-300">1. SENSING / INA219</span>
          <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
          <span className="px-2 py-1 rounded bg-slate-800 text-indigo-300">2. LIGHTGBM DETECT</span>
          <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
          <span className="px-2 py-1 rounded bg-slate-800 text-rose-300">3. DYNA-Q PENALTY</span>
          <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
          <span className="px-2 py-1 rounded bg-slate-800 text-amber-300">4. AODV RREQ DISCOVERY</span>
          <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
          <span className="px-2 py-1 rounded bg-slate-800 text-emerald-300">5. SHA-256 BLOCKCHAIN</span>
          <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
          <span className="px-2 py-1 rounded bg-slate-800 text-white">6. BASE STATION MONITOR</span>
        </div>
      </div>
    </div>
  );
};
