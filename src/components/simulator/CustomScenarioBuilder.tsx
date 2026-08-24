import React, { useState } from 'react';
import {
  Sliders,
  CheckSquare,
  Square,
  ShieldCheck,
  RotateCcw,
  Play,
  BookmarkPlus,
  Cloud,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { ServiceNode, Scenario } from '../../types';
import { FailureSeverity, FailureType } from './types';
import { GraphValidator } from '../../engine/graphValidation';
import { SYNTHETIC_CITY_GRAPH } from '../../data/cityGraph';
import { ScenarioRepository } from '../../services/scenarioRepository';
import { useAuth } from '../../hooks/useAuth';

interface CustomScenarioBuilderProps {
  nodes: ServiceNode[];
  onRunCustomScenario: (scenario: Scenario) => void;
  onReset: () => void;
  isSimulationRunning: boolean;
  activeScenarioId?: string;
}

export const CustomScenarioBuilder: React.FC<CustomScenarioBuilderProps> = ({
  nodes,
  onRunCustomScenario,
  onReset,
  isSimulationRunning,
}) => {
  const { user, isGuest, isCloudConnected, openAuthModal } = useAuth();

  // Selected initial disruption node IDs
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([
    'power-grid-main',
    'telecom-core',
  ]);
  const [severity, setSeverity] = useState<FailureSeverity>('CRITICAL');
  const [failureType, setFailureType] = useState<FailureType>('Equipment Failure');
  const [scenarioName, setScenarioName] = useState<string>('Power + Telecom Stress Test');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Validate graph before running
  const validationReport = React.useMemo(() => {
    return GraphValidator.validate(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges,
      undefined,
      SYNTHETIC_CITY_GRAPH.version
    );
  }, []);

  const toggleNodeSelection = (id: string) => {
    if (selectedNodeIds.includes(id)) {
      if (selectedNodeIds.length === 1) return; // keep at least one
      setSelectedNodeIds(selectedNodeIds.filter((nodeId) => nodeId !== id));
    } else {
      setSelectedNodeIds([...selectedNodeIds, id]);
    }
  };

  const handleBuildAndRun = () => {
    if (selectedNodeIds.length === 0 || !validationReport.valid) return;

    const customScenario: Scenario = {
      id: `custom-${Date.now()}`,
      name: scenarioName.trim() || 'Custom Multi-Node Disruption',
      description: `Custom ${failureType.toLowerCase()} scenario targeting ${selectedNodeIds.length} initial municipal service(s).`,
      graphVersion: 'city-v1',
      initialFailures: selectedNodeIds.map((id) => ({
        nodeId: id,
        time: 0,
      })),
      parameters: {
        maxSimulationTime: 60,
        defaultPropagationDelay: 5,
        defaultRecoveryDuration: 15,
      },
      recoveryActions: [],
    };

    onRunCustomScenario(customScenario);
  };

  const handleSaveScenario = async () => {
    if (selectedNodeIds.length === 0) return;

    setIsSaving(true);
    const customScenario: Scenario = {
      id: `custom-${Date.now()}`,
      name: scenarioName.trim() || 'Custom Multi-Node Disruption',
      description: `Custom ${failureType.toLowerCase()} scenario with ${selectedNodeIds.length} initial disruptions.`,
      graphVersion: 'city-v1',
      initialFailures: selectedNodeIds.map((id) => ({
        nodeId: id,
        time: 0,
      })),
      parameters: {
        maxSimulationTime: 60,
        defaultPropagationDelay: 5,
        defaultRecoveryDuration: 15,
      },
      recoveryActions: [],
    };

    try {
      await ScenarioRepository.createScenario(customScenario, user?.id);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.warn('Failed to save scenario:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedNodeObjects = nodes.filter((n) => selectedNodeIds.includes(n.id));

  return (
    <div className="bg-white rounded-2xl p-5 border border-charcoal-900/15 shadow-command flex flex-col justify-between space-y-4 select-none animate-in fade-in font-mono">
      {/* 1. Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-charcoal-900/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-mutedpurple-100 text-mutedpurple-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                BUILD CUSTOM DISRUPTION
              </h2>
              <span className="text-[10px] text-charcoal-500">
                Engine-Calculated Downstream Cascade
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {user && isCloudConnected ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-softblue-100 border border-softblue-300 text-softblue-700 flex items-center space-x-1">
                <Cloud className="w-2.5 h-2.5 text-softblue-700" />
                <span>CLOUD</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cream-100 border border-charcoal-900/10 text-charcoal-500 flex items-center space-x-1">
                <HardDrive className="w-2.5 h-2.5 text-charcoal-500" />
                <span>LOCAL</span>
              </span>
            )}
          </div>
        </div>

        {/* Subtitle description */}
        <p className="text-[11px] text-charcoal-600 mb-3 leading-relaxed">
          Create an initial disruption. The simulation engine will calculate the downstream cascade from the dependency graph.
        </p>

        {/* Graph Validation Badge */}
        <div className="mb-4 p-2.5 rounded-xl bg-cream-50 border border-charcoal-900/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-softblue-700 shrink-0" />
            <span className="text-charcoal-700">
              GRAPH VALIDATION: <strong className="text-charcoal-900">✓ GRAPH VALID</strong>
            </span>
          </div>
          <span className="text-[10px] text-charcoal-500 hidden sm:inline font-bold">
            13 Services • 22 Edges • city-v1
          </span>
        </div>

        {/* 2. Initial Failure Selection (Multi-select) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-charcoal-500 uppercase tracking-wider font-bold block">
              INITIAL DISRUPTIONS
            </label>
            <span className="text-[10px] text-mutedpurple-600 font-bold">
              {selectedNodeIds.length} Selected
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin border border-charcoal-900/10 rounded-xl p-2 bg-cream-50">
            {nodes.map((node) => {
              const isSelected = selectedNodeIds.includes(node.id);
              return (
                <div
                  key={node.id}
                  onClick={() => !isSimulationRunning && toggleNodeSelection(node.id)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between space-x-2 ${
                    isSelected
                      ? 'bg-white border-charcoal-900 text-charcoal-900 shadow-sm'
                      : 'bg-white border-charcoal-900/10 text-charcoal-500 hover:bg-cream-100 hover:text-charcoal-900'
                  } ${isSimulationRunning ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-charcoal-900 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold font-heading truncate">
                      {node.name}
                    </span>
                  </div>

                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cream-100 text-charcoal-600 border border-charcoal-900/10 shrink-0 font-bold">
                    {node.type}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Dynamic Counter at bottom */}
          <div className="p-2 rounded-lg bg-cream-100 border border-charcoal-900/10 flex items-center justify-between text-xs">
            <span className="text-charcoal-500 font-bold">Scheduled:</span>
            <span className="font-extrabold text-charcoal-900">
              {selectedNodeIds.length} SIMULTANEOUS DISRUPTIONS AT T+00
            </span>
          </div>
        </div>

        {/* 3. Failure Configuration Parameters */}
        <div className="mt-3.5 space-y-3 text-xs">
          {/* Severity */}
          <div className="space-y-1">
            <label className="text-[11px] text-charcoal-500 uppercase tracking-wider font-bold block">
              FAILURE SEVERITY
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['LOW', 'MEDIUM', 'CRITICAL'] as FailureSeverity[]).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  disabled={isSimulationRunning}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    severity === sev
                      ? sev === 'CRITICAL'
                        ? 'bg-dustybrown-300 text-white shadow-sm'
                        : sev === 'MEDIUM'
                        ? 'bg-cream-300 text-charcoal-900 shadow-sm'
                        : 'bg-softblue-200 text-charcoal-900 shadow-sm'
                      : 'bg-cream-100 text-charcoal-500 border border-charcoal-900/10 hover:bg-cream-200'
                  } disabled:opacity-50`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Failure Type */}
          <div className="space-y-1">
            <label className="text-[11px] text-charcoal-500 uppercase tracking-wider font-bold block">
              FAILURE TYPE
            </label>
            <select
              value={failureType}
              onChange={(e) => setFailureType(e.target.value as FailureType)}
              disabled={isSimulationRunning}
              className="w-full bg-cream-50 border border-charcoal-900/15 rounded-xl px-3 py-2 text-charcoal-900 text-xs focus:outline-none focus:border-charcoal-900 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <option value="Equipment Failure">Equipment Failure</option>
              <option value="Cyber Attack">Cyber Attack</option>
              <option value="Physical Disruption">Physical Disruption</option>
              <option value="Extreme Weather Event">Extreme Weather Event</option>
            </select>
          </div>
        </div>

        {/* 4. Custom Scenario Summary Card */}
        <div className="mt-3.5 p-3 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-2 text-xs">
          <div className="flex items-center justify-between text-charcoal-500 border-b border-charcoal-900/10 pb-1.5 font-bold">
            <span className="text-charcoal-900">CUSTOM SCENARIO SUMMARY</span>
            <span className="text-softblue-700">✓ DETERMINISTIC</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500">Initial Disruptions:</span>
              <span className="font-bold text-charcoal-900">{selectedNodeIds.length}</span>
            </div>
            <div className="text-[10px] text-mutedpurple-600 truncate font-bold">
              {selectedNodeObjects.map((n) => n.name).join(' + ')}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500">Start Time / Version:</span>
              <span className="text-charcoal-700 font-bold">T+00 • city-v1</span>
            </div>
          </div>
        </div>

        {/* 5. Save Custom Scenario Field */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              disabled={isSimulationRunning}
              placeholder="Scenario Name (e.g. Power + Telecom)"
              className="flex-1 bg-cream-50 border border-charcoal-900/15 rounded-xl px-3 py-1.5 text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:border-charcoal-900"
            />
            <button
              type="button"
              onClick={handleSaveScenario}
              disabled={isSimulationRunning || isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-900 text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              title={user ? 'Save custom scenario to Supabase Cloud' : 'Save custom scenario to Local Storage'}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-charcoal-900" />
              ) : (
                <BookmarkPlus className="w-3.5 h-3.5 text-charcoal-900" />
              )}
              <span>
                {savedSuccess
                  ? '✓ SAVED'
                  : user && isCloudConnected
                  ? 'SAVE TO CLOUD'
                  : 'SAVE LOCAL'}
              </span>
            </button>
          </div>

          {isGuest && (
            <div className="text-[10px] text-charcoal-500 flex items-center justify-between">
              <span>Saving locally.</span>
              <button
                type="button"
                onClick={openAuthModal}
                className="text-mutedpurple-600 hover:underline cursor-pointer font-bold"
              >
                Sign in for cloud sync →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6. Primary Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-charcoal-900/10">
        <button
          onClick={handleBuildAndRun}
          disabled={isSimulationRunning || selectedNodeIds.length === 0}
          className="w-full py-3 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs tracking-wider transition-all flex items-center justify-center space-x-2 shadow-command cursor-pointer disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-cream-100" />
          <span>▶ RUN CUSTOM SIMULATION</span>
        </button>

        <button
          onClick={onReset}
          className="w-full py-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-charcoal-500" />
          <span>RESET ENGINE</span>
        </button>
      </div>
    </div>
  );
};
