import { ThemedText, View, cx, useTheme } from '@math-genius/ui';
import { useState, type ReactNode } from 'react';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import type { ChartPoint } from '@/data/progress-model';

/**
 * Small charts of the parent's « Progrès » page: bars in a theme color, and a line for a rate
 * (0 to 100). Each chart is read out as a whole (its title and summary), not point by point.
 */

const HEIGHT = 112;
const FILLS = { secondary: 'bg-secondary', accent: 'bg-accent', primary: 'bg-primary' } as const;

type ChartProps = {
  title: string;
  /** Said with the title, and written under the chart. */
  summary: string;
  points: readonly ChartPoint[];
};

/** A few labels under the chart: about one a week. */
function Labels({ points }: { points: readonly ChartPoint[] }) {
  const every = Math.max(1, Math.ceil(points.length / 7));
  return (
    <View className="flex-row" importantForAccessibility="no-hide-descendants">
      {points.map((point, index) => (
        <ThemedText
          key={`${point.label}-${index}`}
          variant="caption"
          className="flex-1 text-center"
        >
          {index % every === 0 ? point.label : ''}
        </ThemedText>
      ))}
    </View>
  );
}

function ChartFrame({ title, summary, children }: ChartProps & { children: ReactNode }) {
  return (
    <View accessible accessibilityLabel={`${title}. ${summary}`} className="gap-2">
      <View className="flex-row items-baseline justify-between gap-3">
        <ThemedText variant="label" tone="default">
          {title}
        </ThemedText>
        <ThemedText variant="caption">{summary}</ThemedText>
      </View>
      {children}
    </View>
  );
}

export function BarChart({
  fill = 'secondary',
  ...props
}: ChartProps & { fill?: keyof typeof FILLS }) {
  const max = Math.max(1, ...props.points.map((point) => point.value ?? 0));
  return (
    <ChartFrame {...props}>
      <View className="flex-row items-end gap-px border-b border-border" style={{ height: HEIGHT }}>
        {props.points.map((point, index) => {
          const value = point.value ?? 0;
          return (
            <View
              key={`${point.label}-${index}`}
              className="flex-1 justify-end"
              style={{ height: HEIGHT }}
            >
              {value > 0 ? (
                <View
                  className={cx('rounded-t-sm', FILLS[fill])}
                  style={{ height: Math.max(3, (HEIGHT * value) / max) }}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <Labels points={props.points} />
    </ChartFrame>
  );
}

/** A rate from 0 to 100, with its points; a gap where there is no value. */
export function LineChart(props: ChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const count = props.points.length;
  const x = (index: number) => (count <= 1 ? width / 2 : (width * (index + 0.5)) / count);
  const y = (value: number) => 6 + ((HEIGHT - 12) * (100 - value)) / 100;
  // Runs of consecutive values, each drawn as a line.
  const runs: { index: number; value: number }[][] = [];
  props.points.forEach((point, index) => {
    if (point.value === null) return;
    const last = runs.at(-1);
    const previous = last?.at(-1);
    if (last && previous && previous.index === index - 1) last.push({ index, value: point.value });
    else runs.push([{ index, value: point.value }]);
  });
  return (
    <ChartFrame {...props}>
      <View
        style={{ height: HEIGHT }}
        className="border-b border-border"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {[50, 100].map((level) => (
              <Line
                key={level}
                x1={0}
                x2={width}
                y1={y(level)}
                y2={y(level)}
                stroke={colors.border}
                strokeDasharray="4 4"
              />
            ))}
            {runs.map((run) =>
              run.length > 1 ? (
                <Polyline
                  key={`line-${run[0]?.index}`}
                  points={run.map((point) => `${x(point.index)},${y(point.value)}`).join(' ')}
                  fill="none"
                  stroke={colors.success}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                />
              ) : null,
            )}
            {runs.flat().map((point) => (
              <Circle
                key={point.index}
                cx={x(point.index)}
                cy={y(point.value)}
                r={3}
                fill={colors.success}
              />
            ))}
          </Svg>
        ) : null}
      </View>
      <Labels points={props.points} />
    </ChartFrame>
  );
}
