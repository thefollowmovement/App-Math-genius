import * as Haptics from 'expo-haptics';

/** Haptics are a bonus: unsupported (web, some Android phones) or off, they fail silently. */
const safely = (run: () => Promise<void>) => {
  Promise.resolve()
    .then(run)
    .catch(() => undefined);
};

export const haptics = {
  /** The cursor crossed a graduation. */
  tick: () => safely(() => Haptics.selectionAsync()),
  /** A right answer. */
  success: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** A wrong answer: a light touch, never an error buzz for a child. */
  soft: () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
};
