import { use, useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { cx } from '../class-names';
import { ScrollView, View } from '../primitives';

type ScreenProps = {
  children: ReactNode;
  /** Centers the content vertically, for short screens. */
  centered?: boolean;
  /** Layout only, applied to the content column. */
  className?: string;
  /** A drawing behind the content, which stays in place while the content scrolls. */
  backdrop?: ReactNode;
  /** The page shows no header: its content starts below the status bar. */
  headerless?: boolean;
  /** Stays at the top of the screen, out of the scroll (a long map's title and arrows). */
  top?: ReactNode;
  /** Stays at the bottom of the screen, out of the scroll: the main action, a navigation bar. */
  footer?: ReactNode;
  /** Where the page opens, in pixels from its top (a long map opens on where the child stands). */
  scrollTo?: number;
};

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Scrollable page with the theme background and a readable column width. It keeps clear of the
 * status bar (without a header) and of the home indicator.
 */
export function Screen({
  children,
  centered = false,
  className,
  backdrop,
  headerless = false,
  top,
  footer,
  scrollTo,
}: ScreenProps) {
  // Outside a SafeAreaProvider (tests), nothing to keep clear of.
  const insets = use(SafeAreaInsetsContext) ?? NO_INSETS;
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    if (scrollTo === undefined) return;
    // After the first layout, so that the content is there to scroll.
    const frame = requestAnimationFrame(() =>
      scroll.current?.scrollTo({ y: scrollTo, animated: false }),
    );
    return () => cancelAnimationFrame(frame);
  }, [scrollTo]);
  return (
    <View
      className="flex-1 bg-background"
      style={headerless ? { paddingTop: insets.top } : undefined}
    >
      {backdrop}
      {top ? (
        <View className={cx('px-5 pb-2', headerless ? 'pt-4' : 'pt-2')}>
          <View className="w-full max-w-md self-center">{top}</View>
        </View>
      ) : null}
      <ScrollView
        ref={scroll}
        className="flex-1"
        contentContainerClassName={cx(
          'grow px-5',
          headerless ? 'pt-4' : 'pt-6',
          footer ? 'pb-4' : 'pb-8',
          centered && 'justify-center',
        )}
        keyboardShouldPersistTaps="handled"
      >
        {/* Without centering, the column fills the page: a `flex-1` view pushes what follows down. */}
        <View className={cx('w-full max-w-md gap-6 self-center', !centered && 'grow', className)}>
          {children}
        </View>
        {footer ? null : <View style={{ height: insets.bottom }} />}
      </ScrollView>
      {footer ? (
        <View className="px-5 pb-4 pt-2">
          <View className="w-full max-w-md self-center">{footer}</View>
          <View style={{ height: insets.bottom }} />
        </View>
      ) : null}
    </View>
  );
}
