import { Host, Picker, Switch } from '@expo/ui';
import {
  COUNT_GOALS,
  DEFAULT_ROUTINE,
  DURATION_GOALS,
  routineSchema,
  type Routine,
  type RoutineGoal,
} from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { ErrorMessage } from '@/components/error-message';
import { PickerField } from '@/components/picker-field';
import type { ErrorKind } from '@/data/errors';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { strings } from '@/i18n';
import { goalText, timeSlots } from '@/utils/routine-text';

import { TimePickerField } from './time-picker-field';
import { WeekdayPicker } from './weekday-picker';

const t = strings.routine.form;

const START_SLOTS = timeSlots('06:00', '21:00');
const DEADLINE_SLOTS = timeSlots('07:00', '23:45');
const GOALS: RoutineGoal[] = [
  ...DURATION_GOALS.map((minutes) => ({ type: 'duration', minutes }) as const),
  ...COUNT_GOALS.map((count) => ({ type: 'count', count }) as const),
];
const goalKey = (goal: RoutineGoal) =>
  `${goal.type}:${goal.type === 'duration' ? goal.minutes : goal.count}`;

type RoutineFormProps = {
  /** The routine to edit; the default one when the child has none yet. */
  routine: Routine | null;
  onSubmit: (routine: Routine) => void;
  saving: boolean;
  saved: boolean;
  error: ErrorKind | null;
};

export function RoutineForm({ routine, onSubmit, saving, saved, error }: RoutineFormProps) {
  const initial = routine ?? DEFAULT_ROUTINE;
  const [days, setDays] = useState<number[]>(initial.days);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [wednesday, setWednesday] = useState(initial.wednesdayStartTime);
  const [weekend, setWeekend] = useState(initial.weekendStartTime);
  const [deadlineTime, setDeadlineTime] = useState(initial.deadlineTime);
  const [goal, setGoal] = useState(goalKey(initial.goal));
  const [edited, setEdited] = useState(false);
  const errors = useFieldErrors();
  const edit =
    <T,>(field: string, setValue: (value: T) => void) =>
    (value: T) => {
      setEdited(true);
      errors.onEdit(field, setValue)(value);
    };
  // Other start times move the deadline check too.
  const editStart = <T,>(setValue: (value: T) => void) => edit('deadlineTime', setValue);

  function submit() {
    const result = routineSchema.safeParse({
      days,
      startTime,
      wednesdayStartTime: wednesday,
      weekendStartTime: weekend,
      deadlineTime,
      goal: GOALS.find((option) => goalKey(option) === goal),
    });
    if (!result.success) return errors.report(result.error.issues);
    errors.reset();
    setEdited(false);
    onSubmit(result.data);
  }

  return (
    <View className="gap-6">
      <WeekdayPicker
        label={t.days}
        days={days}
        onChange={edit('days', setDays)}
        error={errors.has('days') ? t.errors.days : undefined}
      />
      <TimePickerField
        label={t.startTime}
        value={startTime}
        slots={START_SLOTS}
        onChange={editStart(setStartTime)}
        testID="start-time"
      />
      <OtherStart
        label={t.wednesday}
        fieldLabel={t.wednesdayStartTime}
        value={wednesday}
        fallback={startTime}
        onChange={editStart(setWednesday)}
        testID="wednesday-start-time"
      />
      <OtherStart
        label={t.weekend}
        fieldLabel={t.weekendStartTime}
        value={weekend}
        fallback={startTime}
        onChange={editStart(setWeekend)}
        testID="weekend-start-time"
      />
      <TimePickerField
        label={t.deadlineTime}
        hint={t.deadlineHint}
        error={errors.has('deadlineTime') ? t.errors.deadlineTime : undefined}
        value={deadlineTime}
        slots={DEADLINE_SLOTS}
        onChange={edit('deadlineTime', setDeadlineTime)}
        testID="deadline-time"
      />
      <PickerField label={t.goal}>
        <Picker<string> selectedValue={goal} onValueChange={edit('goal', setGoal)} testID="goal">
          {GOALS.map((option) => (
            <Picker.Item key={goalKey(option)} label={goalText(option)} value={goalKey(option)} />
          ))}
        </Picker>
      </PickerField>
      <ErrorMessage kind={error} />
      {saved && !edited ? (
        <ThemedText accessibilityLiveRegion="polite">{t.saved}</ThemedText>
      ) : null}
      <Button size="lg" title={t.submit} loading={saving} onPress={submit} />
    </View>
  );
}

type OtherStartProps = {
  label: string;
  fieldLabel: string;
  /** Null while the usual start time applies. */
  value: string | null;
  fallback: string;
  onChange: (time: string | null) => void;
  testID: string;
};

/** A switch for another start time on some days, and that time once switched on. */
function OtherStart({ label, fieldLabel, value, fallback, onChange, testID }: OtherStartProps) {
  return (
    <View className="gap-4">
      <Host matchContents={{ vertical: true }}>
        <Switch
          label={label}
          value={value !== null}
          onValueChange={(on) => onChange(on ? fallback : null)}
          testID={`${testID}-switch`}
        />
      </Host>
      {value === null ? null : (
        <TimePickerField
          label={fieldLabel}
          value={value}
          slots={START_SLOTS}
          onChange={onChange}
          testID={testID}
        />
      )}
    </View>
  );
}
