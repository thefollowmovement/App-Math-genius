import { CHILD_MESSAGE_MAX_LENGTH, childMessageSchema } from '@math-genius/shared';
import { Button, Pressable, TextField, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { ErrorMessage } from '@/components/error-message';
import type { ErrorKind } from '@/data/errors';
import { strings } from '@/i18n';

const t = strings.nudge;

/** What the last message became: delivered to devices, or to none that shows notifications. */
export type NudgeResult = 'sent' | 'no_device' | null;

type NudgePanelProps = {
  childName: string;
  /** Some device of the child reported that it shows notifications. */
  reachable: boolean;
  onSend: (message: string) => void;
  sending: boolean;
  result: NudgeResult;
  error: ErrorKind | null;
};

/** A message for the child, picked from suggestions or written, shown on their devices. */
export function NudgePanel({
  childName,
  reachable,
  onSend,
  sending,
  result,
  error,
}: NudgePanelProps) {
  const [message, setMessage] = useState<string>(t.suggestions[0]);
  const [invalid, setInvalid] = useState(false);
  const [edited, setEdited] = useState(false);
  const edit = (text: string) => {
    setMessage(text);
    setInvalid(false);
    setEdited(true);
  };

  function send() {
    const parsed = childMessageSchema.safeParse(message);
    if (!parsed.success) return setInvalid(true);
    setEdited(false);
    onSend(parsed.data);
  }

  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.title(childName)}
      </ThemedText>
      <ThemedText variant="caption">{t.intro}</ThemedText>
      {reachable ? null : <ThemedText tone="danger">{t.unreachable(childName)}</ThemedText>}
      <View className="gap-2">
        {t.suggestions.map((suggestion) => (
          <Pressable
            key={suggestion}
            accessibilityRole="radio"
            accessibilityState={{ selected: message === suggestion }}
            onPress={() => edit(suggestion)}
            className={
              message === suggestion
                ? 'rounded-md border border-primary bg-surface px-4 py-3 active:opacity-80'
                : 'rounded-md border border-border bg-surface px-4 py-3 active:opacity-80'
            }
          >
            <ThemedText>{suggestion}</ThemedText>
          </Pressable>
        ))}
      </View>
      <TextField
        label={t.message}
        value={message}
        onChangeText={edit}
        maxLength={CHILD_MESSAGE_MAX_LENGTH}
        error={invalid ? t.errors.message : undefined}
      />
      <ErrorMessage kind={error} />
      {result && !edited ? (
        <ThemedText
          accessibilityLiveRegion="polite"
          tone={result === 'sent' ? 'default' : 'danger'}
        >
          {result === 'sent' ? t.sent : t.noDevice(childName)}
        </ThemedText>
      ) : null}
      <Button title={t.send} loading={sending} onPress={send} />
    </View>
  );
}
