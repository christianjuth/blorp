import { useState } from "react";
import { XStack, Text } from "tamagui";

export type Option<V, L = string> = {
  label: L;
  value: V;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
};

export interface ToggleGroupProps<V extends string> {
  options: Option<V>[];
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
}

export function ToggleGroup<V extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
}: ToggleGroupProps<V>) {
  const [localValue, setLocalValue] = useState<V>(
    defaultValue ?? options[0]?.value,
  );
  value = value ?? localValue;

  return (
    <XStack>
      {options.map((opt) => (
        <Text
          key={opt.value}
          py="$2"
          px="$3"
          bg={value === opt.value ? "$color4" : undefined}
          br={99999}
          onPress={() => {
            setLocalValue(opt.value);
            onValueChange?.(opt.value);
          }}
          tag="button"
        >
          {opt.label}
        </Text>
      ))}
    </XStack>
  );
}
