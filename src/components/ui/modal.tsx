import { KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dialog, Adapt, Sheet } from "tamagui";

export function Modal({
  open,
  onClose,
  children,
  scrollable = true,
}: {
  open: boolean;
  onClose: () => any;
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Dialog modal open={open} onOpenChange={onClose}>
      <Adapt platform="touch">
        <Sheet
          animation="200ms"
          zIndex={200000}
          modal
          dismissOnSnapToBottom
          snapPointsMode="fit"
          moveOnKeyboardChange
        >
          <Sheet.Frame
            // padding="$4"
            gap="$4"
            bg="$color1"
            $theme-dark={{
              bg: "$color3",
            }}
            $gtMd={{
              w: "50%",
              transform: [
                {
                  translateX: "50%",
                },
              ],
            }}
          >
            {scrollable ? (
              <Sheet.ScrollView pb={insets.bottom}>
                <Adapt.Contents />
              </Sheet.ScrollView>
            ) : (
              <Adapt.Contents />
            )}
          </Sheet.Frame>
          <Sheet.Overlay
            animation="100ms"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="rgba(0,0,0,0.4)"
          />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="100ms"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.4)"
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
