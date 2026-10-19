// Stand-in for @expo/ui in Jest, where its SwiftUI and Compose views do not exist.
// Same props as the universal components used by the app, rendered with accessible primitives.
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export function Host({ children }: { children?: ReactNode }) {
  return <View>{children}</View>;
}

export function Checkbox({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}

export function Switch({
  value,
  onValueChange,
  label,
  testID,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      testID={testID}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}

type ItemProps = { label: string; value: string | number };

function PickerItem(_props: ItemProps): null {
  return null;
}

function PickerBase({
  selectedValue,
  onValueChange,
  children,
  testID,
}: {
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  children?: ReactNode;
  testID?: string;
}) {
  const items = Children.toArray(children).filter(
    (child): child is ReactElement<ItemProps> => isValidElement(child) && child.type === PickerItem,
  );
  return (
    <View testID={testID} accessibilityRole="radiogroup">
      {items.map(({ props }) => (
        <Pressable
          key={String(props.value)}
          accessibilityRole="radio"
          accessibilityLabel={props.label}
          accessibilityState={{ selected: props.value === selectedValue }}
          onPress={() => onValueChange(props.value)}
        >
          <Text>{props.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const Picker = Object.assign(PickerBase, { Item: PickerItem });
