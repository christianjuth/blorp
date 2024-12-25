import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "~/src/stores/auth";
import {
  Dialog,
  Adapt,
  Sheet,
  View,
  Form,
  AnimatePresence,
  Spinner,
  Button,
  YStack,
} from "tamagui";
import { useLogin } from "../lib/lemmy";
import { Input } from "~/src/components/ui/input";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Context = createContext<{
  authenticate: () => Promise<void>;
}>({
  authenticate: () => new Promise((_, reject) => reject()),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const jwt = useAuth((s) => s.jwt);
  const [promise, setPromise] = useState<{
    resolve: (value: void) => any;
    reject: () => any;
  }>();

  useEffect(() => {
    if (jwt) {
      promise?.resolve();
    }
  }, [jwt, promise]);

  const authenticate = useCallback(() => {
    const p = new Promise<void>((resolve, reject) => {
      if (jwt) {
        resolve();
      }
      setPromise({ resolve, reject });
    });

    p.then(() => setPromise(undefined)).catch(() => setPromise(undefined));

    return p;
  }, [jwt]);

  return (
    <Context.Provider
      value={{
        authenticate,
      }}
    >
      {children}
      <AuthModal
        open={promise !== undefined}
        onClose={() => promise?.reject()}
      />
    </Context.Provider>
  );
}

export function useRequireAuth() {
  return useContext(Context).authenticate;
}

function AuthModal({ open, onClose }: { open: boolean; onClose: () => any }) {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutate, status } = useLogin();

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
          gap="$4"
          bg="$color1"
          $theme-dark={{
            bg: "$color3",
          }}
          w="100%"
          maxWidth={400}
        >
          {/* <Dialog.Title>Login</Dialog.Title> */}

          <Form
            onSubmit={() => {
              mutate({
                username_or_email: userName,
                password: password,
              });
            }}
          >
            <YStack flexDirection="column" gap="$3">
              <Input size="$4">
                <Input.Label htmlFor="email">Email</Input.Label>
                <Input.Box>
                  <Input.Area
                    id="email"
                    placeholder="email@example.com"
                    value={userName}
                    onChangeText={setUsername}
                  />
                </Input.Box>
              </Input>
              <View flexDirection="column" gap="$1">
                <Input size="$4">
                  <View
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Input.Label htmlFor="password">Password</Input.Label>
                    {/* <ForgotPasswordLink /> */}
                  </View>
                  <Input.Box>
                    <Input.Area
                      textContentType="password"
                      secureTextEntry
                      id="password"
                      placeholder="Enter password"
                      value={password}
                      onChangeText={setPassword}
                    />
                  </Input.Box>
                </Input>
              </View>

              <Form.Trigger asChild>
                <Button
                  disabled={status === "pending"}
                  width="100%"
                  iconAfter={
                    <AnimatePresence>
                      {status === "pending" && (
                        <Spinner
                          color="$color"
                          key="loading-spinner"
                          opacity={1}
                          scale={1}
                          animation="quick"
                          position="absolute"
                          left="60%"
                          enterStyle={{
                            opacity: 0,
                            scale: 0.5,
                          }}
                          exitStyle={{
                            opacity: 0,
                            scale: 0.5,
                          }}
                        />
                      )}
                    </AnimatePresence>
                  }
                >
                  <Button.Text>Sign In</Button.Text>
                </Button>
              </Form.Trigger>
            </YStack>
          </Form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
