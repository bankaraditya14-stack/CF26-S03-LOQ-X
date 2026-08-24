import { Scenario } from '../types';

export const PREDEFINED_SCENARIOS: Scenario[] = [
  {
    id: 'scenario-power-grid-failure',
    name: 'Major Power Grid Failure',
    description: 'Catastrophic trip at Central Power Substation propagating to water pumps, traffic grid, sewage, and trauma hospital.',
    graphVersion: 'city-v1',
    initialFailures: [
      {
        nodeId: 'power-grid-main',
        time: 0,
      },
    ],
    parameters: {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 15,
    },
    recoveryActions: [],
  },
  {
    id: 'scenario-telecom-failure',
    name: 'Metropolitan Telecom & Fiber Severance',
    description: 'Physical optical trunk line severed in central transit tunnel affecting 112 emergency dispatch and civic coordination.',
    graphVersion: 'city-v1',
    initialFailures: [
      {
        nodeId: 'telecom-core',
        time: 0,
      },
    ],
    parameters: {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 10,
    },
    recoveryActions: [],
  },
  {
    id: 'scenario-dual-failure',
    name: 'Dual Infrastructure Failure (Power + Telecom)',
    description: 'Simultaneous disruption of Central Power Grid AND Telecom Fiber Core at T+0, testing multi-cascade convergence on Emergency Dispatch and Apex Hospital.',
    graphVersion: 'city-v1',
    initialFailures: [
      {
        nodeId: 'power-grid-main',
        time: 0,
      },
      {
        nodeId: 'telecom-core',
        time: 0,
      },
    ],
    parameters: {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 15,
    },
    recoveryActions: [],
  },
  {
    id: 'scenario-water-pump-failure',
    name: 'Raw Water Pump Station Failure',
    description: 'Mechanical turbine seizure at Yamuna Water Intake, starving potable water distribution mains and downstream hospital sanitation.',
    graphVersion: 'city-v1',
    initialFailures: [
      {
        nodeId: 'water-treatment-pump',
        time: 0,
      },
    ],
    parameters: {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 10,
    },
    recoveryActions: [],
  },
  {
    id: 'scenario-recovery-demo',
    name: 'Cascade Mitigation & Recovery Demo',
    description: 'Central Power Grid fails at T+0. Auxiliary Backup Power generator is engaged at T+10 for Water Pump, stopping downstream hospital cascade.',
    graphVersion: 'city-v1',
    initialFailures: [
      {
        nodeId: 'power-grid-main',
        time: 0,
      },
    ],
    parameters: {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 15,
    },
    recoveryActions: [
      {
        id: 'rec-backup-power-waterpump',
        nodeId: 'water-treatment-pump',
        type: 'BACKUP_POWER',
        startTime: 10,
        duration: 8,
        description: 'Deploy emergency diesel generator to keep raw water pumping operational.',
      },
    ],
  },
];
