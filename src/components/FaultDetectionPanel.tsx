import React from 'react';
import { WSNNode } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, Cpu, HelpCircle } from 'lucide-react';

interface FaultDetectionPanelProps {
  nodes: WSNNode[];
  onSelectNode: (nodeId: string) => void;
}

export const FaultDetectionPanel: React.FC<FaultDetectionPanelProps> = ({
  nodes,
  onSelectNode,
}) => {
  // Filter anomalous or faulty nodes first, then normal
  const sortedNodes = [...nodes].sort((a, b) => {
    const scoreA = a.faultDetection.classification === 'FAULTY' ? 2 : a.faultDetection.classification === 'ANOMALOUS' ? 1 : 0;
    const scoreB = b.faultDetection.classification === 'FAULTY' ? 2 : b.faultDetection.classification === 'ANOMALOUS' ? 1 : 0;
    return scoreB - scoreA;
  });

  const anomalyCount = nodes.filter(n => n.faultDetection.classification !== 'NORMAL').length;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900 text-rose-100 border border-rose-600">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">NONE</span>;
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'FAULTY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
            <AlertTriangle className="h-3 w-3 text-rose-400" />
            FAULTY
          </span>
        );
      case 'ANOMALOUS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            ANOMALOUS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            NORMAL
          </span>
        );
    }
  };

  return (
    <div id="panel-fault-detection" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header with Academic Label */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            Fault Detection & Anomaly Diagnosis Panel
          </h2>
          <p className="text-xs text-slate-400">
            Multi-feature gradient boosted inference: Evaluates Temperature, Voltage, Current, Air Quality, and Energy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            LightGBM-compatible fault detection simulation
          </span>
          {anomalyCount > 0 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-900/80 text-rose-200 border border-rose-700">
              {anomalyCount} Active Anomaly
            </span>
          )}
        </div>
      </div>

      {/* Decision Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs text-slate-200 divide-y divide-slate-800">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-3 py-2.5">Node ID</th>
              <th scope="col" className="px-3 py-2.5">Detected Reason / Fault Type</th>
              <th scope="col" className="px-3 py-2.5">Detection Time</th>
              <th scope="col" className="px-3 py-2.5">Severity</th>
              <th scope="col" className="px-3 py-2.5">Confidence</th>
              <th scope="col" className="px-3 py-2.5">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
            {sortedNodes.map((node) => {
              const fault = node.faultDetection;
              const isAbnormal = fault.classification !== 'NORMAL';

              return (
                <tr
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                    isAbnormal ? 'bg-rose-950/15' : ''
                  }`}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] text-cyan-300 font-mono">
                        {node.shortId}
                      </span>
                      <span>{node.id}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-200">
                      {fault.primaryReason}
                    </div>
                    {fault.reasons.length > 1 && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Secondary: {fault.reasons[1]}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-400">
                    {fault.detectionTime}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {getSeverityBadge(fault.severity)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-300">
                    {fault.confidence}%
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {getClassificationBadge(fault.classification)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Feature Split Transparency Footnote */}
      <div className="mt-2.5 text-[11px] text-slate-400 flex items-center gap-1.5 px-2">
        <HelpCircle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span>
          Simulated decision criteria: Voltage &lt; 3.10V (Battery collapse), Current &gt; 240mA (Short surge), Air Quality &gt; 380 units (Environmental hazard), Temp &gt; 40°C, Packet Loss &gt; 50%.
        </span>
      </div>
    </div>
  );
};
