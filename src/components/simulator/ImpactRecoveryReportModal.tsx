import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Printer,
  RotateCcw,
  ArrowRight,
  Download,
  Info,
} from 'lucide-react';
import { TelemetryState, InterventionRecommendation } from './types';

interface ImpactRecoveryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplay: () => void;
  telemetry: TelemetryState;
  intervention: string | null;
  interventionRecommendation?: InterventionRecommendation | null;
  failureNodeName: string;
  scenarioName?: string;
}

export const ImpactRecoveryReportModal: React.FC<ImpactRecoveryReportModalProps> = ({
  isOpen,
  onClose,
  onReplay,
  telemetry,
  intervention,
  interventionRecommendation,
  failureNodeName,
  scenarioName = 'Dynamic Failure Propagation Scenario',
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const interventionTitle =
    interventionRecommendation?.title ||
    (intervention === 'generator'
      ? 'Auxiliary Generator Fleet'
      : intervention === 'reroute'
      ? 'Reroute Power'
      : intervention === 'hospital'
      ? 'Prioritize Hospital'
      : intervention || 'No Intervention');

  const stats = interventionRecommendation?.projectedStats || {
    populationAffected: {
      before: '42,500',
      after: `${telemetry.populationAtRisk}`,
      deltaStr: '-63%',
      deltaNum: 26700,
    },
    servicesAffected: {
      before: '68%',
      after: `${Math.round(100 - telemetry.servicesProtectedPct)}%`,
      deltaStr: '-44%',
      deltaPct: 44,
    },
    recoveryTime: {
      before: '37 min',
      after: `${telemetry.estRecoveryMin || 18} min`,
      deltaStr: '-51%',
      deltaMin: 19,
    },
    cascadeDepth: {
      before: '5 hops',
      after: `${telemetry.cascadeDepth} hops`,
      deltaStr: '-60%',
      deltaHops: 3,
    },
    improvementPct: 64,
  };

  const handleExport = () => {
    const reportData = {
      project: 'CASCADE CITY — Problem Statement S-03',
      scenario: scenarioName,
      incidentSummary: {
        rootNode: failureNodeName,
        intervention: interventionTitle,
        strategyCategory: interventionRecommendation?.strategyCategory || 'CUSTOM',
        addressedPath: interventionRecommendation?.addressedCausalPath || failureNodeName,
        rationale: interventionRecommendation?.rationale || 'Mitigation deployed by operator.',
        initialRisk: 'CRITICAL',
        finalRisk: telemetry.cascadeRisk,
        finalSystemHealth: `${telemetry.systemHealth}%`,
        recoveryDurationMin: telemetry.estRecoveryMin || 18,
      },
      metricsComparison: {
        populationAtRisk: {
          before: stats.populationAffected.before,
          after: stats.populationAffected.after,
          delta: stats.populationAffected.deltaStr,
        },
        servicesAffectedPct: {
          before: stats.servicesAffected.before,
          after: stats.servicesAffected.after,
          delta: stats.servicesAffected.deltaStr,
        },
        recoveryTimeMin: {
          before: stats.recoveryTime.before,
          after: stats.recoveryTime.after,
          delta: stats.recoveryTime.deltaStr,
        },
        cascadeDepthHops: {
          before: stats.cascadeDepth.before,
          after: stats.cascadeDepth.after,
          delta: stats.cascadeDepth.deltaStr,
        },
        overallImprovement: `${stats.improvementPct}%`,
      },
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cascade_City_Incident_Report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in select-none font-sans">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 border border-charcoal-900/15 shadow-command-lg relative max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-900/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-softblue-100 text-softblue-700 border border-softblue-300 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-heading">
                  Impact & Recovery Report
                </h2>
                <span className="px-2 py-0.5 rounded bg-softblue-100 text-softblue-700 font-mono text-[10px] font-bold border border-softblue-300">
                  {telemetry.cascadeRisk === 'CONTAINED' ? 'CASCADE CONTAINED' : 'EVALUATION COMPLETE'}
                </span>
              </div>
              <p className="text-xs text-charcoal-500 font-mono">
                Context-Aware Incident Assessment • Cascade City Digital-Twin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-charcoal-500 hover:text-charcoal-900 hover:bg-cream-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Summary Section */}
        <div className="space-y-3 font-mono text-xs">
          <div className="text-charcoal-900 font-bold uppercase tracking-wider text-[11px]">
            INCIDENT AUDIT SUMMARY
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-1">
              <span className="text-[10px] text-charcoal-500 block font-bold">Scenario / Root</span>
              <span className="font-bold text-charcoal-900 block truncate" title={failureNodeName}>
                {failureNodeName}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-1">
              <span className="text-[10px] text-charcoal-500 block font-bold">Initial → Final Risk</span>
              <span className="font-bold text-charcoal-900 block">
                <span className="text-dustybrown-400">CRITICAL</span> →{' '}
                <span className="text-softblue-700">{telemetry.cascadeRisk}</span>
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-1">
              <span className="text-[10px] text-charcoal-500 block font-bold">Strategy Deployed</span>
              <span className="font-bold text-charcoal-900 block uppercase truncate" title={interventionTitle}>
                {interventionTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Rationale & Addressed Path */}
        {interventionRecommendation && (
          <div className="p-4 rounded-2xl bg-cream-50 border border-charcoal-900/10 space-y-2 text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-[10px] text-mutedpurple-700 font-bold uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-mutedpurple-600" />
              <span>CAUSAL MITIGATION RATIONALE</span>
            </div>
            <p className="text-charcoal-800 text-[11px] font-sans leading-relaxed">
              "{interventionRecommendation.rationale}"
            </p>
            <div className="text-[10px] text-charcoal-500 pt-1 border-t border-charcoal-900/10">
              <strong className="text-charcoal-700">Addressed Path:</strong> {interventionRecommendation.addressedCausalPath}
            </div>
          </div>
        )}

        {/* Before vs After Benchmark Comparison Table */}
        <div className="p-5 rounded-2xl bg-cream-50 border border-charcoal-900/10 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-charcoal-700 font-bold uppercase pb-2 border-b border-charcoal-900/10">
            <span>BEFORE VS AFTER MITIGATION</span>
            <span className="text-softblue-700 font-bold">
              PROJECTED SHIELDING: +{stats.improvementPct}%
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-1.5 border-b border-charcoal-900/10">
              <span className="text-charcoal-500">Population at Risk</span>
              <div className="flex items-center space-x-2 font-bold">
                <span className="text-dustybrown-400">{stats.populationAffected.before}</span>
                <ArrowRight className="w-3 h-3 text-charcoal-400" />
                <span className="text-softblue-700">
                  {stats.populationAffected.after} ({stats.populationAffected.deltaStr})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-charcoal-900/10">
              <span className="text-charcoal-500">Services Affected</span>
              <div className="flex items-center space-x-2 font-bold">
                <span className="text-dustybrown-400">{stats.servicesAffected.before}</span>
                <ArrowRight className="w-3 h-3 text-charcoal-400" />
                <span className="text-softblue-700">
                  {stats.servicesAffected.after} ({stats.servicesAffected.deltaStr})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-charcoal-900/10">
              <span className="text-charcoal-500">Recovery Time</span>
              <div className="flex items-center space-x-2 font-bold">
                <span className="text-dustybrown-400">{stats.recoveryTime.before}</span>
                <ArrowRight className="w-3 h-3 text-charcoal-400" />
                <span className="text-softblue-700">
                  {stats.recoveryTime.after} ({stats.recoveryTime.deltaStr})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-charcoal-500">Cascade Depth</span>
              <div className="flex items-center space-x-2 font-bold">
                <span className="text-dustybrown-400">{stats.cascadeDepth.before}</span>
                <ArrowRight className="w-3 h-3 text-charcoal-400" />
                <span className="text-softblue-700">
                  {stats.cascadeDepth.after} ({stats.cascadeDepth.deltaStr})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Infrastructure Counts Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-1">
            <span className="text-[10px] text-charcoal-500 uppercase font-bold">Affected Nodes</span>
            <div className="text-xl font-bold text-dustybrown-400">{telemetry.affectedNodes} services</div>
            <span className="text-[10px] text-charcoal-400">Total city sectors evaluated</span>
          </div>

          <div className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-1">
            <span className="text-[10px] text-charcoal-500 uppercase font-bold">Services Protected</span>
            <div className="text-xl font-bold text-softblue-700">{telemetry.servicesProtectedPct}%</div>
            <span className="text-[10px] text-charcoal-400">Maintained operational status</span>
          </div>

          <div className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-1">
            <span className="text-[10px] text-charcoal-500 uppercase font-bold">Final System Health</span>
            <div className="text-xl font-bold text-charcoal-900">{telemetry.systemHealth}%</div>
            <span className="text-[10px] text-charcoal-400">Nominal baseline: 100%</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-charcoal-900/10 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-900 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-charcoal-700" />
              <span>{downloadSuccess ? '✓ EXPORTED JSON' : 'EXPORT REPORT'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-700 flex items-center space-x-1.5 transition-all cursor-pointer hidden sm:flex shadow-sm"
            >
              <Printer className="w-4 h-4 text-charcoal-500" />
              <span>PRINT</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onClose();
                onReplay();
              }}
              className="px-4 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-charcoal-500" />
              <span>REPLAY</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold transition-all cursor-pointer shadow-command"
            >
              CLOSE REPORT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
