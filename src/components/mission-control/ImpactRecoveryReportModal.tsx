import React from 'react';
import {
  X,
  ShieldCheck,
  Users,
  Timer,
  Printer,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { TelemetryState, InterventionType } from './types';

interface ImpactRecoveryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplay: () => void;
  telemetry: TelemetryState;
  intervention: InterventionType | null;
  failureNodeName: string;
}

export const ImpactRecoveryReportModal: React.FC<ImpactRecoveryReportModalProps> = ({
  isOpen,
  onClose,
  onReplay,
  telemetry,
  intervention,
  failureNodeName,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="glass-panel-glow w-full max-w-3xl rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-heading">
                  Impact & Recovery Report
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                  CASCADE CONTAINED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Simulation Run Assessment • Problem S-03 Digital-Twin Grid
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Recovery Time */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>RECOVERY TIME</span>
              <Timer className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-300">
              {telemetry.estRecoveryMin || 18} min
            </div>
            <div className="text-[10px] text-emerald-400">↳ 19 min faster than baseline</div>
          </div>

          {/* Services Protected */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>SERVICES PROTECTED</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {telemetry.servicesProtectedPct}%
            </div>
            <div className="text-[10px] text-slate-400">6 of 8 assets preserved</div>
          </div>

          {/* Population Protected */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>POPULATION PROTECTED</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-300">26,700</div>
            <div className="text-[10px] text-emerald-400">↳ 63% reduction in blast radius</div>
          </div>
        </div>

        {/* Before vs After Benchmark Comparison Table */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 font-bold uppercase pb-2 border-b border-slate-800">
            <span>RESILIENCE IMPACT BENCHMARK</span>
            <span className="text-cyan-400">JANAGAR RESILIENCE GRID</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
              <span className="text-slate-400">Root Failure Node</span>
              <span className="text-slate-100 font-bold">{failureNodeName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
              <span className="text-slate-400">Deployed Operational Intervention</span>
              <span className="text-cyan-300 font-bold uppercase">
                {intervention ? intervention.replace('-', ' ') : 'AUXILIARY BACKUP GENERATOR'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
              <span className="text-slate-400">Cascade Containment Depth</span>
              <div className="flex items-center space-x-2 font-bold">
                <span className="text-rose-400">5 hops (unmitigated)</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400">2 hops (contained)</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Population Affected</span>
              <div className="flex items-center space-x-2 font-bold">
                <span className="text-rose-400">42,500 citizens</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400">15,800 citizens</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Findings & Recommendations */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 leading-relaxed space-y-2">
          <strong className="text-cyan-300 font-mono block uppercase">
            ✓ Operator Takeaways
          </strong>
          <p>
            Deploying emergency auxiliary backup power within the first 10 simulated minutes prevented irreversible cascading cavitation at the Raw Water Pumping station, effectively buffering Apex Trauma Hospital and emergency sanitation systems from total power loss.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 font-mono text-xs">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>PRINT / SAVE REPORT</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onClose();
                onReplay();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>REPLAY SCENARIO</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer"
            >
              CLOSE REPORT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
