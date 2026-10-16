import { Picker } from '@expo/ui';
import { GENDERS, GRADES, childProfileSchema, type ChildProfile } from '@math-genius/shared';
import { Button, Screen, TextField } from '@math-genius/ui';
import { useState } from 'react';

import { ErrorMessage } from '@/components/error-message';
import { PickerField } from '@/components/picker-field';
import type { ErrorKind } from '@/data/errors';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { strings } from '@/i18n';
import { plausibleBirthYears } from '@/utils/birth-years';

const t = strings.childForm;
const NOT_CHOSEN = '';

type ChildFormProps = {
  onSubmit: (profile: ChildProfile) => void;
  submitting: boolean;
  error: ErrorKind | null;
  /** Current year, for the birth years on offer. */
  currentYear: number;
};

export function ChildForm({ onSubmit, submitting, error, currentYear }: ChildFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<string>(NOT_CHOSEN);
  const [grade, setGrade] = useState<string>(NOT_CHOSEN);
  const [birthYear, setBirthYear] = useState<string | number>(NOT_CHOSEN);
  const errors = useFieldErrors();

  function submit() {
    const result = childProfileSchema.safeParse({
      displayName,
      gender,
      grade,
      birthYear: birthYear === NOT_CHOSEN ? null : birthYear,
    });
    if (!result.success) return errors.report(result.error.issues);
    errors.reset();
    onSubmit(result.data);
  }

  return (
    <Screen>
      <TextField
        label={t.displayName}
        hint={t.displayNameHint}
        value={displayName}
        onChangeText={errors.onEdit('displayName', setDisplayName)}
        autoComplete="off"
        maxLength={30}
        error={errors.has('displayName') ? t.errors.displayName : undefined}
      />
      <PickerField
        label={t.gender}
        hint={t.genderHint}
        error={errors.has('gender') ? t.errors.gender : undefined}
      >
        <Picker<string>
          selectedValue={gender}
          onValueChange={errors.onEdit('gender', setGender)}
          testID="gender"
        >
          <Picker.Item label={t.choose} value={NOT_CHOSEN} />
          {GENDERS.map((value) => (
            <Picker.Item key={value} label={strings.genders[value]} value={value} />
          ))}
        </Picker>
      </PickerField>
      <PickerField label={t.grade} error={errors.has('grade') ? t.errors.grade : undefined}>
        <Picker<string>
          selectedValue={grade}
          onValueChange={errors.onEdit('grade', setGrade)}
          testID="grade"
        >
          <Picker.Item label={t.choose} value={NOT_CHOSEN} />
          {GRADES.map((value) => (
            <Picker.Item key={value} label={strings.grades[value]} value={value} />
          ))}
        </Picker>
      </PickerField>
      <PickerField label={t.birthYear}>
        <Picker<string | number>
          selectedValue={birthYear}
          onValueChange={setBirthYear}
          testID="birth-year"
        >
          <Picker.Item label={t.notProvided} value={NOT_CHOSEN} />
          {plausibleBirthYears(currentYear).map((year) => (
            <Picker.Item key={year} label={String(year)} value={year} />
          ))}
        </Picker>
      </PickerField>
      <ErrorMessage kind={error} />
      <Button size="lg" title={t.submit} loading={submitting} onPress={submit} />
    </Screen>
  );
}
