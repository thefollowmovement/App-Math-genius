import { avatarLock, type Avatar, type AvatarPart } from '@math-genius/shared';
import { Pressable, ThemedText, View, cx } from '@math-genius/ui';
import Svg, { Circle } from 'react-native-svg';

import { AvatarPicture } from '@/components/avatar';
import { SWATCHES } from '@/components/avatar/palette';
import { withPart } from '@/data/look-model';
import { strings } from '@/i18n';

const t = strings.look;

type OptionChipProps = {
  avatar: Avatar;
  part: AvatarPart;
  option: string;
  /** The option's name (strings.look.options). */
  name: string;
  earned: ReadonlySet<string>;
  onPress: () => void;
};

/** One option of a part: a color, or the avatar wearing it. Rare options show a lock. */
export function OptionChip({ avatar, part, option, name, earned, onPress }: OptionChipProps) {
  const chosen = avatar[part] === option;
  const badge = avatarLock(part, option);
  const locked = badge !== null && !earned.has(badge);
  const swatch = SWATCHES[part]?.[option];
  const preview = withPart(avatar, part, option) ?? avatar;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: chosen }}
      accessibilityLabel={locked ? t.lockedLabel(name, strings.badges.items[badge].title) : name}
      onPress={onPress}
      className={cx(
        'rounded-full border-4 p-1 active:opacity-80',
        chosen ? 'border-primary' : 'border-transparent',
      )}
    >
      {swatch ? (
        <View className="size-12">
          <Svg width="100%" height="100%" viewBox="0 0 48 48">
            <Circle cx={24} cy={24} r={23} fill={swatch} />
          </Svg>
        </View>
      ) : (
        <AvatarPicture avatar={preview} size="md" />
      )}
      {locked ? (
        <View className="absolute -right-1 -top-1 rounded-full border border-border bg-surface px-1">
          <ThemedText variant="caption">{t.lock}</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}
