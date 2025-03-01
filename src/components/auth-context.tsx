import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "~/src/stores/auth";
import {
  Form,
  AnimatePresence,
  Spinner,
  Button,
  YStack,
  Text,
  Input,
  isWeb,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInstances, useLogin, useRefreshAuth } from "../lib/lemmy";
import { Modal } from "./ui/modal";
import {
  FlatList,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { ChevronLeft } from "@tamagui/lucide-icons";
import fuzzysort from "fuzzysort";
import _ from "lodash";

const Context = createContext<{
  authenticate: (config?: { addAccount?: boolean }) => Promise<void>;
}>({
  authenticate: () => Promise.reject(),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const refreshAuth = useRefreshAuth();
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const jwt = useAuth((s) => s.getSelectedAccount().jwt);

  useEffect(() => {
    if (jwt) {
      refreshAuth.mutate();
    }
  }, [jwt]);

  const [promise, setPromise] = useState<{
    resolve: (value: void) => any;
    reject: () => any;
    addAccount?: boolean;
  }>();

  useEffect(() => {
    if (isLoggedIn && !promise?.addAccount) {
      promise?.resolve();
    }
  }, [isLoggedIn, promise]);

  const authenticate = useCallback(
    (config?: { addAccount?: boolean }) => {
      const addAccount = config?.addAccount === true;

      if (isLoggedIn && !addAccount) {
        return Promise.resolve();
      }

      const p = new Promise<void>((resolve, reject) => {
        setPromise({ resolve, reject, addAccount });
      });

      p.then(() => setPromise(undefined)).catch(() => setPromise(undefined));

      return p;
    },
    [isLoggedIn],
  );

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
        onSuccess={() => promise?.resolve()}
        addAccount={promise?.addAccount === true}
      />
    </Context.Provider>
  );
}

export function useRequireAuth() {
  return useContext(Context).authenticate;
}

function AuthModal({
  open,
  onClose,
  onSuccess,
  addAccount,
}: {
  open: boolean;
  onClose: () => any;
  onSuccess: () => any;
  addAccount: boolean;
}) {
  const [search, setSearch] = useState("");
  const [instance, setInstanceLocal] = useState<{
    url?: string;
    baseurl?: string;
  }>({});

  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState<string>();
  const login = useLogin({
    addAccount,
    instance: instance.url,
  });

  const instances = useInstances();

  const defaultSort = useMemo(
    () =>
      _.sortBy(instances.data, (i) => i.counts.users_active_month).toReversed(),
    [instances.data],
  );

  const sortedInstances =
    search && instances.data
      ? fuzzysort
          .go(search, instances.data, {
            keys: ["url", "name"],
            scoreFn: (r) => r.score * _.clamp(r.obj.score, 1, 10),
          })
          .map((r) => r.obj)
      : undefined;

  const updateAccount = useAuth((a) => a.updateAccount);
  const addAccountFn = useAuth((a) => a.addAccount);

  // const insets = useSafeAreaInsets();

  const windowDimensions = useWindowDimensions();

  const submitLogin = () => {
    login
      .mutateAsync({
        username_or_email: userName,
        password: password,
        totp_2fa_token: mfaToken,
      })
      .then(() => {
        onSuccess();
        setUsername("");
        setPassword("");
        setMfaToken(undefined);
        setInstanceLocal({});
      });
  };

  useEffect(() => {
    if (mfaToken && mfaToken.length === 6) {
      submitLogin();
    }
  }, [mfaToken]);

  return (
    <Modal open={open} onClose={onClose} scrollable={false}>
      <KeyboardAvoidingView behavior="padding">
        <YStack
          bg="$color2"
          p="$4"
          br="$4"
          gap="$3"
          $gtMd={{
            w: isWeb ? 400 : undefined,
          }}
          maxWidth="100%"
          height={windowDimensions.height / 2}
        >
          {!instance.url ? (
            <>
              <Text flexShrink={0}>
                Pick the server you created your account on
              </Text>
              <Input
                placeholder="Enter URL or search for your server"
                size="$3"
                flexShrink={0}
                // value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <FlatList
                data={sortedInstances ?? defaultSort}
                keyExtractor={(i) => i.url}
                renderItem={(i) => (
                  <Button p={0} bg="transparent" h="auto">
                    <Text
                      py="$2"
                      onPress={() => {
                        setInstanceLocal(i.item);
                        if (!addAccount) {
                          updateAccount({
                            instance: i.item.url,
                          });
                        }
                      }}
                      textAlign="left"
                      mr="auto"
                    >
                      {i.item.baseurl}
                    </Text>
                  </Button>
                )}
                style={{ maxHeight: 500 }}
              />
            </>
          ) : (
            <>
              <Form
                flexDirection="column"
                alignItems="stretch"
                width="100%"
                gap="$4"
                onSubmit={submitLogin}
              >
                <Button
                  onPress={() => setInstanceLocal({})}
                  p={0}
                  bg="transparent"
                  h="auto"
                  jc="flex-start"
                >
                  <ChevronLeft color="$accentColor" />
                  <Text color="$accentColor">Back</Text>
                </Button>

                <Text fontWeight="bold">
                  You are logging in to {instance.baseurl}
                </Text>

                <Input
                  id="email"
                  placeholder="email@example.com"
                  defaultValue={userName}
                  onChangeText={setUsername}
                />

                <Input
                  textContentType="password"
                  secureTextEntry
                  id="password"
                  placeholder="Enter password"
                  defaultValue={password}
                  onChangeText={setPassword}
                />

                {(login.needs2FA || _.isString(mfaToken)) && (
                  <Input
                    placeholder="2FA"
                    defaultValue={mfaToken}
                    onChangeText={setMfaToken}
                  />
                )}

                <Form.Trigger asChild>
                  <Button
                    bg="$accentColor"
                    disabled={login.status === "pending"}
                    // onPress={signIn}
                    width="100%"
                    iconAfter={
                      <AnimatePresence>
                        {login.status === "pending" && (
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
              </Form>

              <Button.Text
                textAlign="center"
                onPress={() => {
                  addAccountFn({
                    instance: instance.url,
                  });
                  setInstanceLocal({});
                  onClose();
                }}
              >
                Continue as Guest
              </Button.Text>
            </>
          )}
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
}
