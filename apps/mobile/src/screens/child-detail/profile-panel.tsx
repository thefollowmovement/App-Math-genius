import type { LearnerProfile } from '@math-genius/exercise-engine';
import type { Tables } from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { Icon } from '@/components/game/icons';
import type { ErrorKind } from '@/data/errors';
import type { UniverseOption } from '@/data/universe-model';
import { strings } from '@/i18n';
import { profileTexts } from '@/i18n/profile-text';

const t = strings.childDetail.profile;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

export type ProfilePanelState = {
  /** The parent agreed to personalization for this child. */
  enabled: boolean;
  /** Null before the first computation; missing while loading. */
  profile?: { profile: LearnerProfile | null; computedAt: string } | null;
  chosen: readonly UniverseOption[];
  others: readonly Pick<Tables<'interest_other_answers'>, 'question_id' | 'answer' | 'status'>[];
  saving: boolean;
  error: ErrorKind | null;
  onEnable: () => void;
  onDisable: () => void;
  onEditUniverse: () => void;
};

/**
 * The learning profile and the child's universe (docs/specs.md): asked for separately, strengths
 * before points to work on, everything editable, and deleted when turned off.
 */
export function ProfilePanel({
  childName,
  enabled,
  profile,
  chosen,
  others,
  saving,
  error,
  onEnable,
  onDisable,
  onEditUniverse,
}: ProfilePanelState & { childName: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.title}
      </ThemedText>
      {!enabled ? (
        <View className="gap-3 rounded-lg border border-border bg-surface p-4">
          <ThemedText>{t.consent.intro(childName)}</ThemedText>
          {t.consent.points.map((point) => (
            <View key={point} className="flex-row items-start gap-3">
              <Icon name="check" color="successInk" size="sm" />
              <ThemedText variant="caption" tone="default" className="flex-1">
                {point}
              </ThemedText>
            </View>
          ))}
          <ThemedText variant="caption">{t.consent.off}</ThemedText>
          <Button title={t.consent.enable} loading={saving} onPress={onEnable} />
        </View>
      ) : (
        <>
          <ProfileLists profile={profile} />
          <View className="gap-2 rounded-lg border border-border bg-surface p-4">
            <ThemedText variant="label" accessibilityRole="header">
              {t.universe}
            </ThemedText>
            {chosen.length === 0 && others.length === 0 ? (
              <ThemedText variant="caption">{t.noUniverse}</ThemedText>
            ) : (
              <ThemedText>{chosen.map((option) => option.name).join(', ')}</ThemedText>
            )}
            {others.map((other) => (
              <ThemedText key={other.question_id} variant="caption">
                {`${t.other(other.answer)} (${t.otherStatus[other.status]})`}
              </ThemedText>
            ))}
            <Button variant="outline" title={t.editUniverse} onPress={onEditUniverse} />
          </View>
          {confirming ? (
            <View className="gap-3 rounded-lg border-2 border-danger bg-surface p-4">
              <ThemedText>{t.disableConfirm}</ThemedText>
              <Button
                variant="danger"
                title={t.confirm}
                loading={saving}
                onPress={() => {
                  setConfirming(false);
                  onDisable();
                }}
              />
              <Button variant="ghost" title={t.cancel} onPress={() => setConfirming(false)} />
            </View>
          ) : (
            <Button variant="ghost" title={t.disable} onPress={() => setConfirming(true)} />
          )}
        </>
      )}
      {error ? (
        <ThemedText tone="danger" accessibilityLiveRegion="polite">
          {strings.errors[error]}
        </ThemedText>
      ) : null}
    </View>
  );
}

function ProfileLists({ profile }: { profile: ProfilePanelState['profile'] }) {
  if (profile === undefined) return null;
  if (!profile?.profile) return <ThemedText variant="caption">{t.pending}</ThemedText>;
  const texts = profileTexts(profile.profile);
  return (
    <View className="gap-3 rounded-lg border border-border bg-surface p-4">
      <ThemedText variant="caption">
        {t.updatedOn(dateFormat.format(new Date(profile.computedAt)))}
      </ThemedText>
      <Section title={t.strengths} lines={texts.strengths} empty={t.noStrength} tone="success" />
      <Section title={t.weaknesses} lines={texts.weaknesses} empty={t.noWeakness} tone="fire" />
      <Section title={t.style} lines={texts.style} empty={t.noStyle} tone="secondary" />
    </View>
  );
}

function Section(props: {
  title: string;
  lines: readonly string[];
  empty: string;
  tone: 'success' | 'fire' | 'secondary';
}) {
  return (
    <View className="gap-1">
      <ThemedText variant="label" tone={props.tone} accessibilityRole="header">
        {props.title}
      </ThemedText>
      {props.lines.length === 0 ? (
        <ThemedText variant="caption">{props.empty}</ThemedText>
      ) : (
        props.lines.map((line) => <ThemedText key={line}>{`• ${line}`}</ThemedText>)
      )}
    </View>
  );
}
