import { useTheme, View } from '@math-genius/ui';
import Svg, { Path } from 'react-native-svg';

import { Hidden } from './icons';

const STAR = 'M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21.1l1.4-7L2 9.3l7-.8z';
// The middle star stands taller, as on a podium.
const SIZES = [44, 60, 44] as const;

/** Three stars, the first `count` lit in the theme's gold. */
export function Stars({ count, label }: { count: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      className="flex-row items-end justify-center gap-3"
    >
      {SIZES.map((size, index) => (
        <Hidden key={index}>
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d={STAR} fill={index < count ? colors.accent : colors.border} />
          </Svg>
        </Hidden>
      ))}
    </View>
  );
}
