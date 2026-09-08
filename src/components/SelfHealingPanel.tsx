import React from 'react';
import { AODVEvent } from '../types';
import { HeartPulse, ShieldAlert, Radio, CheckCircle, Clock } from 'lucide-react';

interface SelfHealingPanelProps {
  events: AODVEvent[];
}

export const SelfHealingPanel: React.FC<SelfHealingPanelProps> = ({ events }) => {
  const getEventIcon = (type: AODVEvent['type']) => {
    switch (type) {
      case 'ROUTE_FAIL':
        return <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />;
      case 'RREQ_BROADCAST':
        return <Radio className="h-3.5 w-3.5 text-amber-400" />;
      case 'RREP_REPLY':
        return <Radio className="h-3.5 w-3.5 text-cyan-400" />;
      case 'ROUTE_RESTORED':
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getEventBadge = (type: AODVEvent['type']) => {
    switch (type) {
      case 'ROUTE_FAIL':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">ROUTE FAIL</span>;
      case 'RREQ_BROADCAST':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">AODV RREQ</span>;
      case 'RREP_REPLY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">AODV RREP</span>;
      case 'ROUTE_RESTORED':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">RESTORED</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">INFO</span>;
    }
  };

  return (
    <div id="panel-self-healing" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-emerald-400" />
            AODV Autonomous Self-Healing & Route Recovery Timeline
          </h2>
          <p className="text-xs text-slate-400">
            Ad hoc On-Demand Distance Vector reactive route discovery triggered immediately upon link disruption
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          {events.length} Recovery Events Logged
        </span>
      </div>

      {/* Events Timeline Container */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800/60">
            <HeartPulse className="h-8 w-8 text-slate-600 mx-auto mb-2 animate-pulse" />
            <p>All active routes operational. Self-healing engine is standing by.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Inject a fault or node failure to observe the automatic AODV RREQ/RREP discovery and restoration sequence.
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-start justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 p-1 rounded bg-slate-900 border border-slate-800">
                  {getEventIcon(event.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {getEventBadge(event.type)}
                    <span className="font-mono text-[11px] text-slate-400 font-semibold">
                      {event.timestamp}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      (Node: {event.affectedNode})
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium leading-relaxed">
                    {event.details}
                  </p>
                  {event.discoveredPath && (
                    <div className="mt-1 text-[11px] font-mono text-emerald-400 bg-slate-900/90 px-2 py-0.5 rounded inline-block border border-slate-800">
                      Bypass Path: {event.discoveredPath.join(' → ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 shrink-0 mt-1">
                Δt = {event.latencyMs}ms
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
