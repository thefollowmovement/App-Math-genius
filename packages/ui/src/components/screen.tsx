import type { ReactNode } from 'react';

import { cx } from '../class-names';
import { ScrollView, View } from '../primitives';

type ScreenProps = {
  children: ReactNode;
  /** Centers the content vertically, for short screens. */
  centered?: boolean;
  /** Layout only, applied to the content column. */
  className?: string;
};

/** Scrollable page with the theme background and a readable column width. */
export function Screen({ children, centered = false, className }: ScreenProps) {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName={cx('grow px-6 py-8', centered && 'justify-center')}
      keyboardShouldPersistTaps="handled"
    >
      <View className={cx('w-full max-w-md gap-6 self-center', className)}>{children}</View>
    </ScrollView>
  );
}
