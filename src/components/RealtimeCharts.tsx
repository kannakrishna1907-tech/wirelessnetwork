import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { WSNNode, BaseStationStats } from '../types';
import { LineChart as ChartIcon, Filter, Activity } from 'lucide-react';

interface RealtimeChartsProps {
  nodes: WSNNode[];
  stats: BaseStationStats;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

interface HistoryPoint {
  time: string;
  temperature: number;
  humidity: number;
  airQuality: number;
  energy: number;
  packetLoss: number;
  faultyNodes: number;
  throughput: number;
  routingDelay: number;
}

export const RealtimeCharts: React.FC<RealtimeChartsProps> = ({
  nodes,
  stats,
  selectedNodeId,
  onSelectNode,
}) => {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [activeMetric, setActiveMetric] = useState<
    'temperature' | 'humidity' | 'airQuality' | 'energy' | 'packetLoss' | 'faultyNodes' | 'throughput' | 'routingDelay'
  >('energy');

  const activeTargetNode = nodes.find((n) => n.id === (selectedNodeId || 'Node 1')) || nodes[0];

  // Append new time series sample when props change
  useEffect(() => {
    if (!activeTargetNode) return;

    const newPoint: HistoryPoint = {
      time: new Date().toLocaleTimeString().slice(3, 8), // MM:SS
      temperature: activeTargetNode.sensors.temperature,
      humidity: activeTargetNode.sensors.humidity,
      airQuality: activeTargetNode.sensors.airQuality,
      energy: activeTargetNode.sensors.energy,
      packetLoss: activeTargetNode.sensors.packetLoss,
      faultyNodes: stats.faultyNodes,
      throughput: stats.throughputBps,
      routingDelay: stats.averageLatencyMs,
    };

    setHistory((prev) => {
      const updated = [...prev, newPoint];
      return updated.slice(-20); // Keep last 20 data points
    });
  }, [nodes, stats, activeTargetNode?.id]);

  const metricsConfig = {
    temperature: {
      name: 'Temperature vs Time',
      unit: '°C',
      color: '#f97316',
      domain: [15, 45],
    },
    humidity: {
      name: 'Humidity vs Time',
      unit: '%',
      color: '#06b6d4',
      domain: [20, 100],
    },
    airQuality: {
      name: 'Air Quality (MQ-135) vs Time',
      unit: 'PPM',
      color: '#a855f7',
      domain: [0, 500],
    },
    energy: {
      name: 'Remaining Energy vs Time',
      unit: '%',
      color: '#10b981',
      domain: [0, 100],
    },
    packetLoss: {
      name: 'Packet Loss vs Time',
      unit: '%',
      color: '#ef4444',
      domain: [0, 100],
    },
    faultyNodes: {
      name: 'Number of Faulty Nodes vs Time',
      unit: 'nodes',
      color: '#f43f5e',
      domain: [0, 8],
    },
    throughput: {
      name: 'Network Throughput vs Time',
      unit: 'bps',
      color: '#3b82f6',
      domain: [0, 3500],
    },
    routingDelay: {
      name: 'Average Routing Delay vs Time',
      unit: 'ms',
      color: '#8b5cf6',
      domain: [0, 120],
    },
  };

  const currentConfig = metricsConfig[activeMetric];

  return (
    <div id="panel-realtime-charts" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ChartIcon className="h-4 w-4 text-cyan-400" />
            Real-Time Telemetry & Performance Curves
          </h2>
          <p className="text-xs text-slate-400">
            Live time-series analysis for individual sensor nodes and network-wide performance metrics
          </p>
        </div>

        {/* Node & Metric Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Node Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <label className="text-slate-400 font-medium">Node:</label>
            <select
              value={activeTargetNode?.id || 'Node 1'}
              onChange={(e) => onSelectNode(e.target.value)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                  {n.id} ({n.sensors.energy.toFixed(0)}% • {n.faultDetection.classification})
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(
              [
                ['energy', 'Energy'],
                ['temperature', 'Temp'],
                ['humidity', 'Humidity'],
                ['airQuality', 'Air Quality'],
                ['packetLoss', 'Packet Loss'],
                ['faultyNodes', 'Faults'],
                ['throughput', 'Throughput'],
                ['routingDelay', 'Delay'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  activeMetric === key
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Display Container */}
      <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" textAnchor="end" tick={{ fontSize: 10 }} />
            <YAxis
              stroke="#64748b"
              domain={currentConfig.domain}
              unit={` ${currentConfig.unit}`}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f8fafc',
              }}
            />
            <Area
              type="monotone"
              dataKey={activeMetric}
              name={`${currentConfig.name} (${activeTargetNode?.id})`}
              stroke={currentConfig.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${activeMetric})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Live Value Subtitle */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
        <span>
          Monitoring: <strong className="text-slate-200">{activeTargetNode?.id}</strong> ({currentConfig.name})
        </span>
        <span className="font-mono text-cyan-400 font-bold">
          Current Value: {history[history.length - 1]?.[activeMetric] ?? 0} {currentConfig.unit}
        </span>
      </div>
    </div>
  );
};
