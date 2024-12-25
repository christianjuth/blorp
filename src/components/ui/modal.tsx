import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dialog, Adapt, Sheet } from "tamagui";

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => any;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Dialog modal open={open} onOpenChange={onClose}>
      <Adapt when="sm" platform="touch">
        <Sheet
          animation="200ms"
          zIndex={200000}
          modal
          dismissOnSnapToBottom
          snapPointsMode="fit"
          moveOnKeyboardChange
        >
          <Sheet.Frame
            padding="$4"
            gap="$4"
            bg="$color1"
            $theme-dark={{
              bg: "$color3",
            }}
          >
            <Sheet.ScrollView pb={insets.bottom}>
              <Adapt.Contents />
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

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="200ms"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="black"
          opacity={0.4}
        />

        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={["transform", "opacity"]}
          animation={[
            "quicker",
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          bg="$color1"
          $theme-dark={{
            bg: "$color3",
          }}
          // w="100%"
          // maxWidth={400}
          p={0}
          bw={0}
        >
          {/* <Dialog.Title>Login</Dialog.Title> */}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
