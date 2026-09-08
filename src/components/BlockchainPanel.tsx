import React, { useState } from 'react';
import { BlockchainBlock } from '../types';
import { ShieldCheck, ShieldAlert, Lock, RefreshCw, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface BlockchainPanelProps {
  blocks: BlockchainBlock[];
  onVerify: () => { isValid: boolean; corruptedIndex: number | null; reason?: string; verifiedBlocks: number };
  onTamper: () => { tamperedIndex: number; originalContent: string; falsifiedContent: string };
  onRepair: () => void;
}

export const BlockchainPanel: React.FC<BlockchainPanelProps> = ({
  blocks,
  onVerify,
  onTamper,
  onRepair,
}) => {
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    corruptedIndex: number | null;
    reason?: string;
    verifiedBlocks: number;
  } | null>(null);

  const [tamperNotice, setTamperNotice] = useState<string | null>(null);

  const handleVerify = () => {
    const res = onVerify();
    setVerificationResult(res);
  };

  const handleTamper = () => {
    const res = onTamper();
    setTamperNotice(`Simulated Tamper Attack: Block #${res.tamperedIndex} payload was falsified! Click 'Verify Blockchain' to witness SHA-256 integrity failure.`);
    setVerificationResult(null);
  };

  const handleRepair = () => {
    onRepair();
    setTamperNotice(null);
    setVerificationResult({
      isValid: true,
      corruptedIndex: null,
      reason: 'Ledger successfully re-hashed and cryptographically repaired.',
      verifiedBlocks: blocks.length,
    });
  };

  return (
    <div id="panel-blockchain-ledger" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header with Blockchain Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-400" />
            Blockchain-Based Secure Event & Telemetry Ledger (SHA-256)
          </h2>
          <p className="text-xs text-slate-400">
            Immutable, tamper-evident cryptographic chain recording all fault events, route updates, and telemetry
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-verify-blockchain"
            onClick={handleVerify}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-700 hover:bg-cyan-600 text-white font-semibold text-xs transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verify Blockchain</span>
          </button>

          <button
            id="btn-tamper-blockchain"
            onClick={handleTamper}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-medium text-xs transition-colors"
            title="Intentionally alter a block's data payload to demonstrate tamper detection"
          >
            <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
            <span>Tamper Test</span>
          </button>

          <button
            id="btn-repair-blockchain"
            onClick={handleRepair}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Repair Ledger</span>
          </button>
        </div>
      </div>

      {/* Verification Output Banners */}
      {tamperNotice && (
        <div className="mb-3 p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-lg text-xs text-amber-200 flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{tamperNotice}</span>
        </div>
      )}

      {verificationResult && (
        <div
          className={`mb-3 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
            verificationResult.isValid
              ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700 text-rose-200 animate-pulse'
          }`}
        >
          {verificationResult.isValid ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <div className="font-medium">
            <strong>{verificationResult.isValid ? 'INTEGRITY VERIFIED:' : 'SECURITY ALERT - TAMPER DETECTED:'}</strong>{' '}
            {verificationResult.reason}
          </div>
        </div>
      )}

      {/* Blocks Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs text-slate-200 divide-y divide-slate-800">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-3 py-2.5">Block #</th>
              <th scope="col" className="px-3 py-2.5">Timestamp</th>
              <th scope="col" className="px-3 py-2.5">Node</th>
              <th scope="col" className="px-3 py-2.5">Event Type</th>
              <th scope="col" className="px-3 py-2.5">Previous Hash</th>
              <th scope="col" className="px-3 py-2.5">Current Hash (SHA-256)</th>
              <th scope="col" className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-mono text-[11px]">
            {blocks.map((block) => {
              const isCorrupted = block.isTampered || block.isValid === false;

              return (
                <tr
                  key={`block-${block.index}-${block.hash}`}
                  className={`hover:bg-slate-800/60 transition-colors ${
                    isCorrupted ? 'bg-rose-950/40 text-rose-200 border-l-4 border-rose-500' : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-bold text-white">
                    #{block.index}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-400">
                    {new Date(block.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-semibold text-cyan-300">
                    {block.nodeId}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-sans font-bold">
                      {block.eventType}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-400" title={block.previousHash}>
                    {block.previousHash.slice(0, 8)}...{block.previousHash.slice(-6)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-300 font-bold" title={block.hash}>
                    <span className={isCorrupted ? 'text-rose-400 underline decoration-rose-500' : 'text-cyan-400'}>
                      {block.hash.slice(0, 10)}...{block.hash.slice(-6)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isCorrupted ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-900 text-rose-100 font-sans font-bold text-[10px]">
                        TAMPERED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-sans font-medium text-[10px]">
                        VALID
                      </span>
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
