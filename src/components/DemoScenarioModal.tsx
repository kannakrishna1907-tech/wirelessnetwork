import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  CheckCircle2, 
  Presentation,
  Flame,
  Radio,
  BrainCircuit,
  Lock,
  HeartPulse
} from 'lucide-react';
import { DemoScenarioRunner, DEMO_STAGES, DemoStepInfo } from '../network/demoScenarioRunner';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  runner: DemoScenarioRunner;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({
  isOpen,
  onClose,
  runner,
}) => {
  const [currentStage, setCurrentStage] = useState<DemoStepInfo>(runner.getCurrentStage());
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  useEffect(() => {
    runner.setCallback((stage, isComplete) => {
      setCurrentStage(stage);
      if (isComplete) {
        setIsAutoRunning(false);
      }
    });
  }, [runner]);

  if (!isOpen) return null;

  const handleToggleAuto = () => {
    if (isAutoRunning) {
      runner.stopAutoDemo();
      setIsAutoRunning(false);
    } else {
      runner.startAutoDemo(4000);
      setIsAutoRunning(true);
    }
  };

  const handleNext = () => {
    runner.nextStage();
    setCurrentStage(runner.getCurrentStage());
  };

  const handlePrev = () => {
    runner.prevStage();
    setCurrentStage(runner.getCurrentStage());
  };

  const handleReset = () => {
    runner.resetDemo();
    setCurrentStage(runner.getCurrentStage());
    setIsAutoRunning(false);
  };

  const handleJump = (idx: number) => {
    runner.jumpToStage(idx);
    setCurrentStage(runner.getCurrentStage());
  };

  const getCategoryIcon = (cat: DemoStepInfo['category']) => {
    switch (cat) {
      case 'FAULT_INJECTION':
        return <Flame className="h-4 w-4 text-rose-400" />;
      case 'LIGHTGBM':
        return <CheckCircle2 className="h-4 w-4 text-indigo-400" />;
      case 'DYNA_Q':
        return <BrainCircuit className="h-4 w-4 text-cyan-400" />;
      case 'AODV_HEALING':
        return <HeartPulse className="h-4 w-4 text-amber-400" />;
      case 'BLOCKCHAIN':
        return <Lock className="h-4 w-4 text-emerald-400" />;
      default:
        return <Radio className="h-4 w-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow">
              <Presentation className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                14-Stage Demonstration Walkthrough
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Academic Evaluator Mode
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated step-by-step proof of sensing, LightGBM detection, Dyna-Q adaptation, AODV healing & blockchain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stages Stepper Progress Bar */}
        <div className="py-4 border-b border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-[620px]">
            {DEMO_STAGES.map((s, idx) => {
              const isPast = s.stage < currentStage.stage;
              const isCurrent = s.stage === currentStage.stage;

              return (
                <button
                  key={s.stage}
                  onClick={() => handleJump(idx)}
                  className={`flex-1 py-1.5 px-1 rounded text-center transition-all ${
                    isCurrent
                      ? 'bg-cyan-600 text-white font-bold shadow-md'
                      : isPast
                      ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 font-semibold'
                      : 'bg-slate-950 text-slate-500 hover:bg-slate-800'
                  }`}
                  title={s.title}
                >
                  <div className="text-[10px] uppercase font-mono">S{s.stage}</div>
                  <div className="text-[9px] truncate">{s.category.slice(0, 5)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Content Card */}
        <div className="my-4 p-5 bg-slate-950 rounded-xl border border-slate-800/80 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              {getCategoryIcon(currentStage.category)}
              Stage {currentStage.stage} of 14 • {currentStage.category}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Auto-Play Duration: ~4s/stage
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            {currentStage.title}
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {currentStage.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="font-bold text-cyan-300 block mb-1">
                System Autonomous Action:
              </span>
              <p className="text-slate-300 font-mono text-[11px]">
                {currentStage.systemAction}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="font-bold text-emerald-300 block mb-1">
                Evaluator Observation:
              </span>
              <p className="text-slate-300 text-[11px]">
                {currentStage.expectedObservation}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Controls Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAuto}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
                isAutoRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white'
              }`}
            >
              {isAutoRunning ? (
                <>
                  <Pause className="h-4 w-4" /> Pause Auto Demo
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Auto-Play 14 Stages
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" /> Reset to Stage 1
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStage.stage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <button
              onClick={handleNext}
              disabled={currentStage.stage === 14}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
            >
              Next Stage <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
