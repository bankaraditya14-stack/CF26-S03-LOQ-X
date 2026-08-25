import React from 'react';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Droplets,
  Radio,
  Car,
  PhoneCall,
  FileText,
  Cloud,
  HardDrive,
  User as UserIcon,
  LogIn,
  LogOut,
  Sliders,
  BarChart3,
  Network,
  Cpu,
  Layers,
} from 'lucide-react';
import { CascadeInteractivePreview } from './CascadeInteractivePreview';
import { navigate } from '../../utils/router';
import { useAuth } from '../../hooks/useAuth';
import { AuthModal } from '../auth/AuthModal';
import { InteractiveHoverButton } from '../ui/InteractiveHoverButton';

export const LandingPage: React.FC = () => {
  const { user, isCloudConnected, openAuthModal, isAuthModalOpen, closeAuthModal, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-charcoal-900 font-sans selection:bg-mutedpurple-300 selection:text-white">
      {/* Top Engineering Nav Header */}
      <header className="w-full bg-cream-100/95 backdrop-blur-md border-b border-charcoal-900/10 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="p-2 rounded-xl bg-charcoal-900 text-cream-100 shadow-command">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-charcoal-900 font-heading">
                CASCADE CITY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mutedpurple-100 text-mutedpurple-700 border border-mutedpurple-300 font-bold">
                DIGITAL TWIN
              </span>
            </div>
            <p className="text-xs text-charcoal-500 font-medium hidden sm:block">
              Urban Infrastructure Resilience & Cascade Simulator
            </p>
          </div>
        </div>

        {/* Quick Nav Links, Cloud Status & Account */}
        <div className="flex items-center space-x-3">
          {/* Cloud Indicator */}
          {isCloudConnected ? (
            <div
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-softblue-400 text-charcoal-900 text-xs font-mono shadow-sm"
              title="Connected to Supabase PostgreSQL Database"
            >
              <Cloud className="w-3.5 h-3.5 text-softblue-600" />
              <span className="font-bold">CLOUD CONNECTED</span>
            </div>
          ) : (
            <div
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-charcoal-900/15 text-charcoal-500 text-xs font-mono shadow-sm"
              title="Cloud storage unavailable. Your local scenarios remain available."
            >
              <HardDrive className="w-3.5 h-3.5 text-charcoal-400" />
              <span>LOCAL MODE</span>
            </div>
          )}

          <button
            onClick={() => navigate('/about-model')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-charcoal-700 hover:text-charcoal-900 hover:bg-cream-200 border border-charcoal-900/10 transition-all cursor-pointer hidden md:flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>MODEL SPEC</span>
          </button>

          {/* Account Control */}
          {user ? (
            <div className="flex items-center space-x-2 bg-white border border-charcoal-900/15 rounded-xl px-3 py-1 text-xs font-mono shadow-sm">
              <UserIcon className="w-3.5 h-3.5 text-mutedpurple-600" />
              <span className="text-charcoal-900 max-w-[120px] truncate text-[11px] font-medium">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="p-1 rounded hover:bg-cream-200 text-charcoal-400 hover:text-dustybrown-400 transition-colors ml-0.5 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 text-xs font-bold font-mono transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-mutedpurple-600" />
              <span>SIGN IN</span>
            </button>
          )}

          <InteractiveHoverButton
            text="LAUNCH SIMULATOR"
            onClick={() => navigate('/simulator')}
            className="px-4 py-2 text-xs"
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col space-y-24">
        
        {/* ============================================================================== */}
        {/* 1. HERO SECTION */}
        {/* ============================================================================== */}
        <section className="flex flex-col space-y-10">
          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-charcoal-900/10 shadow-sm text-xs font-mono text-charcoal-700">
              <span className="w-2 h-2 rounded-full bg-softblue-500"></span>
              <span className="font-bold">URBAN DIGITAL TWIN & STRESS TESTING PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-charcoal-900 font-heading leading-tight">
              Understand the Failure. <br />
              <span className="text-mutedpurple-500">Predict the Cascade.</span> <br />
              Plan the Recovery.
            </h1>

            <p className="text-lg text-charcoal-500 max-w-3xl leading-relaxed">
              An intelligent infrastructure resilience platform that models dependencies, simulates cascading failures, measures impact, and evaluates recovery strategies.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <InteractiveHoverButton
                text="LAUNCH SIMULATOR"
                onClick={() => navigate('/simulator')}
                className="px-7 py-3.5 text-sm"
              />

              <button
                onClick={() => {
                  const el = document.getElementById('systems-of-systems');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 font-bold text-sm font-mono transition-all flex items-center space-x-2 shadow-sm cursor-pointer"
              >
                <span>EXPLORE SIMULATION</span>
              </button>
            </div>
          </div>

          {/* Hero Visual: Sophisticated Interactive Infrastructure Network */}
          <div className="w-full">
            <CascadeInteractivePreview />
          </div>
        </section>

        {/* ============================================================================== */}
        {/* 2. PRODUCT EXPLANATION: "Cities Are Systems of Systems." */}
        {/* ============================================================================== */}
        <section id="systems-of-systems" className="flex flex-col space-y-10 pt-4">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-mutedpurple-500 uppercase tracking-widest">
              Cross-Sector Interdependency Modeling
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 font-heading">
              Cities Are Systems of Systems.
            </h2>
            <p className="text-charcoal-500 text-sm sm:text-base leading-relaxed">
              Modern urban infrastructure never fails in isolation. When one node destabilizes, hidden physical and digital dependencies trigger secondary and tertiary chain reactions across other essential municipal services.
            </p>
          </div>

          {/* Causal Chain Sequence Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-dustybrown-300 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-dustybrown-100 text-dustybrown-400 w-fit mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-dustybrown-400 font-bold uppercase tracking-wider">
                  01 — SEED DISRUPTION
                </span>
                <h3 className="text-sm font-bold text-charcoal-900 mt-1">POWER FAILURE</h3>
                <p className="text-xs text-charcoal-500 mt-2">
                  Primary 400kV transformer trips due to overload or flood.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-charcoal-900/10 flex items-center justify-between text-[11px] font-mono text-dustybrown-400 font-bold">
                <span>IMPACT: ROOT</span>
                <span>T+00:00</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-900/15 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-cream-200 text-charcoal-900 w-fit mb-3">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-charcoal-500 font-bold uppercase tracking-wider">
                  02 — DOWNSTREAM
                </span>
                <h3 className="text-sm font-bold text-charcoal-900 mt-1">TELECOM DISRUPTION</h3>
                <p className="text-xs text-charcoal-500 mt-2">
                  Cell towers switch to backup battery and drop SCADA links.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-charcoal-900/10 flex items-center justify-between text-[11px] font-mono text-charcoal-500 font-bold">
                <span>DEPTH: 1</span>
                <span>T+05:00</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-900/15 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-cream-200 text-charcoal-900 w-fit mb-3">
                  <Car className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-charcoal-500 font-bold uppercase tracking-wider">
                  03 — URBAN TRANSIT
                </span>
                <h3 className="text-sm font-bold text-charcoal-900 mt-1">TRAFFIC SIGNAL FAILURE</h3>
                <p className="text-xs text-charcoal-500 mt-2">
                  Traffic signals go dark, triggering gridlock across arterial roads.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-charcoal-900/10 flex items-center justify-between text-[11px] font-mono text-charcoal-500 font-bold">
                <span>DEPTH: 2</span>
                <span>T+15:00</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-900/15 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-cream-200 text-charcoal-900 w-fit mb-3">
                  <Droplets className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-charcoal-500 font-bold uppercase tracking-wider">
                  04 — PUBLIC HEALTH
                </span>
                <h3 className="text-sm font-bold text-charcoal-900 mt-1">TRANSPORT & WATER IMPACT</h3>
                <p className="text-xs text-charcoal-500 mt-2">
                  Water pumping stations stall; booster pressure drops below safe threshold.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-charcoal-900/10 flex items-center justify-between text-[11px] font-mono text-charcoal-500 font-bold">
                <span>DEPTH: 3</span>
                <span>T+20:00</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-mutedpurple-300 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-mutedpurple-100 text-mutedpurple-600 w-fit mb-3">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-mutedpurple-600 font-bold uppercase tracking-wider">
                  05 — CRITICAL DELAY
                </span>
                <h3 className="text-sm font-bold text-charcoal-900 mt-1">EMERGENCY DELAY</h3>
                <p className="text-xs text-charcoal-500 mt-2">
                  Ambulance response times spike due to stalled traffic and telecom queues.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-charcoal-900/10 flex items-center justify-between text-[11px] font-mono text-mutedpurple-600 font-bold">
                <span>DEPTH: 4</span>
                <span>T+25:00</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================================== */}
        {/* 3. HOW CASCADE CITY WORKS (4 STEPS) */}
        {/* ============================================================================== */}
        <section className="flex flex-col space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-mutedpurple-500 uppercase tracking-widest">
              Methodology & Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-charcoal-900 font-heading">
              How Cascade City Works
            </h2>
            <p className="text-charcoal-500 text-sm">
              Four deterministic phases to stress test urban digital twins and optimize emergency interventions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-charcoal-900/10 shadow-command flex flex-col justify-between">
              <div>
                <span className="font-mono text-2xl font-extrabold text-charcoal-300">01</span>
                <h3 className="text-base font-bold font-mono text-charcoal-900 mt-2">MODEL</h3>
                <p className="text-xs text-charcoal-500 mt-3 leading-relaxed">
                  Construct the directed infrastructure dependency graph with node criticalities, backup supplies, and propagation delays.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-charcoal-900/10 flex items-center space-x-2 text-xs font-mono text-softblue-600 font-bold">
                <Network className="w-4 h-4" />
                <span>DAG TOPOLOGY</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-charcoal-900/10 shadow-command flex flex-col justify-between">
              <div>
                <span className="font-mono text-2xl font-extrabold text-charcoal-300">02</span>
                <h3 className="text-base font-bold font-mono text-charcoal-900 mt-2">SIMULATE</h3>
                <p className="text-xs text-charcoal-500 mt-3 leading-relaxed">
                  Introduce single or multi-node seed disruptions (power blackout, monsoon flooding, cyber-physical intrusion).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-charcoal-900/10 flex items-center space-x-2 text-xs font-mono text-dustybrown-400 font-bold">
                <Zap className="w-4 h-4" />
                <span>DISCRETE EVENT ENGINE</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-charcoal-900/10 shadow-command flex flex-col justify-between">
              <div>
                <span className="font-mono text-2xl font-extrabold text-charcoal-300">03</span>
                <h3 className="text-base font-bold font-mono text-charcoal-900 mt-2">ANALYZE</h3>
                <p className="text-xs text-charcoal-500 mt-3 leading-relaxed">
                  Quantify cascade depth, affected downstream services, peak impact, stabilization time, and causal failure paths.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-charcoal-900/10 flex items-center space-x-2 text-xs font-mono text-mutedpurple-600 font-bold">
                <BarChart3 className="w-4 h-4" />
                <span>SYSTEM METRICS</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-charcoal-900/10 shadow-command flex flex-col justify-between">
              <div>
                <span className="font-mono text-2xl font-extrabold text-charcoal-300">04</span>
                <h3 className="text-base font-bold font-mono text-charcoal-900 mt-2">RECOVER</h3>
                <p className="text-xs text-charcoal-500 mt-3 leading-relaxed">
                  Dispatch recovery interventions (backup generators, circuit isolation, load shedding) and compare outcome metrics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-charcoal-900/10 flex items-center space-x-2 text-xs font-mono text-charcoal-900 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>RESILIENCE EVALUATION</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================================== */}
        {/* 4. USP SECTION: "From Failure Detection to Cascade Intelligence." */}
        {/* ============================================================================== */}
        <section className="flex flex-col space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-mutedpurple-500 uppercase tracking-widest">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 font-heading">
              From Failure Detection to Cascade Intelligence.
            </h2>
            <p className="text-charcoal-500 text-sm">
              Equipping city operators, crisis managers, and infrastructure planners with deterministic predictive insight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-7 rounded-2xl border border-charcoal-900/15 shadow-command space-y-4">
              <div className="p-3 rounded-xl bg-softblue-100 text-softblue-700 w-fit">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-mono text-charcoal-900">
                CASCADE SIMULATION
              </h3>
              <p className="text-sm text-charcoal-500 leading-relaxed">
                Understand how failures propagate across power grids, municipal water networks, telecommunications, transit systems, and emergency hospitals in discrete simulated time.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-charcoal-900/15 shadow-command space-y-4">
              <div className="p-3 rounded-xl bg-mutedpurple-100 text-mutedpurple-600 w-fit">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-mono text-charcoal-900">
                WHAT-IF ANALYSIS
              </h3>
              <p className="text-sm text-charcoal-500 leading-relaxed">
                Create custom multi-node scenarios, inject localized perturbations, tune propagation delays, and test worst-case urban catastrophe permutations with instant visual feedback.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-charcoal-900/15 shadow-command space-y-4">
              <div className="p-3 rounded-xl bg-cream-300 text-charcoal-900 w-fit">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-mono text-charcoal-900">
                DETERMINISTIC ENGINE
              </h3>
              <p className="text-sm text-charcoal-500 leading-relaxed">
                Produce mathematically reproducible simulation runs guaranteed by cryptographic DJB2 verification hashes. Identical inputs yield 100% identical outputs for scientific auditability.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-charcoal-900/15 shadow-command space-y-4">
              <div className="p-3 rounded-xl bg-dustybrown-100 text-dustybrown-400 w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-mono text-charcoal-900">
                RECOVERY INTELLIGENCE
              </h3>
              <p className="text-sm text-charcoal-500 leading-relaxed">
                Evaluate scheduled and dynamic mitigation actions (generator deployments, circuit isolations) and compare stabilization metrics against unmitigated failure baselines.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================================== */}
        {/* CTA BANNER */}
        {/* ============================================================================== */}
        <section className="bg-charcoal-900 rounded-3xl p-8 sm:p-12 text-cream-100 shadow-command-lg flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-mono font-bold text-softblue-300 uppercase tracking-widest">
              Live Interactive Digital Twin
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-cream-100">
              Ready to Stress Test City Resilience?
            </h2>
            <p className="text-sm text-charcoal-300">
              Launch Mission Control now to run benchmark scenarios, model custom cascades, and persist audit logs to Supabase PostgreSQL.
            </p>
          </div>

          <button
            onClick={() => navigate('/simulator')}
            className="px-8 py-4 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal-900 font-extrabold text-sm font-mono tracking-wider transition-all flex items-center space-x-3 shadow-command cursor-pointer flex-shrink-0"
          >
            <span>LAUNCH MISSION CONTROL</span>
            <ArrowRight className="w-5 h-5 text-charcoal-900" />
          </button>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full bg-cream-200 border-t border-charcoal-900/10 px-6 py-8 text-xs text-charcoal-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-charcoal-900">CASCADE CITY</span>
            <span>•</span>
            <span>Problem Statement S-03</span>
            <span>•</span>
            <span>JanNagar Synthetic Graph Model v1</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/simulator')}
              className="text-charcoal-900 font-bold hover:underline cursor-pointer"
            >
              /simulator
            </button>
            <button
              onClick={() => navigate('/about-model')}
              className="text-charcoal-700 hover:text-charcoal-900 hover:underline cursor-pointer"
            >
              /about-model
            </button>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
    </div>
  );
};
