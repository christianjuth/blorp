import { useState, createContext, useContext } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Adapt, Popover, Sheet, PopoverProps, View } from "tamagui";

export function Dropdown({
  children,
  trigger,
  placement,
}: {
  children: (config: { close: () => any }) => React.ReactNode;
  trigger: React.ReactNode;
  placement: PopoverProps["placement"];
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <Popover
      size="$5"
      allowFlip
      offset={0}
      placement={placement}
      open={open}
      onOpenChange={setOpen}
    >
      <Popover.Trigger>{trigger}</Popover.Trigger>

      <Adapt when="sm" platform="touch">
        <Sheet
          native
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
          <Sheet.Frame
            bg="$color1"
            $theme-dark={{
              bg: "$color3",
            }}
          >
            <Sheet.ScrollView pb={insets.bottom}>
              {/* <Adapt.Contents /> */}
              {children({ close })}
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay
            animation="100ms"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="rgba(0,0,0,0.4)"
          />
        </Sheet>
      </Adapt>

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
        {children({ close })}
      </Popover.Content>
    </Popover>
  );
}
