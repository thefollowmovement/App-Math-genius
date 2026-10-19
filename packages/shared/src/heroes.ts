/**
 * The six heroes of the Neon Stage team (docs/design/personnages.md). The child picks one; it
 * stands for the child on every screen. The migration *_neon_heroes.sql holds the same ids
 * (avatar.test.ts compares them). Ids are stored: never rename one.
 */
export const HERO_IDS = ['nova', 'juno', 'mika', 'kai', 'taro', 'leo'] as const;
export type HeroId = (typeof HERO_IDS)[number];

/**
 * The situations a hero is shown in. With still images, each pose is a picture; with an
 * animation (Rive), each would be a state of the hero's state machine.
 * - bust: the child's avatar (home, profiles, the parent's pages);
 * - victory: a mission won, a badge, a boss beaten;
 * - encourage: after a mistake, before a session;
 * - think: hints, a hard exercise.
 */
export const HERO_POSES = ['bust', 'victory', 'encourage', 'think'] as const;
export type HeroPose = (typeof HERO_POSES)[number];

export const isHeroId = (id: string): id is HeroId => (HERO_IDS as readonly string[]).includes(id);
