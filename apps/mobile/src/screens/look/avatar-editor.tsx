import { AVATAR_PART_NAMES, AVATAR_PARTS, type Avatar, type AvatarPart } from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';
import { useState } from 'react';

import type { LockedHint } from '@/data/look-model';
import { strings } from '@/i18n';

import { OptionChip } from './option-chip';

const t = strings.look;

type AvatarEditorProps = {
  avatar: Avatar;
  /** Badges the child has: they open rare options. */
  earned: ReadonlySet<string>;
  /** The rare option just tried without its badge. */
  hint: LockedHint | null;
  onPart: (part: AvatarPart, option: string) => void;
};

/** One part at a time (tabs), its options below. */
export function AvatarEditor({ avatar, earned, hint, onPart }: AvatarEditorProps) {
  const [part, setPart] = useState<AvatarPart>('hair');
  const names: Readonly<Record<string, string>> = t.options[part];
  const options: readonly string[] = AVATAR_PARTS[part];
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.avatar}
      </ThemedText>
      <View className="flex-row flex-wrap gap-2" accessibilityRole="tablist">
        {AVATAR_PART_NAMES.map((name) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: name === part }}
            onPress={() => setPart(name)}
            className={cx(
              'rounded-full border px-4 py-2 active:opacity-80',
              name === part ? 'border-primary bg-primary' : 'border-border bg-surface',
            )}
          >
            <ThemedText tone={name === part ? 'onPrimary' : 'default'}>{t.parts[name]}</ThemedText>
          </Pressable>
        ))}
      </View>
      <View
        className="flex-row flex-wrap justify-center gap-2"
        accessibilityRole="radiogroup"
        accessibilityLabel={t.parts[part]}
      >
        {options.map((option) => (
          <OptionChip
            key={option}
            avatar={avatar}
            part={part}
            option={option}
            name={names[option] ?? option}
            earned={earned}
            onPress={() => onPart(part, option)}
          />
        ))}
      </View>
      {hint ? (
        <ThemedText className="text-center" accessibilityLiveRegion="polite">
          {t.locked(
            (t.options[hint.part] as Readonly<Record<string, string>>)[hint.option] ?? hint.option,
            strings.badges.items[hint.badge].title,
          )}
        </ThemedText>
      ) : null}
    </View>
  );
}
