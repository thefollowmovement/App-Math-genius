import type { Avatar } from './avatar';
import type { CosmeticUnlock } from './cosmetics';

/**
 * Companions (docs/design/compagnons.md): the creatures beside the child's hero. Each is a
 * cosmetic of the `companion` slot (cosmetics.ts builds them from this list), with a rarity and a
 * specialty: what it talks about during a session. Ids are stored in the child's avatar: never
 * rename one. Names, descriptions and lines live in the app (fr.ts, `strings.companions`).
 */

export const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

export const COMPANION_SPECIALTIES = [
  /** Hints and explanations: the starting guide. */
  'guide',
  /** Mental calculation against the clock. */
  'speed',
  'geometry',
  /** Fractions and shapes. */
  'fractions',
  /** Courage and regularity (the streak of days). */
  'courage',
  /** Encouragements from the stage. */
  'stage',
  /** Gentle encouragements. */
  'gentle',
  /** Right answers in a row: the companion catches fire. */
  'fire',
] as const;
export type CompanionSpecialty = (typeof COMPANION_SPECIALTIES)[number];

type CompanionDefinition = {
  id: string;
  rarity: Rarity;
  specialty: CompanionSpecialty;
  unlock: CosmeticUnlock;
};

/** In the order the child meets them. */
export const COMPANIONS = [
  {
    id: 'hibou',
    rarity: 'common',
    specialty: 'guide',
    unlock: { kind: 'badge', badge: 'first-exercise' },
  },
  { id: 'lapin', rarity: 'rare', specialty: 'speed', unlock: { kind: 'shop', item: 'lapin' } },
  { id: 'dragon', rarity: 'rare', specialty: 'geometry', unlock: { kind: 'shop', item: 'dragon' } },
  {
    id: 'licorne',
    rarity: 'rare',
    specialty: 'fractions',
    unlock: { kind: 'shop', item: 'licorne' },
  },
  {
    id: 'tigre',
    rarity: 'epic',
    specialty: 'courage',
    unlock: { kind: 'badge', badge: 'streak-7' },
  },
  { id: 'renard', rarity: 'epic', specialty: 'stage', unlock: { kind: 'shop', item: 'renard' } },
  { id: 'chat', rarity: 'epic', specialty: 'gentle', unlock: { kind: 'badge', badge: 'island-2' } },
  {
    id: 'phenix',
    rarity: 'legendary',
    specialty: 'fire',
    unlock: { kind: 'badge', badge: 'level-10' },
  },
] as const satisfies readonly CompanionDefinition[];

export type Companion = (typeof COMPANIONS)[number];
export type CompanionId = Companion['id'];

/**
 * Stages of a companion's evolution. One for now: later, a companion grows with the child and
 * each stage has its own picture (docs/design/compagnons.md).
 */
export const COMPANION_STAGES = [1] as const;
export type CompanionStage = (typeof COMPANION_STAGES)[number];

/** A companion as it is shown: which one, at which stage of its evolution. */
export type CompanionLook = { id: CompanionId; stage: CompanionStage };

const BY_ID: ReadonlyMap<string, Companion> = new Map(COMPANIONS.map((item) => [item.id, item]));

export const companionOf = (id: string): Companion | undefined => BY_ID.get(id);

export const isCompanionId = (id: string): id is CompanionId => BY_ID.has(id);

/** The companions that the badges just earned unlock (told at the end of a session). */
export const companionsUnlockedBy = (badges: readonly string[]): CompanionId[] =>
  COMPANIONS.filter(({ unlock }) => unlock.kind === 'badge' && badges.includes(unlock.badge)).map(
    ({ id }) => id,
  );

/** The stage a companion has reached. Always the first until companions evolve. */
export const companionStage = (_id: CompanionId): CompanionStage => 1;

/** The companion the hero has beside it, if any. */
export function companionLook(avatar: Avatar): CompanionLook | null {
  const id = avatar.wear.companion;
  return id !== undefined && isCompanionId(id) ? { id, stage: companionStage(id) } : null;
}
