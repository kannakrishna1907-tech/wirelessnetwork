import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Cpu, 
  Radio, 
  ShieldCheck, 
  Flame, 
  CodeXml,
  Presentation
} from 'lucide-react';
import { NetworkStateSnapshot } from '../network/networkManager';

interface HeaderProps {
  snapshot: NetworkStateSnapshot;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onSetSpeed: (speed: number) => void;
  onOpenDemo: () => void;
  onOpenEsp32Modal: () => void;
  onOpenFaultInjector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  snapshot,
  onToggleSimulation,
  onResetSimulation,
  onSetSpeed,
  onOpenDemo,
  onOpenEsp32Modal,
  onOpenFaultInjector,
}) => {
  const getStatusColor = () => {
    switch (snapshot.systemStatus) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-600 border-rose-500/30';
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
    }
  };

  const getStatusDot = () => {
    switch (snapshot.systemStatus) {
      case 'CRITICAL':
        return 'bg-rose-500 animate-ping';
      case 'WARNING':
        return 'bg-amber-500 animate-pulse';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md">
      {/* Top Academic & Project Identification Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-inner border border-cyan-400/30">
            <Radio className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                Enhanced Cognitive Wireless Sensor Network
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                WSN Digital Twin
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <span>Closed-Loop Intelligent WSN Monitoring System</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400">Energy Efficiency & Self-Healing Routing</span>
            </p>
          </div>
        </div>

        {/* System Status and Academic Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wide uppercase ${getStatusColor()}`}>
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusDot()}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${snapshot.systemStatus === 'CRITICAL' ? 'bg-rose-600' : snapshot.systemStatus === 'WARNING' ? 'bg-amber-600' : 'bg-emerald-600'}`}></span>
            </span>
            <span>SYSTEM STATUS: {snapshot.systemStatus}</span>
          </div>

          {/* Academic Transparency Badges */}
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            SIMULATED SENSOR DATA
          </span>

          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            LightGBM-compatible simulation
          </span>
        </div>
      </div>

      {/* Control Navigation Strip */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Simulation Controls */}
          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-simulation"
              onClick={onToggleSimulation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                snapshot.simulationRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {snapshot.simulationRunning ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Start Simulation
                </>
              )}
            </button>

            <button
              id="btn-reset-simulation"
              onClick={onResetSimulation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Reset all node parameters, Q-tables, and routing metrics"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" /> Reset
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5 ml-1">
              <span className="px-2 text-slate-400 text-[11px] font-medium flex items-center gap-1">
                <FastForward className="h-3 w-3" /> Speed:
              </span>
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onSetSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    snapshot.simulationSpeed === spd
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Action Modals / Demo Triggers */}
          <div className="flex items-center gap-2">
            <button
              id="btn-run-demo"
              onClick={onOpenDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm"
            >
              <Presentation className="h-3.5 w-3.5" />
              <span>Run 14-Stage Demo</span>
            </button>

            <button
              id="btn-fault-inject"
              onClick={onOpenFaultInjector}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80"
            >
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              <span>Inject Fault</span>
            </button>

            <button
              id="btn-esp32-api"
              onClick={onOpenEsp32Modal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
            >
              <CodeXml className="h-3.5 w-3.5 text-cyan-400" />
              <span>ESP32 API</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
