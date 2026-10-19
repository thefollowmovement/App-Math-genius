import { ThemedText, View, cx } from '@math-genius/ui';
import type { ComponentProps } from 'react';

import { Mascot, type MascotMood } from '.';

type MascotSaysProps = {
  mood?: MascotMood;
  size?: ComponentProps<typeof Mascot>['size'];
  children: string;
  /** Layout only. */
  className?: string;
};

/** The mascot and what it says, in a speech bubble. */
export function MascotSays({ mood = 'hello', size = 'sm', children, className }: MascotSaysProps) {
  return (
    <View className={cx('flex-row items-center gap-3', className)}>
      <Mascot mood={mood} size={size} />
      <View className="flex-1 rounded-lg border border-border bg-surface px-4 py-3">
        <ThemedText>{children}</ThemedText>
      </View>
    </View>
  );
}
