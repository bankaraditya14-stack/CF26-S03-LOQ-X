import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Calendar,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { SavedSimulationRun } from '../../services/storageService';
import { SimulationRunRepository } from '../../services/simulationRunRepository';
import { useAuth } from '../../hooks/useAuth';
import { formatSimTime } from '../../utils/formatters';

interface SimulationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationHistoryModal: React.FC<SimulationHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, isGuest, openAuthModal } = useAuth();
  const [runs, setRuns] = useState<SavedSimulationRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<SavedSimulationRun | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsLoading(true);

    async function loadRuns() {
      try {
        const data = await SimulationRunRepository.listUserRuns(user?.id);
        if (mounted) {
          setRuns(data);
          if (data.length > 0) {
            setSelectedRun(data[0]);
          } else {
            setSelectedRun(null);
          }
        }
      } catch (err) {
        console.warn('Failed to load runs history:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadRuns();

    return () => {
      mounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent Run';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in select-none font-mono">
      <div className="bg-white w-full max-w-4xl rounded-3xl p-6 sm:p-7 border border-charcoal-900/15 shadow-command-lg relative max-h-[90vh] overflow-hidden flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-charcoal-900/10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-mutedpurple-100 text-mutedpurple-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-charcoal-900 font-heading">
                  SIMULATION AUDIT TRAIL
                </h2>
                {user ? (
                  <span className="px-2 py-0.5 rounded bg-softblue-100 text-softblue-700 text-[9px] font-bold border border-softblue-300 flex items-center space-x-1">
                    <Cloud className="w-3 h-3 text-softblue-700" />
                    <span>CLOUD SYNCED</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-cream-200 text-charcoal-600 text-[9px] font-bold border border-charcoal-900/10 flex items-center space-x-1">
                    <HardDrive className="w-3 h-3 text-charcoal-500" />
                    <span>LOCAL STORAGE</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-charcoal-500">
                Historical Run Records, Deterministic Logs & Impact Metrics
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

        {/* Guest Banner */}
        {isGuest && (
          <div className="p-3.5 rounded-2xl bg-cream-50 border border-charcoal-900/10 flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center space-x-2 text-charcoal-700">
              <Cloud className="w-4 h-4 text-softblue-700 shrink-0" />
              <span>
                Sign in to save runs permanently to Supabase and access them across devices.
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                openAuthModal();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs shrink-0 cursor-pointer shadow-command"
            >
              SIGN IN
            </button>
          </div>
        )}

        {/* Main Content Area: 2 Columns (List & Details) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
          {/* Left Column: Runs List */}
          <div className="md:col-span-5 flex flex-col min-h-0 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {isLoading ? (
              <div className="p-8 text-center text-charcoal-500 text-xs font-mono">
                Loading simulation records...
              </div>
            ) : runs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-cream-50 border border-charcoal-900/10 space-y-2">
                <History className="w-6 h-6 text-charcoal-400 mx-auto" />
                <div className="text-xs font-bold text-charcoal-900">NO PREVIOUS RUNS RECORDED</div>
                <p className="text-[11px] text-charcoal-500 font-sans">
                  Completed simulations in Mission Control will be automatically recorded here.
                </p>
              </div>
            ) : (
              runs.map((run, idx) => {
                const isSelected = selectedRun === run;
                return (
                  <div
                    key={`${run.scenarioId}-${run.timestamp}-${idx}`}
                    onClick={() => setSelectedRun(run)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-mutedpurple-50 border-mutedpurple-400 shadow-command ring-1 ring-mutedpurple-400'
                        : 'bg-cream-50 border-charcoal-900/10 hover:border-charcoal-900/30 hover:bg-cream-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-charcoal-900 truncate max-w-[180px]">
                        {run.scenarioName || 'Custom Simulation'}
                      </span>
                      <span className="text-[10px] text-charcoal-500 flex items-center space-x-1 font-bold">
                        <Calendar className="w-3 h-3 text-charcoal-400" />
                        <span>{formatDate(run.timestamp)}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] pt-1.5 border-t border-charcoal-900/10">
                      <div>
                        <span className="text-charcoal-500 block">Affected:</span>
                        <span className="font-bold text-dustybrown-400">
                          {run.metrics.affectedServices} Services
                        </span>
                      </div>
                      <div>
                        <span className="text-charcoal-500 block">Depth:</span>
                        <span className="font-bold text-charcoal-900">
                          Lvl {run.metrics.cascadeDepth}
                        </span>
                      </div>
                      <div>
                        <span className="text-charcoal-500 block">Events:</span>
                        <span className="font-bold text-charcoal-700">
                          {run.events.length}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Run Details Inspection */}
          <div className="md:col-span-7 flex flex-col min-h-0 bg-cream-50 rounded-2xl border border-charcoal-900/10 p-4 overflow-y-auto space-y-4">
            {selectedRun ? (
              <>
                <div className="flex items-start justify-between border-b border-charcoal-900/10 pb-3">
                  <div>
                    <span className="text-[10px] uppercase text-mutedpurple-600 font-bold tracking-wider">
                      HISTORICAL RUN SNAPSHOT
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-charcoal-900 font-heading">
                      {selectedRun.scenarioName}
                    </h3>
                    <span className="text-[10px] text-charcoal-500 font-bold">
                      Executed: {new Date(selectedRun.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-softblue-100 text-softblue-700 text-[10px] font-bold border border-softblue-300">
                    COMPLETED
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white border border-charcoal-900/10 shadow-sm">
                    <span className="text-[10px] text-charcoal-500 block font-bold">Cascade Depth</span>
                    <span className="text-sm font-bold text-charcoal-900 font-mono">
                      Level {selectedRun.metrics.cascadeDepth}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-charcoal-900/10 shadow-sm">
                    <span className="text-[10px] text-charcoal-500 block font-bold">Downstream</span>
                    <span className="text-sm font-bold text-dustybrown-400 font-mono">
                      {selectedRun.metrics.affectedServices} Services
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-charcoal-900/10 shadow-sm">
                    <span className="text-[10px] text-charcoal-500 block font-bold">Peak Impact</span>
                    <span className="text-sm font-bold text-dustybrown-400 font-mono">
                      {selectedRun.metrics.peakImpact} Nodes
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-charcoal-900/10 shadow-sm">
                    <span className="text-[10px] text-charcoal-500 block font-bold">Critical</span>
                    <span className="text-sm font-bold text-charcoal-900 font-mono">
                      {selectedRun.metrics.criticalServicesAffected} High-Tier
                    </span>
                  </div>
                </div>

                {/* Event Log Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-charcoal-600 font-bold">
                    <span>RECORDED EVENT LOG ({selectedRun.events.length} Events)</span>
                    <span className="text-[10px] font-normal text-charcoal-400">
                      Deterministic Sequence
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin border border-charcoal-900/10 rounded-xl p-2.5 bg-white font-mono text-[11px]">
                    {selectedRun.events.length === 0 ? (
                      <div className="text-charcoal-400 text-center py-4 text-xs">
                        No events logged for this run.
                      </div>
                    ) : (
                      selectedRun.events.map((evt, idx) => (
                        <div
                          key={evt.id || idx}
                          className="flex items-center justify-between p-1.5 rounded bg-cream-50 border border-charcoal-900/5"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-mutedpurple-700 font-bold text-[10px]">
                              T+{formatSimTime(evt.timestamp)}
                            </span>
                            <span className="text-charcoal-800 font-bold truncate">
                              {evt.targetNode}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                              evt.newState === 'FAILED'
                                ? 'bg-dustybrown-100 text-dustybrown-400 border-dustybrown-300'
                                : evt.newState === 'DEGRADED'
                                ? 'bg-cream-200 text-charcoal-800 border-cream-400'
                                : 'bg-softblue-100 text-softblue-700 border-softblue-300'
                            }`}
                          >
                            {evt.newState}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-charcoal-400 text-xs font-mono">
                Select a run from the audit list to inspect metrics and telemetry.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-charcoal-900/10 text-xs shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 font-bold transition-all cursor-pointer shadow-sm"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
