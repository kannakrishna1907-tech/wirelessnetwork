import React from 'react';
import { WSNNode, FaultInjectionType } from '../types';
import { Activity, Battery, AlertCircle, CheckCircle, Flame, ShieldCheck } from 'lucide-react';

interface SensorTableProps {
  nodes: WSNNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onInjectFault: (nodeId: string, faultType: FaultInjectionType) => void;
  onRecoverNode: (nodeId: string) => void;
}

export const SensorTable: React.FC<SensorTableProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onInjectFault,
  onRecoverNode,
}) => {
  const getEnergyBadge = (energy: number, state: string) => {
    if (energy > 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          {energy.toFixed(1)}% (Healthy)
        </span>
      );
    }
    if (energy >= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
          {energy.toFixed(1)}% (Moderate)
        </span>
      );
    }
    if (energy >= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
          {energy.toFixed(1)}% (Low)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-900 text-white animate-pulse border border-rose-600">
        <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
        {energy.toFixed(1)}% (Critical)
      </span>
    );
  };

  const getStatusBadge = (classification: string, reason: string) => {
    if (classification === 'FAULTY') {
      return (
        <span 
          title={reason}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-900/80 text-rose-200 border border-rose-700"
        >
          <AlertCircle className="h-3 w-3 text-rose-300" />
          FAULTY
        </span>
      );
    }
    if (classification === 'ANOMALOUS') {
      return (
        <span 
          title={reason}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-900/80 text-amber-200 border border-amber-700"
        >
          <AlertCircle className="h-3 w-3 text-amber-300" />
          ANOMALOUS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
        <CheckCircle className="h-3 w-3 text-emerald-400" />
        NORMAL
      </span>
    );
  };

  return (
    <div id="panel-sensor-monitoring" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Sensor Telemetry & Energy Monitoring (BME280 • MQ-135 • INA219)
          </h2>
          <p className="text-xs text-slate-400">
            Real-time physical values updated smoothly per cycle with INA219 current sensing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
            SIMULATED SENSOR DATA
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs text-slate-200 divide-y divide-slate-800">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-3 py-2.5">Node</th>
              <th scope="col" className="px-3 py-2.5">Temperature</th>
              <th scope="col" className="px-3 py-2.5">Humidity</th>
              <th scope="col" className="px-3 py-2.5">Pressure</th>
              <th scope="col" className="px-3 py-2.5">Air Quality</th>
              <th scope="col" className="px-3 py-2.5">Voltage</th>
              <th scope="col" className="px-3 py-2.5">Current</th>
              <th scope="col" className="px-3 py-2.5">Power</th>
              <th scope="col" className="px-3 py-2.5">Energy</th>
              <th scope="col" className="px-3 py-2.5">Status</th>
              <th scope="col" className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isFaulty = node.faultDetection.classification === 'FAULTY';

              return (
                <tr
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-950/40 font-medium' : ''
                  } ${isFaulty ? 'bg-rose-950/20' : ''}`}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[11px] text-cyan-300 font-mono">
                        {node.shortId}
                      </span>
                      <span>{node.id}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-300">
                    {node.sensors.temperature.toFixed(1)} °C
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-300">
                    {node.sensors.humidity.toFixed(1)} %
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-300">
                    {node.sensors.pressure.toFixed(1)} hPa
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono">
                    <span className={node.sensors.airQuality > 300 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {node.sensors.airQuality} PPM
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono">
                    <span className={node.sensors.voltage < 3.2 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {node.sensors.voltage.toFixed(2)} V
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono">
                    <span className={node.sensors.current > 200 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {node.sensors.current.toFixed(1)} mA
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-300">
                    {node.sensors.power.toFixed(1)} mW
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {getEnergyBadge(node.sensors.energy, node.energyState)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {getStatusBadge(node.faultDetection.classification, node.faultDetection.primaryReason)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    {node.faultDetection.classification !== 'NORMAL' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecoverNode(node.id);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-[11px] font-semibold"
                      >
                        <ShieldCheck className="h-3 w-3" /> Recover
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInjectFault(node.id, 'SENSOR_ANOMALY');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-medium border border-rose-800"
                      >
                        <Flame className="h-3 w-3 text-rose-400" /> Fault
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
