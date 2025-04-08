import {
  createContext,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "~/src/stores/auth";
import { useInstances, useLogin, useRefreshAuth } from "../lib/lemmy";
import fuzzysort from "fuzzysort";
import _ from "lodash";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { FlashList } from "./flashlist";

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

  const submitLogin = (e?: FormEvent) => {
    e?.preventDefault();
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
        setSearch("");
      });
  };

  useEffect(() => {
    if (mfaToken && mfaToken.length === 6) {
      submitLogin();
    }
  }, [mfaToken]);

  const numItems = sortedInstances
    ? sortedInstances.length
    : defaultSort.length;

  const modal = useRef<HTMLIonModalElement>(null);

  return (
    <IonModal isOpen={open} onDidDismiss={onClose} ref={modal}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              onClick={() => {
                if (instance.url) {
                  setInstanceLocal({});
                } else {
                  modal.current?.dismiss();
                }
              }}
            >
              Back
            </IonButton>
          </IonButtons>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {!instance.url ? (
          <div className="flex flex-col h-full">
            <IonHeader>Pick the server you created your account on</IonHeader>
            <IonInput
              placeholder="Enter URL or search for your server"
              fill="solid"
              // size="$4"
              // fontSize="$5"
              // flexShrink={0}
              // defaultValue={search}
              onIonInput={({ detail }) => setSearch(detail.value ?? "")}
              // autoCorrect={false}
              // autoCapitalize="none"
              // bc="$color3"
            />
            <FlashList
              estimatedItemSize={50}
              stickyHeaderIndices={[]}
              data={sortedInstances ?? defaultSort}
              renderItem={({ item: i }) => (
                <button
                  key={i.url}
                  // p={0}
                  // bg="transparent"
                  // h="auto"
                  // bbw={i.index < numItems - 1 ? 1 : 0}
                  // bbc="$color5"
                  // w="100%"
                  // br={0}
                  onClick={() => {
                    setInstanceLocal(i);
                    if (!addAccount) {
                      updateAccount({
                        instance: i.url,
                      });
                    }
                  }}
                  className="py-2.5 text-lg border-b w-full text-start border-zinc-300 dark:border-zinc-800"
                >
                  <span>{i.baseurl}</span>
                </button>
              )}
            />
          </div>
        ) : (
          <>
            <form
              // flexDirection="column"
              // alignItems="stretch"
              // width="100%"
              // gap="$4"
              onSubmit={submitLogin}
              className="gap-4 flex flex-col"
            >
              <span className="text-bold">
                You are logging in to {instance.baseurl}
              </span>

              <input
                placeholder="username"
                autoCapitalize="none"
                // autoCorrect={false}
                autoComplete="username"
                id="username"
                defaultValue={userName}
                onChange={(e) => setUsername(e.target.value)}
                // size="$4"
                // fontSize="$5"
                // bc="$color3"
              />

              <input
                placeholder="Enter password"
                autoComplete="password"
                type="password"
                // textContentType="password"
                // secureTextEntry
                id="password"
                defaultValue={password}
                onChange={(e) => setPassword(e.target.value)}
                // size="$4"
                // fontSize="$5"
                // bc="$color3"
              />

              {(login.needs2FA || _.isString(mfaToken)) && (
                <input
                  autoComplete="one-time-code"
                  placeholder="2FA"
                  defaultValue={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  // size="$4"
                  // fontSize="$5"
                  // bc="$color3"
                />
              )}

              <button
                // size="$4"
                // fontSize="$5"
                // bg="$accentColor"
                // color="white"
                // disabled={login.status === "pending"}
                // // onPress={signIn}
                // width="100%"
                // iconAfter={
                //       <Spinner
                //         color="$color"
                //         key="loading-spinner"
                //         opacity={1}
                //         scale={1}
                //         animation="quick"
                //         position="absolute"
                //         left="60%"
                //         enterStyle={{
                //           opacity: 0,
                //           scale: 0.5,
                //         }}
                //         exitStyle={{
                //           opacity: 0,
                //           scale: 0.5,
                //         }}
                //       />
                // }
                type="submit"
              >
                Sign In
              </button>
            </form>

            <button
              // fontSize="$5"
              // textAlign="center"
              onClick={() => {
                addAccountFn({
                  instance: instance.url,
                });
                setInstanceLocal({});
                onClose();
              }}
            >
              Continue as Guest
            </button>
          </>
        )}
      </IonContent>
    </IonModal>
  );
}
