import { Adapt, Button, Popover, YStack } from "tamagui";

export type Action<V, L = string> = {
  label: L;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  onClick: () => void;
};

export function ActionMenu<L extends string>({
  actions,
  trigger,
}: {
  actions: Action<L>[];
  trigger: React.ReactNode;
}) {
  return (
    <Popover size="$5" allowFlip offset={0} placement="bottom-end">
      <Popover.Trigger>{trigger}</Popover.Trigger>

      <Adapt when="sm" platform="touch">
        <Popover.Sheet modal dismissOnSnapToBottom snapPointsMode="fit">
          <Popover.Sheet.Frame padding="$4">
            <Adapt.Contents />
          </Popover.Sheet.Frame>
          <Popover.Sheet.Overlay
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="black"
            opacity={0.4}
          />
        </Popover.Sheet>
      </Adapt>

      <Popover.Content borderWidth={1} borderColor="$borderColor" p={0} elevate>
        <YStack>
          {actions.map((a) => (
            <Popover.Close asChild key={a.label}>
              <Button size="$3" onPress={a.onClick}>
                {a.label}
              </Button>
            </Popover.Close>
          ))}
        </YStack>
      </Popover.Content>
    </Popover>
  );
}
