import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Adapt, Popover, Sheet, PopoverProps } from "tamagui";

export function Dropdown({
  children,
  trigger,
  placement,
}: {
  children: React.ReactNode;
  trigger: React.ReactNode;
  placement: PopoverProps["placement"];
}) {
  const insets = useSafeAreaInsets();
  return (
    <Popover size="$5" allowFlip offset={0} placement={placement}>
      <Popover.Trigger>{trigger}</Popover.Trigger>

      <Adapt when="sm" platform="touch">
        <Sheet
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
              {children}
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay
            // animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="black"
            opacity={0.4}
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
        {children}
      </Popover.Content>
    </Popover>
  );
}

Dropdown.Close = Popover.Close;
