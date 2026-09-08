import React, { useState } from 'react';
import { 
  NetworkStateSnapshot 
} from '../network/networkManager';
import { WSNNode, DynaQRoute } from '../types';
import { Radio, Zap, AlertTriangle, ShieldCheck, Server } from 'lucide-react';

interface NetworkTopologyProps {
  snapshot: NetworkStateSnapshot;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onQuickFault: (nodeId: string) => void;
  onQuickRecover: (nodeId: string) => void;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  snapshot,
  selectedNodeId,
  onSelectNode,
  onQuickFault,
  onQuickRecover,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const { nodes, baseStationCoords, activeRoutes } = snapshot;

  // Build lookup map for node coordinates
  const nodeCoordsMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    nodeCoordsMap.set(n.id, { x: n.x, y: n.y });
  });
  nodeCoordsMap.set('Base Station', baseStationCoords);

  // Collect all unique neighbor edges (unidirectional for rendering)
  const edges: Array<{ from: string; to: string; key: string }> = [];
  const edgeSet = new Set<string>();

  nodes.forEach((n) => {
    n.neighbours.forEach((neighbourId) => {
      const edgeKey = [n.id, neighbourId].sort().join('---');
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({ from: n.id, to: neighbourId, key: edgeKey });
      }
    });
  });

  // Collect active route segments to highlight with glowing lines
  const activeRouteSegments: Array<{ from: string; to: string; routeSource: string }> = [];
  activeRoutes.forEach((route) => {
    for (let i = 0; i < route.path.length - 1; i++) {
      activeRouteSegments.push({
        from: route.path[i],
        to: route.path[i + 1],
        routeSource: route.source,
      });
    }
  });

  const getNodeColor = (node: WSNNode) => {
    if (node.nodeStatus === 'OFFLINE') {
      return { fill: '#334155', stroke: '#64748b', text: '#94a3b8', badge: 'OFFLINE' };
    }
    if (node.faultDetection.classification === 'FAULTY' || node.nodeStatus === 'FAULTY') {
      return { fill: '#7f1d1d', stroke: '#ef4444', text: '#fca5a5', badge: 'FAULTY' };
    }
    if (node.faultDetection.classification === 'ANOMALOUS') {
      return { fill: '#78350f', stroke: '#f59e0b', text: '#fde68a', badge: 'ANOMALOUS' };
    }
    if (node.sensors.energy < 30 || node.energyState === 'LOW_ENERGY' || node.energyState === 'CRITICAL') {
      return { fill: '#831843', stroke: '#ec4899', text: '#fbcfe8', badge: 'LOW ENERGY' };
    }
    return { fill: '#064e3b', stroke: '#10b981', text: '#a7f3d0', badge: 'HEALTHY' };
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div id="panel-network-topology" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header with Title and Mode Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400" />
            Network Topology & Active Multi-Hop Routing
          </h2>
          <p className="text-xs text-slate-400">
            Real-time graphical mesh: 8 Cognitive Nodes transmitting via LoRa to Base Station
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Healthy
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Anomalous
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Faulty
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-500"></span> Low Energy
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500"></span> Inactive/Dead
          </span>
          <span className="flex items-center gap-1 text-cyan-400 font-semibold ml-1">
            <span className="w-4 h-1 rounded bg-cyan-400 inline-block"></span> Active Route
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950 rounded-lg border border-slate-800 flex justify-center items-center">
        <svg
          viewBox="0 0 840 460"
          className="w-full h-auto max-h-[460px] select-none"
        >
          <defs>
            {/* Pulsing Gradient for active route lines */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines for Technical Look */}
          <g opacity="0.12">
            {[100, 200, 300, 400, 500, 600, 700, 800].map((x) => (
              <line key={`grid-x-${x}`} x1={x} y1={0} x2={x} y2={460} stroke="#94a3b8" strokeWidth="1" />
            ))}
            {[80, 160, 240, 320, 400].map((y) => (
              <line key={`grid-y-${y}`} x1={0} y1={y} x2={840} y2={y} stroke="#94a3b8" strokeWidth="1" />
            ))}
          </g>

          {/* 1. Wireless Neighbor Links (Dashed Gray) */}
          <g>
            {edges.map((edge) => {
              const fromCoord = nodeCoordsMap.get(edge.from);
              const toCoord = nodeCoordsMap.get(edge.to);
              if (!fromCoord || !toCoord) return null;

              return (
                <line
                  key={edge.key}
                  x1={fromCoord.x}
                  y1={fromCoord.y}
                  x2={toCoord.x}
                  y2={toCoord.y}
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  opacity="0.6"
                />
              );
            })}
          </g>

          {/* 2. Active Routing Paths (Thick Glowing Cyan/Emerald Paths) */}
          <g>
            {activeRouteSegments.map((seg, idx) => {
              const fromCoord = nodeCoordsMap.get(seg.from);
              const toCoord = nodeCoordsMap.get(seg.to);
              if (!fromCoord || !toCoord) return null;

              return (
                <g key={`active-seg-${idx}-${seg.from}-${seg.to}`}>
                  {/* Glow underlay */}
                  <line
                    x1={fromCoord.x}
                    y1={fromCoord.y}
                    x2={toCoord.x}
                    y2={toCoord.y}
                    stroke="#06b6d4"
                    strokeWidth="6"
                    opacity="0.3"
                    filter="url(#glow)"
                  />
                  {/* Main Route Line */}
                  <line
                    x1={fromCoord.x}
                    y1={fromCoord.y}
                    x2={toCoord.x}
                    y2={toCoord.y}
                    stroke="url(#routeGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Animated Directional Packet Dot */}
                  <circle r="4" fill="#38bdf8">
                    <animateMotion
                      path={`M ${fromCoord.x} ${fromCoord.y} L ${toCoord.x} ${toCoord.y}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </g>

          {/* 3. Base Station Gateway Display */}
          <g
            transform={`translate(${baseStationCoords.x}, ${baseStationCoords.y})`}
            className="cursor-pointer"
          >
            {/* Concentric radar rings */}
            <circle r="42" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.3">
              <animate attributeName="r" values="24;46;24" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle r="30" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
            <foreignObject x="-14" y="-14" width="28" height="28">
              <Server className="w-7 h-7 text-indigo-300" />
            </foreignObject>
            <text
              x="0"
              y="48"
              textAnchor="middle"
              className="fill-indigo-300 text-xs font-bold tracking-wider"
            >
              BASE STATION
            </text>
            <text
              x="0"
              y="60"
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
            >
              (Sink Gateway)
            </text>
          </g>

          {/* 4. Sensor Nodes (Node 1 through Node 8) */}
          {nodes.map((node) => {
            const colors = getNodeColor(node);
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const energyRadius = 22;
            const circumference = 2 * Math.PI * energyRadius;
            const energyOffset = circumference - (node.sensors.energy / 100) * circumference;

            return (
              <g
                key={node.id}
                id={`topology-node-${node.shortId}`}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectNode(node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer transition-transform duration-200"
              >
                {/* Selection / Hover Indicator Ring */}
                {(isSelected || isHovered) && (
                  <circle
                    r="34"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    className="animate-spin"
                    style={{ transformOrigin: '0 0', animationDuration: '8s' }}
                  />
                )}

                {/* Energy Ring Gauge around node */}
                <circle
                  r={energyRadius}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="3"
                />
                <circle
                  r={energyRadius}
                  fill="none"
                  stroke={node.sensors.energy > 50 ? '#10b981' : node.sensors.energy > 20 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={energyOffset}
                  strokeLinecap="round"
                  transform="rotate(-90)"
                />

                {/* Main Node Circle */}
                <circle
                  r="18"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  className="shadow-md"
                />

                {/* Node ID label inside */}
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  className="fill-white font-black text-[11px]"
                >
                  {node.shortId}
                </text>

                {/* Node Status Pill below */}
                <g transform="translate(0, 26)">
                  <rect
                    x="-28"
                    y="0"
                    width="56"
                    height="14"
                    rx="7"
                    fill="#0f172a"
                    stroke={colors.stroke}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="10"
                    textAnchor="middle"
                    className="text-[9px] font-bold"
                    fill={colors.text}
                  >
                    {node.sensors.energy.toFixed(0)}% • {node.faultDetection.classification[0]}
                  </text>
                </g>

                {/* Node Name Label above */}
                <text
                  x="0"
                  y="-26"
                  textAnchor="middle"
                  className="fill-slate-300 text-[11px] font-semibold"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Quick Inspector & Action Strip (when a node is selected) */}
      {selectedNode && (
        <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              <Radio className="h-4 w-4 text-cyan-400" />
              {selectedNode.id}
            </span>
            <span className="text-slate-400">
              Temp: <span className="text-white font-mono">{selectedNode.sensors.temperature}°C</span>
            </span>
            <span className="text-slate-400">
              Air Quality: <span className="text-white font-mono">{selectedNode.sensors.airQuality} PPM</span>
            </span>
            <span className="text-slate-400">
              Voltage: <span className="text-white font-mono">{selectedNode.sensors.voltage}V</span>
            </span>
            <span className="text-slate-400">
              Energy: <span className="text-emerald-400 font-mono font-bold">{selectedNode.sensors.energy}%</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              selectedNode.faultDetection.classification === 'FAULTY' 
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : selectedNode.faultDetection.classification === 'ANOMALOUS'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {selectedNode.faultDetection.classification}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedNode.faultDetection.classification === 'FAULTY' || selectedNode.faultDetection.classification === 'ANOMALOUS' ? (
              <button
                onClick={() => onQuickRecover(selectedNode.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Recover Node
              </button>
            ) : (
              <button
                onClick={() => onQuickFault(selectedNode.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white font-semibold text-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Inject Test Fault
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
