import React from 'react';
import { 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  BatteryCharging, 
  Send, 
  FileWarning, 
  GitFork, 
  Activity 
} from 'lucide-react';
import { BaseStationStats } from '../types';

interface NetworkOverviewProps {
  stats: BaseStationStats;
}

export const NetworkOverview: React.FC<NetworkOverviewProps> = ({ stats }) => {
  const cards = [
    {
      id: 'card-total-nodes',
      label: 'Total Nodes',
      value: `${stats.connectedNodes} / 8`,
      subtext: '8 Cognitive ESP32 nodes',
      icon: Radio,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/30 border-cyan-800/40',
    },
    {
      id: 'card-active-nodes',
      label: 'Active Nodes',
      value: stats.activeNodes,
      subtext: `${((stats.activeNodes / 8) * 100).toFixed(0)}% Operational`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/30 border-emerald-800/40',
    },
    {
      id: 'card-faulty-nodes',
      label: 'Faulty Nodes',
      value: stats.faultyNodes,
      subtext: stats.faultyNodes === 0 ? 'All nodes nominal' : `${stats.faultyNodes} anomaly detected`,
      icon: AlertTriangle,
      color: stats.faultyNodes > 0 ? 'text-rose-400' : 'text-slate-400',
      bgColor: stats.faultyNodes > 0 ? 'bg-rose-950/40 border-rose-800/60' : 'bg-slate-900/60 border-slate-800',
    },
    {
      id: 'card-avg-energy',
      label: 'Average Energy',
      value: `${stats.averageEnergy}%`,
      subtext: stats.averageEnergy > 60 ? 'Healthy Reserve' : 'Depletion Warning',
      icon: BatteryCharging,
      color: stats.averageEnergy > 60 ? 'text-emerald-400' : stats.averageEnergy > 30 ? 'text-amber-400' : 'text-rose-400',
      bgColor: 'bg-slate-900/60 border-slate-800',
    },
    {
      id: 'card-packets-received',
      label: 'Packets Received',
      value: stats.receivedPackets.toLocaleString(),
      subtext: 'At Base Station',
      icon: Send,
      color: 'text-indigo-400',
      bgColor: 'bg-slate-900/60 border-slate-800',
    },
    {
      id: 'card-packets-lost',
      label: 'Packets Lost',
      value: stats.lostPackets,
      subtext: stats.totalPackets > 0 
        ? `${((stats.lostPackets / Math.max(1, stats.totalPackets)) * 100).toFixed(1)}% drop rate`
        : '0.0% drop rate',
      icon: FileWarning,
      color: stats.lostPackets > 0 ? 'text-amber-400' : 'text-slate-400',
      bgColor: 'bg-slate-900/60 border-slate-800',
    },
    {
      id: 'card-active-routes',
      label: 'Active Routes',
      value: stats.activeRoutesCount,
      subtext: 'Dyna-Q & AODV paths',
      icon: GitFork,
      color: 'text-violet-400',
      bgColor: 'bg-slate-900/60 border-slate-800',
    },
    {
      id: 'card-network-health',
      label: 'Network Health',
      value: `${stats.networkHealth}%`,
      subtext: stats.networkHealth > 80 ? 'Optimal Status' : stats.networkHealth > 50 ? 'Suboptimal' : 'Critical Alert',
      icon: Activity,
      color: stats.networkHealth > 80 ? 'text-emerald-400' : stats.networkHealth > 50 ? 'text-amber-400' : 'text-rose-400',
      bgColor: stats.networkHealth < 50 ? 'bg-rose-950/40 border-rose-800/60' : 'bg-slate-900/60 border-slate-800',
    },
  ];

  return (
    <section id="section-network-overview" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className={`p-3 rounded-xl border transition-all hover:border-slate-700 shadow-sm ${card.bgColor}`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-medium text-slate-400 truncate">
                {card.label}
              </span>
              <IconComponent className={`h-4 w-4 shrink-0 ${card.color}`} />
            </div>
            <div className="text-xl font-bold tracking-tight text-white">
              {card.value}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </section>
  );
};
