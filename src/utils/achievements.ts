/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  requirement: string;
  xpValue: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    desc: 'Set up your SKUDO profile successfully.',
    requirement: 'Completed profile setup',
    xpValue: 100,
  },
  {
    id: 'zen_master',
    title: 'Zen Calm',
    desc: 'Complete a puzzle in Zen difficulty.',
    requirement: 'Win a Zen game',
    xpValue: 150,
  },
  {
    id: 'flow_state',
    title: 'In the Flow',
    desc: 'Complete a Focus or Flow game in under 8 minutes.',
    requirement: 'Win in < 8:00',
    xpValue: 300,
  },
  {
    id: 'quantum_leap',
    title: 'Quantum Leap',
    desc: 'Conquer the absolute expert Challenge (Quantum Level).',
    requirement: 'Win a Quantum game',
    xpValue: 500,
  },
  {
    id: 'flawless',
    title: 'Mind of Steel',
    desc: 'Finish any puzzle with zero mistakes.',
    requirement: 'Win with 0 mistakes',
    xpValue: 400,
  },
  {
    id: 'speed_demon',
    title: 'Digital Racer',
    desc: 'Solve any letter or number board in under 4 minutes.',
    requirement: 'Win in < 4:00',
    xpValue: 250,
  },
  {
    id: 'completionist',
    title: 'Skudo Completer',
    desc: 'Complete 5 full puzzles across any mode.',
    requirement: '5 Total Wins',
    xpValue: 600,
  },
];

export function getXpLevel(xp: number): { level: number; nextXp: number; progress: number } {
  // Simple algorithm: Level up every 500 XP
  const level = Math.floor(xp / 500) + 1;
  const currentXpInLevel = xp % 500;
  const nextXp = 500;
  const progress = Math.min(100, Math.floor((currentXpInLevel / nextXp) * 100));

  return { level, nextXp: 500, progress };
}
