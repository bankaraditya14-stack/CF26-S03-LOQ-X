import { NodeStatus, ServiceType, Criticality } from '../types';

export function formatSimTime(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.floor((minutes - mins) * 60);
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `T+${mm}:${ss}`;
}

export function getStatusColor(status: NodeStatus): {
  bg: string;
  text: string;
  border: string;
  glow: string;
  badge: string;
} {
  switch (status) {
    case 'HEALTHY':
      return {
        bg: 'bg-emerald-950/50',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      };
    case 'AT_RISK':
      return {
        bg: 'bg-yellow-950/50',
        text: 'text-yellow-400',
        border: 'border-yellow-500/40',
        glow: 'shadow-[0_0_15px_rgba(234,179,8,0.25)]',
        badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      };
    case 'DEGRADED':
      return {
        bg: 'bg-amber-950/50',
        text: 'text-amber-400',
        border: 'border-amber-500/50',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
    case 'FAILED':
      return {
        bg: 'bg-rose-950/60',
        text: 'text-rose-400',
        border: 'border-rose-500/60',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      };
    case 'RECOVERING':
      return {
        bg: 'bg-cyan-950/50',
        text: 'text-cyan-400',
        border: 'border-cyan-500/50',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
        badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      };
  }
}

export function getCriticalityBadge(crit: Criticality): {
  bg: string;
  text: string;
  border: string;
} {
  switch (crit) {
    case 'HIGH':
      return {
        bg: 'bg-rose-500/15',
        text: 'text-rose-300',
        border: 'border-rose-500/30',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        border: 'border-amber-500/30',
      };
    case 'LOW':
      return {
        bg: 'bg-slate-500/15',
        text: 'text-slate-300',
        border: 'border-slate-500/30',
      };
  }
}

export function getServiceCategoryLabel(type: ServiceType): string {
  switch (type) {
    case 'POWER':
      return 'Electric Grid';
    case 'WATER':
      return 'Water Utility';
    case 'TELECOM':
      return 'Telecom / Fiber';
    case 'TRAFFIC':
      return 'Traffic Management';
    case 'HOSPITAL':
      return 'Healthcare / Trauma';
    case 'EMERGENCY':
      return 'Emergency Dispatch';
    case 'SEWAGE':
      return 'Wastewater Treatment';
    case 'TRANSPORT':
      return 'Public Transit';
    case 'FUEL':
      return 'Strategic Fuel';
    case 'MUNICIPAL':
      return 'Municipal Command';
  }
}
