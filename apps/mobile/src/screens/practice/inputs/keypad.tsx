import { cx, Pressable, ThemedText, View } from '@math-genius/ui';

import { strings } from '@/i18n';
import type { KeypadKey } from '@/utils/keypad';

const t = strings.practice;

const ROWS: readonly (readonly KeypadKey[])[] = [
  ['7', '8', '9', 'delete'],
  ['4', '5', '6', '/'],
  ['1', '2', '3', '−'],
  [',', '0'],
];

const LABELS: Partial<Record<KeypadKey, { text: string; spoken: string }>> = {
  delete: { text: '⌫', spoken: t.keypad.delete },
  '/': { text: '/', spoken: t.keypad.fraction },
  '−': { text: '−', spoken: t.keypad.minus },
  ',': { text: ',', spoken: t.keypad.comma },
};

type KeypadProps = {
  onKey: (key: KeypadKey) => void;
  onSubmit: () => void;
  canSubmit: boolean;
};

/** Built-in number keypad: digits, comma, fraction bar and minus sign, never the system keyboard. */
export function Keypad({ onKey, onSubmit, canSubmit }: KeypadProps) {
  return (
    <View className="gap-2">
      {ROWS.map((row, rowIndex) => (
        <View key={row.join('')} className="flex-row gap-2">
          {row.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={LABELS[key]?.spoken ?? key}
              onPress={() => onKey(key)}
              className="h-14 flex-1 items-center justify-center rounded-md border border-border bg-surface active:opacity-80"
            >
              <ThemedText variant="title">{LABELS[key]?.text ?? key}</ThemedText>
            </Pressable>
          ))}
          {rowIndex === ROWS.length - 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.submit}
              disabled={!canSubmit}
              onPress={onSubmit}
              className={cx(
                'h-14 flex-2 items-center justify-center rounded-md bg-primary active:opacity-80',
                !canSubmit && 'opacity-40',
              )}
            >
              <ThemedText variant="headline" tone="onPrimary">
                {t.submit}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}
