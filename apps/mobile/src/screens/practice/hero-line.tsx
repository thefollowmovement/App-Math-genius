import type { Exercise, Slot } from '@math-genius/exercise-engine';
import { companionLook, heroLook, type CompanionLook, type HeroPose } from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';

import { CompanionPicture } from '@/components/companion/companion-picture';
import { useChildHero } from '@/components/hero/hero-context';
import { SpeechBubble } from '@/components/hero/hero-says';
import { HeroView } from '@/components/hero/hero-view';
import { strings } from '@/i18n';
import { companionLine, onFire, type TalkContext } from '@/i18n/companion-talk';

import type { PracticeFeedback } from '.';
import { CoachBubble, type CoachView } from './coach-bubble';

const t = strings.practice;

type HeroLineProps = {
  exercise: Exercise;
  slot: Slot;
  /** Right answers in a row, the current one included. */
  combo: number;
  feedback: PracticeFeedback | null;
  /** Errors in a row: the hint is shown up front as a reminder. */
  reminder: boolean;
  hintShown: boolean;
  onShowHint: () => void;
  /** After a wrong answer: the coach's explanation, presented by the hero. */
  coach?: CoachView | null;
  onUnderstood?: () => void;
  onExplainAgain?: () => void;
};

/** What the bottom of the exercise shows: the hero's pose, a line and who says it. */
type Line = {
  pose: Exclude<HeroPose, 'bust'>;
  text: string;
  /** The bubble offers the hint: touching it shows it. */
  ask: boolean;
  /** Said by the companion rather than the hero. */
  byCompanion: boolean;
};

/** The hero alone: it offers a hint, thinks it over, cheers and encourages. */
function heroLine({ exercise, feedback, reminder, hintShown, coach }: HeroLineProps): Line {
  const pick = (lines: readonly string[]) => lines[exercise.seed % lines.length] ?? lines[0] ?? '';
  const line = (pose: Line['pose'], text: string, ask = false): Line => ({
    pose,
    text,
    ask,
    byCompanion: false,
  });
  if (feedback?.correct) {
    return line('victory', feedback.fast ? `${pick(t.correct)} ${t.fast}` : pick(t.correct));
  }
  if (feedback && coach?.status === 'thinking') return line('think', t.coach.thinking);
  if (feedback) return line('encourage', pick(strings.heroes.encourage));
  // Before the hint: the bubble asks whether the child wants one.
  if (!reminder && !hintShown) return line('encourage', t.hintAsk, true);
  return line('think', `${reminder ? t.reminder : t.hintTitle}\u00a0: ${exercise.hint}`);
}

/**
 * With a companion, it takes over what concerns help: it offers and gives the hint and
 * encourages after a wrong answer, in its specialty's words. Phénix cheers right answers on fire.
 */
function withCompanion(line: Line, companion: CompanionLook, context: TalkContext): Line {
  const moment = line.ask
    ? 'ask'
    : line.pose === 'think'
      ? 'hint'
      : line.pose === 'encourage'
        ? 'encourage'
        : 'correct';
  const text = companionLine(companion.id, moment, context);
  return text === null ? line : { ...line, text, byCompanion: true };
}

/**
 * The child's hero at the bottom of the exercise, and its companion beside it when it has one
 * (never a reproach). Without a companion, the hero says everything.
 */
export function HeroLine(props: HeroLineProps) {
  const { exercise, slot, combo, reminder, onShowHint, coach, feedback } = props;
  const avatar = useChildHero();
  const companion = companionLook(avatar);
  const context: TalkContext = { exercise, slot, combo, reminder };
  // The coach's words are the hero's: the companion keeps its own lines for the rest.
  const coaching = !!feedback && !feedback.correct && !!coach;
  const line =
    companion && !coaching ? withCompanion(heroLine(props), companion, context) : heroLine(props);
  const speaker =
    companion && line.byCompanion ? strings.companions.items[companion.id].name : undefined;

  const look = heroLook(avatar);
  const cast = (
    <View className="flex-row items-end">
      <HeroView look={look} pose={coaching ? 'think' : line.pose} size="sm" />
      {companion ? (
        <View
          className={cx(
            '-ml-5 mb-1 size-14 rounded-full',
            onFire(companion.id, context) && 'bg-fire/20 glow-fire',
          )}
        >
          <CompanionPicture companion={companion} float />
        </View>
      ) : null}
    </View>
  );

  if (coaching && coach.status === 'shown') {
    return (
      <View className="gap-2">
        <CoachBubble
          explanation={coach.explanation}
          hero={strings.heroes.items[look.hero].name}
          more={coach.more}
          onUnderstood={() => props.onUnderstood?.()}
          onExplainAgain={() => props.onExplainAgain?.()}
        />
        {cast}
      </View>
    );
  }

  if (line.ask) {
    return (
      <View className="flex-row items-end gap-3">
        {cast}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.hint}
          onPress={onShowHint}
          className="mb-2 flex-1 rounded-lg rounded-bl-sm border-2 border-dashed border-border bg-raised px-4 py-3 active:opacity-80"
        >
          {speaker ? (
            <ThemedText variant="label" tone="secondary">
              {speaker}
            </ThemedText>
          ) : null}
          <ThemedText>{line.text}</ThemedText>
        </Pressable>
      </View>
    );
  }
  return (
    <View className="flex-row items-end gap-3" accessibilityLiveRegion="polite">
      {cast}
      <SpeechBubble speaker={speaker} className="mb-2 flex-1">
        {line.text}
      </SpeechBubble>
    </View>
  );
}
