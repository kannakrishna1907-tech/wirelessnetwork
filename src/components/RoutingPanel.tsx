import React, { useState } from 'react';
import { DynaQRoute } from '../types';
import { GitFork, BrainCircuit, ChevronRight, Zap, Info } from 'lucide-react';
import { DynaQRoutingEngine } from '../routing/dynaQ';

interface RoutingPanelProps {
  routes: DynaQRoute[];
  dynaQEngine: DynaQRoutingEngine;
}

export const RoutingPanel: React.FC<RoutingPanelProps> = ({ routes, dynaQEngine }) => {
  const [showQTable, setShowQTable] = useState(false);
  const qValues = dynaQEngine.getAllQValues().slice(0, 12);

  return (
    <div id="panel-intelligent-routing" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header with Q-table Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-cyan-400" />
            Dyna-Q Intelligent Reinforcement Learning Routing
          </h2>
          <p className="text-xs text-slate-400">
            Multi-objective reward optimization balancing Remaining Energy, Link Quality, Distance, and Delay
          </p>
        </div>

        <button
          onClick={() => setShowQTable(!showQTable)}
          className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1"
        >
          <Zap className="h-3 w-3 text-cyan-400" />
          {showQTable ? 'Hide Q-Table' : 'Inspect Q-Table Matrix'}
        </button>
      </div>

      {/* Routes List */}
      <div className="space-y-3">
        {routes.map((route, idx) => (
          <div
            key={`route-${idx}-${route.source}`}
            className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg"
          >
            {/* Top metadata line */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {route.source} → {route.destination}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  route.algorithm === 'AODV-SelfHealed'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}>
                  Algorithm: {route.algorithm}
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                <span>Cost: <span className="text-white font-bold">{route.routeCost}</span></span>
                <span>Avg Energy: <span className="text-emerald-400 font-bold">{route.averageEnergy}%</span></span>
                <span>Delay: <span className="text-cyan-400 font-bold">{route.estimatedDelayMs}ms</span></span>
                <span>Loss: <span className="text-slate-300">{route.packetLossRate}%</span></span>
              </div>
            </div>

            {/* Visual Path Flow */}
            <div className="flex flex-wrap items-center gap-1.5 py-2 px-3 bg-slate-900/80 rounded border border-slate-800/80 mb-2 font-mono text-xs">
              {route.path.map((hop, hIdx) => {
                const isFirst = hIdx === 0;
                const isLast = hIdx === route.path.length - 1;

                return (
                  <React.Fragment key={`hop-${hIdx}-${hop}`}>
                    <span
                      className={`px-2 py-1 rounded font-bold ${
                        isFirst
                          ? 'bg-cyan-950 text-cyan-200 border border-cyan-700'
                          : isLast
                          ? 'bg-indigo-950 text-indigo-200 border border-indigo-700'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {hop}
                    </span>
                    {!isLast && (
                      <ChevronRight className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Algorithmic Reason Output */}
            <div className="text-xs text-slate-300 flex items-start gap-1.5 bg-slate-900/40 p-2 rounded">
              <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-cyan-300">Selection Rationale:</strong> {route.reason}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Expandable Q-Table Inspector */}
      {showQTable && (
        <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1">
              <BrainCircuit className="h-3.5 w-3.5 text-cyan-400" />
              Learned Q-Values (State s → Action a):
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Q(s, a) = Q(s, a) + α[R + γ max Q(s', a') - Q(s, a)]
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono text-[11px]">
            {qValues.length > 0 ? (
              qValues.map((q) => (
                <div key={q.key} className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{q.state} → {q.action}</span>
                  <span className={`font-bold ${q.value >= 50 ? 'text-emerald-400' : q.value >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                    {q.value}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-slate-500 col-span-4">Q-Table is converging initial experiences...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
