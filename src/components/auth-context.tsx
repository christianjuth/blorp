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
import {
  useCaptcha,
  useInstances,
  useLogin,
  useRefreshAuth,
  useRegister,
} from "../lib/lemmy";
import fuzzysort from "fuzzysort";
import _ from "lodash";
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
import { FaPlay, FaPause } from "react-icons/fa";
import { MdOutlineRefresh } from "react-icons/md";
import { Textarea } from "./ui/textarea";
import { MarkdownRenderer } from "./markdown/renderer";
import { env } from "../env";

const LEMM_EE = "https://lemm.ee";

const AudioPlayButton = ({ src }: { src: string }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(new Audio(`data:audio/wav;base64,${src}`));

  useEffect(() => {
    const start = () => setPlaying(true);
    const stop = () => setPlaying(false);

    audioRef.current.addEventListener("play", start);
    audioRef.current.addEventListener("ended", stop);
    audioRef.current.addEventListener("pause", stop);

    return () => {
      audioRef.current.removeEventListener("play", start);
      audioRef.current.removeEventListener("ended", stop);
      audioRef.current.removeEventListener("pause", stop);
    };
  }, []);

  const handlePlay = () => {
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else {
      audioRef.current.play();
    }
  };

  return (
    <button type="button" onClick={handlePlay}>
      {playing ? <FaPause /> : <FaPlay />}
    </button>
  );
};

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

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const captcha = useCaptcha({
    instance: LEMM_EE,
  });

  const [email, setEmail] = useState("");
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [answer, setAnswer] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const register = useRegister({
    addAccount: true,
    instance: LEMM_EE,
  });

  const submitLogin = (e?: FormEvent) => {
    e?.preventDefault();
    register
      .mutateAsync({
        email,
        username: userName,
        password: password,
        password_verify: verifyPassword,
        captcha_uuid: captcha.data?.ok?.uuid,
        captcha_answer: captchaAnswer,
        answer,
      })
      .then(() => {
        onSuccess();
        setEmail("");
        setUsername("");
        setPassword("");
        setVerifyPassword("");
        setAnswer("");
        setCaptchaAnswer("");
      });
  };

  return (
    <form onSubmit={submitLogin} className="gap-4 flex flex-col p-4">
      <Input
        placeholder="Email"
        id="email"
        defaultValue={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
      />

      <Input
        placeholder="Username"
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

      <Input
        placeholder="Verify password"
        type="password"
        id="password"
        defaultValue={verifyPassword}
        onChange={(e) => setVerifyPassword(e.target.value)}
        autoComplete="current-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
      />

      {captcha.isPending && <LuLoaderCircle className="animate-spin" />}

      {captcha.data?.ok && (
        <div className="flex flex-row gap-4">
          <div className="flex flex-col justify-around items-center p-2">
            <button onClick={() => captcha.refetch()}>
              <MdOutlineRefresh size={24} />
            </button>

            <AudioPlayButton src={captcha.data.ok.wav} />
          </div>

          <img
            src={`data:image/png;base64,${captcha.data?.ok?.png}`}
            className="h-28 aspect-video object-contain"
          />

          <Input
            className="self-center"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
          />
        </div>
      )}

      <MarkdownRenderer
        markdown={[
          "Before you finish your registration, please read through the instance sidebar on our front page (https://lemm.ee). In the sidebar, please pay particular attention to the instance rules - they are important.",
          "",
          "Do you agree to follow lemm.ee instance rules?",
          "Please write your answer in English.",
        ].join("\n")}
      />

      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} />

      <Button type="submit" className="mx-auto">
        Sign up
        {register.isPending && <LuLoaderCircle className="animate-spin" />}
      </Button>

      <span className="mx-auto text-muted-foreground text-sm">
        By logging in you agree to{" "}
        <a
          className="underline"
          href="https://blorpblorp.xyz/terms"
          target="_blank"
          rel="noreferrer noopener"
        >
          {env.REACT_APP_NAME}'s terms
        </a>
      </span>
    </form>
  );
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
  const [signup, setSignup] = useState(false);

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

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setMfaToken(undefined);
    setInstanceLocal({});
    setSearch("");
  };

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
        resetForm();
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
                  setSignup(false);
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
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                if (!signup) {
                  setInstanceLocal({
                    url: "https://lemm.ee",
                    baseurl: "lemm.ee",
                  });
                }
                setSignup((b) => !b);
              }}
            >
              {signup ? "Login" : "Sign up"}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {signup && (
          <SignupForm
            onSuccess={() => {
              onSuccess();
              resetForm();
            }}
          />
        )}

        {!signup && !instance.url && (
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
        )}

        {!signup && !!instance.url && (
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
                  {env.REACT_APP_NAME}'s terms
                </a>
              </span>
            </form>
          </>
        )}
      </IonContent>
    </IonModal>
  );
}
