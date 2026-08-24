import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Bookmark,
  Play,
  Trash2,
  Zap,
  Radio,
  Droplets,
  Cloud,
  HardDrive,
  LogIn,
  Loader2,
} from 'lucide-react';
import { Scenario } from '../../types';
import { PREDEFINED_SCENARIOS } from '../../data/scenarios';
import { ScenarioRepository } from '../../services/scenarioRepository';
import { useAuth } from '../../hooks/useAuth';

interface ScenarioLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: Scenario) => void;
  activeScenarioId?: string;
}

export const ScenarioLibraryModal: React.FC<ScenarioLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  activeScenarioId,
}) => {
  const { user, isGuest, openAuthModal, isCloudConnected } = useAuth();
  const [activeTab, setActiveTab] = useState<'PREDEFINED' | 'CUSTOM'>('PREDEFINED');
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCustomScenarios = async () => {
    setIsLoading(true);
    try {
      const scenarios = await ScenarioRepository.listScenarios(user?.id);
      setCustomScenarios(scenarios);
    } catch (err) {
      console.warn('Failed to load custom scenarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomScenarios();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleDeleteCustom = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await ScenarioRepository.deleteScenario(id);
    await fetchCustomScenarios();
  };

  const getScenarioIcon = (scenario: Scenario) => {
    if (scenario.id.includes('power')) return Zap;
    if (scenario.id.includes('telecom')) return Radio;
    if (scenario.id.includes('water')) return Droplets;
    return Layers;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in select-none font-mono">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-7 border border-charcoal-900/15 shadow-command-lg relative max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-charcoal-900/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-mutedpurple-100 text-mutedpurple-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-charcoal-900 font-heading">
                SCENARIO LIBRARY
              </h2>
              <p className="text-xs text-charcoal-500">
                Predefined Benchmarks & Custom Disruption Tests
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

        {/* Tab Switcher: PREDEFINED vs CUSTOM */}
        <div className="flex items-center space-x-2 border-b border-charcoal-900/10 pb-3">
          <button
            onClick={() => setActiveTab('PREDEFINED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'PREDEFINED'
                ? 'bg-charcoal-900 text-cream-100 shadow-command'
                : 'bg-cream-100 text-charcoal-500 hover:bg-cream-200 hover:text-charcoal-900 border border-charcoal-900/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PREDEFINED BENCHMARKS ({PREDEFINED_SCENARIOS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'CUSTOM'
                ? 'bg-charcoal-900 text-cream-100 shadow-command'
                : 'bg-cream-100 text-charcoal-500 hover:bg-cream-200 hover:text-charcoal-900 border border-charcoal-900/10'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>MY SAVED SCENARIOS ({customScenarios.length})</span>
          </button>
        </div>

        {/* Guest Banner for Custom Tab */}
        {activeTab === 'CUSTOM' && isGuest && (
          <div className="p-3.5 rounded-2xl bg-cream-50 border border-charcoal-900/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-charcoal-700">
              <Cloud className="w-4 h-4 text-softblue-700 shrink-0" />
              <span>
                Sign in to save and access custom scenarios across devices with Supabase Cloud.
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                openAuthModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs shrink-0 flex items-center space-x-1 cursor-pointer shadow-command"
            >
              <LogIn className="w-3 h-3" />
              <span>SIGN IN</span>
            </button>
          </div>
        )}

        {/* Scenario List */}
        <div className="space-y-3">
          {activeTab === 'PREDEFINED' ? (
            PREDEFINED_SCENARIOS.map((scenario, idx) => {
              const Icon = getScenarioIcon(scenario);
              const isActive = activeScenarioId === scenario.id;

              return (
                <div
                  key={scenario.id}
                  onClick={() => {
                    onSelectScenario(scenario);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-mutedpurple-50 border-mutedpurple-400 shadow-command ring-1 ring-mutedpurple-400'
                      : 'bg-cream-50 border-charcoal-900/10 hover:border-charcoal-900/30 hover:bg-cream-100'
                  }`}
                >
                  <div className="flex items-start space-x-3 truncate">
                    <div className="p-2 rounded-xl bg-white text-charcoal-900 border border-charcoal-900/10 shrink-0 shadow-sm">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-charcoal-500 font-bold">0{idx + 1}</span>
                        <h3 className="text-xs font-bold text-charcoal-900 truncate font-heading">
                          {scenario.name}
                        </h3>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded bg-softblue-100 text-softblue-700 text-[9px] font-bold border border-softblue-300">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-charcoal-500 font-sans mt-0.5 line-clamp-1">
                        {scenario.description}
                      </p>
                    </div>
                  </div>

                  <button
                    className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer shadow-command"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>RUN</span>
                  </button>
                </div>
              );
            })
          ) : isLoading ? (
            <div className="p-8 text-center text-charcoal-500 text-xs flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-charcoal-900" />
              <span>Loading scenarios from storage...</span>
            </div>
          ) : customScenarios.length > 0 ? (
            customScenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => {
                  onSelectScenario(scenario);
                  onClose();
                }}
                className="p-4 rounded-2xl bg-cream-50 border border-charcoal-900/10 hover:border-charcoal-900/30 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3 truncate">
                  <div className="p-2 rounded-xl bg-white text-charcoal-900 border border-charcoal-900/10 shrink-0 shadow-sm">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-bold text-charcoal-900 truncate font-heading">
                        {scenario.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-cream-200 text-charcoal-800 text-[9px] font-bold border border-charcoal-900/10">
                        {scenario.initialFailures.length} Disruptions
                      </span>
                      {user && isCloudConnected ? (
                        <span className="px-1.5 py-0.5 rounded bg-softblue-100 text-softblue-700 text-[9px] font-bold border border-softblue-300 flex items-center space-x-1">
                          <Cloud className="w-2.5 h-2.5" />
                          <span>CLOUD</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-cream-200 text-charcoal-600 text-[9px] font-bold border border-charcoal-900/10 flex items-center space-x-1">
                          <HardDrive className="w-2.5 h-2.5" />
                          <span>LOCAL</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-500 font-sans mt-0.5 line-clamp-1">
                      {scenario.description || 'Custom user disruption scenario.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={(e) => handleDeleteCustom(scenario.id, e)}
                    className="p-2 rounded-xl bg-white text-charcoal-400 hover:text-dustybrown-400 border border-charcoal-900/10 transition-colors cursor-pointer shadow-sm"
                    title="Delete scenario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-command"
                  >
                    <Play className="w-3.5 h-3.5 fill-cream-100" />
                    <span>RUN</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center rounded-2xl bg-cream-50 border border-charcoal-900/10 space-y-2">
              <Bookmark className="w-6 h-6 text-charcoal-400 mx-auto" />
              <div className="text-xs font-bold text-charcoal-900">NO SAVED SCENARIOS YET</div>
              <p className="text-[11px] text-charcoal-500 font-sans">
                Build a custom disruption in Mission Control and click SAVE TO CLOUD to add it here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-charcoal-900/10 text-xs">
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
