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
import { Account, useAuth } from "@/src/stores/auth";
import { useInstances, useLogin, useRefreshAuth } from "../lib/lemmy";
import fuzzysort from "fuzzysort";
import _, { debounce } from "lodash";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { VirtualList } from "./virtual-list";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./ui/input-otp";
import { LuLoaderCircle } from "react-icons/lu";
import { Browser } from "@capacitor/browser";

const Context = createContext<{
  authenticate: (config?: { addAccount?: boolean }) => Promise<void>;
}>({
  authenticate: () => Promise.reject(),
});

function RefreshAccount({
  account,
  signal,
}: {
  account: Account;
  signal: number;
}) {
  const refresh = useRefreshAuth(account);
  useEffect(() => {
    if (!account.jwt) {
      return;
    }
    refresh.mutate();
  }, [account.jwt, signal]);
  return null;
}

export function RefreshAccounts() {
  const accounts = useAuth((s) => s.accounts);
  const [signal, setSignal] = useState(0);
  useEffect(() => {
    const debouncedSignal = _.debounce(() => setSignal((s) => s + 1), 50);
    const visibilityHanlder = () => {
      if (!document.hidden) {
        debouncedSignal();
      }
    };
    document.addEventListener("visibilitychange", visibilityHanlder);
    window.addEventListener("focus", debouncedSignal);
    Browser.addListener("browserFinished", debouncedSignal);
    return () => {
      debouncedSignal.cancel();
      document.removeEventListener("visibilitychange", debouncedSignal);
      window.removeEventListener("focus", debouncedSignal);
    };
  }, []);
  return (
    <>
      {accounts.map((a, i) => (
        <RefreshAccount key={i + a.instance} account={a} signal={signal} />
      ))}
    </>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

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
      <RefreshAccounts />
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
      _.reverse(_.sortBy(instances.data, (i) => i.counts.users_active_month)),
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

  const updateSelectedAccount = useAuth((a) => a.updateSelectedAccount);
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
              {instance.baseurl ? "Back" : "Close"}
            </IonButton>
          </IonButtons>
          <IonTitle>{instance.baseurl ? instance.baseurl : "Login"}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {!instance.url ? (
          <div className="flex flex-col h-full">
            <VirtualList
              className="px-4"
              estimatedItemSize={50}
              stickyHeaderIndices={[0]}
              data={sortedInstances ?? defaultSort}
              header={[
                <div className="bg-background py-3 border-b-[.5px]">
                  <IonHeader className="mb-2">
                    Pick the server you created your account on
                  </IonHeader>
                  <Input
                    placeholder="Enter URL or search for your server"
                    defaultValue={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>,
              ]}
              renderItem={({ item: i }) => (
                <button
                  key={i.url}
                  onClick={() => {
                    setInstanceLocal(i);
                    if (!addAccount) {
                      updateSelectedAccount({
                        instance: i.url,
                      });
                    }
                  }}
                  className="py-2.5 text-lg border-b-[.5px] w-full text-start"
                >
                  <span>{i.baseurl}</span>
                </button>
              )}
            />
          </div>
        ) : (
          <>
            <form onSubmit={submitLogin} className="gap-4 flex flex-col p-4">
              <Input
                placeholder="username"
                id="username"
                defaultValue={userName}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />

              <Input
                placeholder="Enter password"
                type="password"
                id="password"
                defaultValue={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />

              {(login.needs2FA || _.isString(mfaToken)) && (
                <InputOTP
                  maxLength={6}
                  defaultValue={mfaToken}
                  onChange={(newVal) => setMfaToken(newVal)}
                  autoComplete="one-time-code"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              )}

              <Button type="submit" className="mx-auto">
                Sign In
                {login.isPending && <LuLoaderCircle className="animate-spin" />}
              </Button>

              <Button
                type="button"
                className="mx-auto"
                variant="ghost"
                onClick={() => {
                  addAccountFn({
                    instance: instance.url,
                  });
                  setInstanceLocal({});
                  onClose();
                }}
              >
                Continue as Guest
              </Button>

              <span className="mx-auto text-muted-foreground text-sm">
                By logging in you agree to{" "}
                <a
                  className="underline"
                  href="https://blorpblorp.xyz/terms"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  these terms
                </a>
              </span>
            </form>
          </>
        )}
      </IonContent>
    </IonModal>
  );
}
