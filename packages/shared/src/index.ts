export {
  GENDERS,
  PRIVACY_POLICY_VERSION,
  childProfileSchema,
  genderSchema,
  parentSignInSchema,
  parentSignUpSchema,
  type ChildProfile,
  type Gender,
  type ParentSignIn,
  type ParentSignUp,
} from './accounts';
export type { Database, Enums, Json, Tables } from './database.types';
export { GRADES, gradeRank, type Grade } from './grade';
export { gradeSchema } from './grade-schema';
export {
  PAIRING_CODE_ALPHABET,
  PAIRING_CODE_LENGTH,
  PAIRING_LINK_PREFIX,
  normalizePairingCode,
  pairingCodeSchema,
  pairingLink,
  parsePairingPayload,
} from './pairing';
export {
  COUNT_GOALS,
  DEFAULT_ROUTINE,
  DURATION_GOALS,
  MAX_VACATION_DAYS,
  WEEKDAYS,
  dayPlan,
  minuteOfDay,
  routineGoalSchema,
  routineSchema,
  startTimeOn,
  timeOfDaySchema,
  weekdayOf,
  type DayPlan,
  type Routine,
  type RoutineGoal,
  type Vacation,
  type Weekday,
} from './routine';
export { CHILD_MESSAGE_MAX_LENGTH, childMessageSchema } from './notifications';
export {
  BOSS_MAX_EXERCISES,
  BOSS_MIN_EXERCISES,
  BOSS_PASS_RATE,
  COMBO_LENGTH,
  COMBO_XP,
  FREEZE_PRICE,
  MAX_FREEZES,
  RARE_CHEST_EVERY,
  SESSION_GEMS,
  XP_PER_CORRECT,
  levelForXp,
  levelProgress,
  xpForLevel,
} from './rewards';
export { awardSchema, type Award } from './award';
export {
  BADGES,
  BADGE_CATEGORIES,
  BADGE_METRICS,
  badgeProgress,
  isBadgeCode,
  type Badge,
  type BadgeCategory,
  type BadgeCode,
  type BadgeMetric,
} from './badges';
export {
  SHOP_ITEMS,
  SHOP_KINDS,
  isShopItemCode,
  type AccessoryCode,
  type ShopItem,
  type ShopItemCode,
  type ShopKind,
} from './shop';
export {
  CHALLENGES,
  CHALLENGE_METRICS,
  challengeOfWeek,
  isChallengeCode,
  weekStart,
  type Challenge,
  type ChallengeCode,
  type ChallengeMetric,
} from './challenges';
export {
  PARENT_REWARD_GOALS,
  PARENT_REWARD_TARGETS,
  PARENT_REWARD_TITLE_MAX,
  parentRewardSchema,
  type ParentRewardGoal,
  type ParentRewardInput,
} from './parent-rewards';
export {
  AVATAR_LOCKS,
  AVATAR_PARTS,
  AVATAR_PART_NAMES,
  DEFAULT_LOOKS,
  avatarLock,
  avatarOf,
  avatarSchema,
  type Avatar,
  type AvatarPart,
} from './avatar';
