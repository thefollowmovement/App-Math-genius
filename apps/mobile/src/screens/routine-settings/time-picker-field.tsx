import { Picker } from '@expo/ui';

import { PickerField } from '@/components/picker-field';

type TimePickerFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  /** Times on offer ("HH:MM"); the current value is always one of them. */
  slots: readonly string[];
  onChange: (time: string) => void;
  testID?: string;
};

export function TimePickerField({
  value,
  slots,
  onChange,
  testID,
  ...field
}: TimePickerFieldProps) {
  const options = slots.includes(value) ? slots : [...slots, value].sort();
  return (
    <PickerField {...field}>
      <Picker<string> selectedValue={value} onValueChange={onChange} testID={testID}>
        {options.map((time) => (
          <Picker.Item key={time} label={time} value={time} />
        ))}
      </Picker>
    </PickerField>
  );
}
