import type { Grade } from '@math-genius/shared';

import type { Catalogue } from '@/data/universe-model';

const ALL: Grade[] = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'];
const COLLEGE: Grade[] = ['6e', '5e', '4e', '3e'];

/** A small « Ton univers » catalogue, as the database serves it (unordered). */
export const catalogue: Catalogue = {
  questions: [
    { id: 'music', title: 'Ta musique ?', grades: ALL, position: 2, other_grades: COLLEGE },
    {
      id: 'games',
      title: 'À quels jeux tu joues ?',
      grades: ALL,
      position: 1,
      other_grades: COLLEGE,
    },
  ],
  options: [
    { question_id: 'games', universe_id: 'roblox', icon: '🧱', position: 2 },
    { question_id: 'games', universe_id: 'minecraft', icon: '⛏️', position: 1 },
    { question_id: 'games', universe_id: 'fortnite', icon: '🏝️', position: 3 },
    { question_id: 'games', universe_id: 'old-game', icon: '👾', position: 4 },
    { question_id: 'music', universe_id: 'pop', icon: '🎤', position: 1 },
    { question_id: 'music', universe_id: 'rap-fr', icon: '🎧', position: 2 },
  ],
  universes: [
    { id: 'minecraft', name: 'Minecraft', grades: ALL, status: 'active' },
    { id: 'roblox', name: 'Roblox', grades: ALL, status: 'active' },
    { id: 'fortnite', name: 'Fortnite', grades: ['5e', '4e', '3e'], status: 'active' },
    { id: 'old-game', name: 'Vieux jeu', grades: ALL, status: 'testing' },
    { id: 'pop', name: 'Pop', grades: ALL, status: 'active' },
    { id: 'rap-fr', name: 'Rap français', grades: COLLEGE, status: 'active' },
  ],
};
