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

/**
 * Built-in number keypad: digits, comma, fraction bar and minus sign, never the system keyboard.
 * The screen's VALIDER button sends the answer.
 */
export function Keypad({ onKey }: { onKey: (key: KeypadKey) => void }) {
  return (
    <View className="gap-2">
      {ROWS.map((row) => (
        <View key={row.join('')} className="flex-row gap-2">
          {row.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={LABELS[key]?.spoken ?? key}
              onPress={() => onKey(key)}
              className={cx(
                'h-14 items-center justify-center rounded-md border-2 border-border bg-surface ledge active:opacity-80',
                // Zero is wide, as on a phone's keypad.
                key === '0' ? 'flex-3' : 'flex-1',
              )}
            >
              <ThemedText variant="title">{LABELS[key]?.text ?? key}</ThemedText>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
