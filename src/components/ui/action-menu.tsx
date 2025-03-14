import { useState } from "react";
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
  danger?: boolean;
};

export function ActionMenu<L extends string>({
  actions,
  trigger,
  placement,
  onOpenChange,
}: {
  actions: Action<L>[];
  trigger: React.ReactNode;
  placement: PopoverProps["placement"];
  onOpenChange?: (open: boolean) => any;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const contents = (
    <YStack>
      {actions.map((a) => (
        <Button
          key={a.label}
          $gtMd={{
            size: "$3",
          }}
          onPress={() => {
            setOpen(false);
            requestAnimationFrame(() => {
              a.onClick();
            });
          }}
          bg="transparent"
        >
          <Text mr="auto" color={a.danger ? "$red" : "$color"}>
            {a.label}
          </Text>
        </Button>
      ))}
    </YStack>
  );

  return (
    <Popover
      size="$5"
      allowFlip
      offset={0}
      placement={placement}
      open={open}
      onOpenChange={(open) => {
        onOpenChange?.(open);
        setOpen(open);
      }}
    >
      <Popover.Trigger onPress={() => setOpen(true)}>{trigger}</Popover.Trigger>

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
          native
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
            animation="quick"
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
