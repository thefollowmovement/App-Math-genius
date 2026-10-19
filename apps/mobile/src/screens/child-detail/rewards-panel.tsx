import { Picker } from '@expo/ui';
import {
  PARENT_REWARD_GOALS,
  PARENT_REWARD_TARGETS,
  PARENT_REWARD_TITLE_MAX,
  parentRewardSchema,
  type ParentRewardGoal,
  type ParentRewardInput,
} from '@math-genius/shared';
import { Button, TextField, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { PickerField } from '@/components/picker-field';
import type { ErrorKind } from '@/data/errors';
import type { ParentRewardView } from '@/data/parent-rewards-model';
import { strings } from '@/i18n';
import { levelPercent } from '@/utils/reward-text';

const t = strings.parentRewards;

export type ParentRewardsState = {
  rewards: readonly ParentRewardView[];
  creating: boolean;
  /** The reward being given or removed. */
  busyId: string | null;
  error: ErrorKind | null;
  onCreate: (reward: ParentRewardInput) => void;
  onGive: (rewardId: string) => void;
  onRemove: (rewardId: string) => void;
};

const firstTarget = (goal: ParentRewardGoal) => PARENT_REWARD_TARGETS[goal][2] ?? 1;

/** Real-life rewards the parent sets, the child's progress towards them, and handing them over. */
export function RewardsPanel({
  rewards,
  creating,
  busyId,
  error,
  onCreate,
  onGive,
  onRemove,
}: ParentRewardsState) {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState<ParentRewardGoal>('streak');
  const [target, setTarget] = useState(firstTarget('streak'));
  const [titleError, setTitleError] = useState(false);

  function submit() {
    const parsed = parentRewardSchema.safeParse({ title, goal, target });
    setTitleError(!parsed.success);
    if (!parsed.success) return;
    onCreate(parsed.data);
    setTitle('');
  }

  return (
    <View className="gap-4">
      <View className="gap-1">
        <ThemedText variant="headline" accessibilityRole="header">
          {t.title}
        </ThemedText>
        <ThemedText variant="caption">{t.intro}</ThemedText>
      </View>
      {rewards.length === 0 ? <ThemedText variant="caption">{t.empty}</ThemedText> : null}
      {rewards.map((reward) => (
        <View key={reward.id} className="gap-2 rounded-lg border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between gap-2">
            <ThemedText variant="headline" className="flex-1">
              {reward.title}
            </ThemedText>
            <ThemedText variant="caption" tone={reward.status === 'locked' ? 'muted' : 'default'}>
              {t.status[reward.status]}
            </ThemedText>
          </View>
          <ThemedText variant="caption">{t.goalText[reward.goal](reward.target)}</ThemedText>
          {reward.status === 'locked' ? (
            <View className="flex-row items-center gap-2">
              <View className="h-2 flex-1 overflow-hidden rounded-full border border-border bg-background">
                <View
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${levelPercent(reward.value, reward.target)}%` }}
                />
              </View>
              <ThemedText variant="caption">{t.progress(reward.value, reward.target)}</ThemedText>
            </View>
          ) : null}
          <View className="flex-row gap-2">
            {reward.status === 'unlocked' ? (
              <Button
                variant="secondary"
                title={t.give}
                accessibilityLabel={t.giveLabel(reward.title)}
                loading={busyId === reward.id}
                onPress={() => onGive(reward.id)}
              />
            ) : null}
            <Button
              variant="ghost"
              title={t.remove}
              accessibilityLabel={t.removeLabel(reward.title)}
              disabled={busyId === reward.id}
              onPress={() => onRemove(reward.id)}
            />
          </View>
        </View>
      ))}
      <View className="gap-3 rounded-lg border border-border bg-surface p-4">
        <TextField
          label={t.form.title}
          hint={t.form.titleHint}
          value={title}
          onChangeText={setTitle}
          maxLength={PARENT_REWARD_TITLE_MAX}
          error={titleError ? t.errors.title : undefined}
        />
        <PickerField label={t.form.goal}>
          <Picker<string>
            selectedValue={goal}
            onValueChange={(value) => {
              const next = PARENT_REWARD_GOALS.find((option) => option === value) ?? 'streak';
              setGoal(next);
              setTarget(firstTarget(next));
            }}
            testID="reward-goal"
          >
            {PARENT_REWARD_GOALS.map((option) => (
              <Picker.Item key={option} label={t.goals[option]} value={option} />
            ))}
          </Picker>
        </PickerField>
        <PickerField label={t.form.target}>
          <Picker<string>
            selectedValue={String(target)}
            onValueChange={(value) => setTarget(Number(value))}
            testID="reward-target"
          >
            {PARENT_REWARD_TARGETS[goal].map((option) => (
              <Picker.Item key={option} label={t.goalText[goal](option)} value={String(option)} />
            ))}
          </Picker>
        </PickerField>
        {error ? (
          <ThemedText tone="danger" accessibilityLiveRegion="polite">
            {strings.errors[error]}
          </ThemedText>
        ) : null}
        <Button title={t.form.add} loading={creating} onPress={submit} />
      </View>
    </View>
  );
}
