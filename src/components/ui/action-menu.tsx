import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Adapt,
  Button,
  Popover,
  Sheet,
  YStack,
  Text,
  PopoverProps,
} from "tamagui";

export type Action<L = string> = {
  label: L;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  onClick: () => void;
};

export function ActionMenu<L extends string>({
  actions,
  trigger,
  placement,
}: {
  actions: Action<L>[];
  trigger: React.ReactNode;
  placement: PopoverProps["placement"];
}) {
  const insets = useSafeAreaInsets();

  const contents = (
    <YStack>
      {actions.map((a) => (
        <Popover.Close asChild key={a.label} bg="transparent">
          <Button
            $gtMd={{
              size: "$3",
            }}
            onPress={a.onClick}
            bg="transparent"
          >
            <Text mr="auto">{a.label}</Text>
          </Button>
        </Popover.Close>
      ))}
    </YStack>
  );

  return (
    <Popover size="$5" allowFlip offset={0} placement={placement}>
      <Popover.Trigger>{trigger}</Popover.Trigger>

      <Popover.Content
        borderWidth={1}
        borderColor="$borderColor"
        p={0}
        elevate
        bg="$color1"
        $theme-dark={{
          bg: "$color3",
        }}
      >
        {contents}
      </Popover.Content>

      <Adapt when="sm" platform="touch">
        <Popover.Sheet
          // native
          // native={!!props.native}
          modal
          dismissOnSnapToBottom
          animationConfig={{
            type: "spring",
            damping: 20,
            mass: 1.2,
            stiffness: 250,
          }}
          snapPointsMode="fit"
        >
          <Popover.Sheet.Overlay
            animation="100ms"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="rgba(0,0,0,0.4)"
          />
          <Popover.Sheet.Frame
            bg="$color1"
            $theme-dark={{
              bg: "$color3",
            }}
          >
            <Popover.Sheet.ScrollView pb={insets.bottom}>
              {/* <Adapt.Contents /> */}
              {contents}
            </Popover.Sheet.ScrollView>
          </Popover.Sheet.Frame>
        </Popover.Sheet>
      </Adapt>
    </Popover>
  );
}
