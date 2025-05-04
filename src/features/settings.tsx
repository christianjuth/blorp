import { useEffect, useId, useRef, useState } from "react";
import { useSettingsStore } from "@/src/stores/settings";
import { useDeleteAccount, useLogout } from "@/src/lib/lemmy/index";
import { Account, parseAccountInfo, useAuth } from "@/src/stores/auth";
import { useRequireAuth } from "@/src/components/auth-context";
import { ContentGutters } from "@/src/components/gutters";
import _ from "lodash";
import { Logo } from "@/src/components/logo";
import pkgJson from "@/package.json";
import { getDbSizes } from "@/src/lib/create-storage";
import { close } from "ionicons/icons";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonAlert,
} from "@ionic/react";
import { UserDropdown } from "../components/nav";
import { Title } from "../components/title";
import { PersonCard } from "../components/person/person-card";
import { Deferred } from "../lib/deferred";
import { createSlug } from "../lib/lemmy/utils";
import { cn } from "../lib/utils";
import z from "zod";
import { KeyboardAvoidingView } from "../components/keyboard-avoiding-view";

const deleteAccountFormSchema = z.object({
  password: z.string(),
});

const version =
  _.isObject(pkgJson) && "version" in pkgJson ? pkgJson.version : undefined;

function SectionLabel({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={cn("text-sm text-muted-foreground mt-4", className)}>
      {children}
    </span>
  );
}

function AccountCard({
  account,
  accountIndex,
}: {
  account: Account;
  accountIndex: number;
}) {
  const modalTriggerId = useId();
  const modal = useRef<HTMLIonModalElement>(null);

  const [alrt] = useIonAlert();
  const requireAuth = useRequireAuth();
  const logout = useLogout();
  const { person, instance } = parseAccountInfo(account);
  const isLoggedIn = Boolean(account.jwt);
  const deleteAccount = useDeleteAccount();

  return (
    <>
      <SectionLabel>{`ACCOUNT ${accountIndex + 1}`}</SectionLabel>
      <IonList inset>
        {person && (
          <IonItem>
            <PersonCard actorId={person.actor_id} className="my-2" />
          </IonItem>
        )}

        {isLoggedIn && (
          <IonItem
            button
            id={modalTriggerId}
            detail={false}
            className="text-brand"
          >
            Manage account
          </IonItem>
        )}
        <IonItem
          button
          detail={false}
          className="text-brand"
          onClick={() => {
            if (isLoggedIn && person) {
              const deferred = new Deferred();
              alrt({
                message: `Are you sure you want to logout of ${createSlug(person)?.slug ?? "this account"}`,
                buttons: [
                  {
                    text: "Cancel",
                    role: "cancel",
                    handler: () => deferred.reject(),
                  },
                  {
                    text: "OK",
                    role: "confirm",
                    handler: () => deferred.resolve(),
                  },
                ],
              });
              deferred.promise.then(() => logout(accountIndex));
            } else {
              requireAuth();
            }
          }}
        >
          {[
            isLoggedIn ? "Logout" : accountIndex > 0 ? "Remove" : "Login",
            person
              ? `${person.display_name ?? person.name}@${instance}`
              : accountIndex > 0
                ? instance
                : null,
          ]
            .filter(Boolean)
            .join(" ")}
        </IonItem>
      </IonList>

      {person && (
        <IonModal ref={modal} trigger={modalTriggerId}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => modal.current?.dismiss()}>
                  Close
                </IonButton>
              </IonButtons>
              <IonTitle>{createSlug(person)?.slug ?? person.name}</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="flex-1 gap-2 flex flex-col">
              <SectionLabel className="text-destructive">
                DANGER ZONE
              </SectionLabel>
              <IonList inset>
                <IonItem
                  button
                  onClick={() => {
                    alrt({
                      header: "Delete account",
                      subHeader:
                        "Enter your account password to confirm deletion.",
                      inputs: [
                        {
                          name: "password",
                          placeholder: "Password",
                          type: "password",
                        },
                      ],
                      buttons: [
                        {
                          text: "Cancel",
                          role: "cancel",
                        },
                        {
                          text: "Delete",
                          role: "destructive",
                          handler: (form) => {
                            const { data } =
                              deleteAccountFormSchema.safeParse(form);
                            if (data) {
                              deleteAccount
                                .mutateAsync({
                                  account,
                                  form: {
                                    password: data.password,
                                    delete_content: false,
                                  },
                                })
                                .then(() => modal.current?.dismiss());
                            }
                          },
                        },
                      ],
                    });
                  }}
                >
                  Delete account
                </IonItem>
                <IonItem
                  button
                  onClick={() => {
                    alrt({
                      header: "Delete account and content",
                      subHeader:
                        "Enter your account password to confirm deletion.",
                      inputs: [
                        {
                          name: "password",
                          placeholder: "Password",
                          type: "password",
                        },
                      ],
                      buttons: [
                        {
                          text: "Cancel",
                          role: "cancel",
                        },
                        {
                          text: "Delete",
                          role: "destructive",
                          handler: (form) => {
                            const { data } =
                              deleteAccountFormSchema.safeParse(form);
                            if (data) {
                              deleteAccount
                                .mutateAsync({
                                  account,
                                  form: {
                                    password: data.password,
                                    delete_content: true,
                                  },
                                })
                                .then(() => modal.current?.dismiss());
                            }
                          },
                        },
                      ],
                    });
                  }}
                >
                  Delete account and content
                </IonItem>
              </IonList>
            </div>
          </IonContent>
        </IonModal>
      )}
    </>
  );
}

function AccountSection() {
  const accounts = useAuth((s) => s.accounts);
  return (
    <>
      {accounts.map((a, index) => {
        const { instance } = parseAccountInfo(a);
        return (
          <AccountCard
            key={instance + index}
            accountIndex={index}
            account={a}
            //onClick={() => {
            //  if (isLoggedIn || index > 0) {
            //    logout(index);
            //  } else {
            //    requireAuth();
            //  }
            //}}
          />
        );
      })}
    </>
  );
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024); // Convert bytes to MB
  return `${mb.toFixed(2)} MB`; // Round to 2 decimal places
}

function CacheSection() {
  const settings = useSettingsStore();

  const [signal, setSignal] = useState(0);

  const focused = true;

  const [cacheSizes, setCacheSizes] = useState<Readonly<[string, number]>[]>(
    [],
  );

  useEffect(() => {
    if (focused) {
      getDbSizes().then(setCacheSizes);
    }
  }, [signal, focused]);

  const refreshCacheSizes = () => {
    setSignal((s) => s + 1);
  };

  const totalSize = cacheSizes.reduce((acc, [_, size]) => acc + size, 0);

  return (
    <>
      <SectionLabel>STORAGE</SectionLabel>

      <IonList inset>
        <IonItem>
          <div className="py-2.5 flex-1 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              Cache {formatSize(totalSize)}
              {settings.cacheImages ? " (excludes images)" : ""}
            </span>

            {totalSize > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-row flex-1 gap-px rounded-md overflow-hidden">
                  {cacheSizes.map(([key, size], index) => (
                    <div
                      key={key}
                      style={{
                        width: `${(size / totalSize) * 100}%`,
                        opacity:
                          (cacheSizes.length - index) / cacheSizes.length,
                      }}
                      className="h-6 bg-brand"
                    />
                  ))}
                </div>

                <div className="flex flex-row flex-wrap items-center gap-2">
                  {cacheSizes.map(([key], index) => (
                    <div key={key} className="flex flex-row gap-1 items-center">
                      <div
                        className="h-3 w-3 bg-brand rounded-full"
                        style={{
                          opacity:
                            (cacheSizes.length - index) / cacheSizes.length,
                        }}
                      />
                      <span className="capitalize text-sm text-muted-foreground">
                        {key.split("_")[1]?.replaceAll("-", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* <Divider /> */}

            {/* <SettingsButton */}
            {/*   onClick={() => { */}
            {/*     alrt("Clear data cache?").then(async () => { */}
            {/*       try { */}
            {/*         queryClient.clear(); */}
            {/*       } catch (err) {} */}
            {/*       try { */}
            {/*         queryClient.invalidateQueries(); */}
            {/*       } catch (err) {} */}
            {/*       refreshCacheSizes(); */}
            {/*     }); */}
            {/*   }} */}
            {/* > */}
            {/*   Clear data cache */}
            {/* </SettingsButton> */}
          </div>
        </IonItem>
      </IonList>
    </>
  );
}

function Divider() {
  return <div />;
}

export default function SettingsPage() {
  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    if (logoClicks >= 10) {
      window.location.reload();
      setLogoClicks(0);
    }
  }, [logoClicks]);

  //const showNsfw = useSettingsStore((s) => s.showNsfw);
  //const setShowNsfw = useSettingsStore((s) => s.setShowNsfw);

  const hideRead = useSettingsStore((s) => s.hideRead);
  const setHideRead = useSettingsStore((s) => s.setHideRead);

  const filterKeywords = useSettingsStore((s) => s.filterKeywords);
  const setFilterKeywords = useSettingsStore((s) => s.setFilterKeywords);
  const pruneFiltersKeywords = useSettingsStore((s) => s.pruneFiltersKeywords);

  const keywords = [...filterKeywords, ""];

  return (
    <IonPage>
      <Title>Settings</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonTitle data-tauri-drag-region>Settings</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true} scrollY={false}>
        <KeyboardAvoidingView>
          <ContentGutters className="pt-4 pb-8 max-md:px-2.5">
            <div className="flex-1 gap-2 flex flex-col">
              <AccountSection />

              <SectionLabel>GLOBAL FILTERS</SectionLabel>

              <IonList inset>
                <IonItem>
                  <IonToggle
                    checked={hideRead}
                    onIonChange={(e) => setHideRead(e.detail.checked)}
                  >
                    Hide read posts from feeds
                  </IonToggle>
                </IonItem>
                {/* 
                This should be set at the account level,
                and iOS requores that this is done outside of the app.
              <IonItem>
                <IonToggle
                  checked={showNsfw}
                  onIonChange={(e) => setShowNsfw(e.detail.checked)}
                >
                  Show NSFW
                </IonToggle>
              </IonItem>*/}
              </IonList>

              <SectionLabel>GLOBAL KEYWORD FILTERS</SectionLabel>

              <IonList inset>
                {keywords.map((keyword, index) => (
                  <IonItem key={index}>
                    {index > 0 && <Divider />}
                    <IonInput
                      value={keyword}
                      onIonChange={(e) =>
                        setFilterKeywords({
                          index,
                          keyword: e.detail.value ?? "",
                        })
                      }
                      onIonBlur={() => {
                        pruneFiltersKeywords();
                      }}
                      placeholder="Keyword to filter..."
                    />
                  </IonItem>
                ))}
              </IonList>

              <CacheSection />

              <SectionLabel>OTHER</SectionLabel>

              <IonList inset>
                <IonItem
                  href="https://github.com/christianjuth/blorp/releases"
                  target="_blank"
                  detail={false}
                  className="text-brand"
                >
                  What's new
                </IonItem>
                <IonItem
                  href="https://github.com/christianjuth/blorp/issues/new"
                  target="_blank"
                  detail={false}
                  className="text-brand"
                >
                  Report issue
                </IonItem>
                <IonItem
                  routerLink="/privacy"
                  detail={false}
                  className="text-brand"
                >
                  Privacy Policy
                </IonItem>
              </IonList>

              <div
                className="flex flex-col items-center pt-6"
                onClick={() => setLogoClicks((c) => c + 1)}
              >
                <Logo />
                <span className="text-muted-foreground">v{version}</span>
              </div>
            </div>
          </ContentGutters>
        </KeyboardAvoidingView>
      </IonContent>
    </IonPage>
  );
}
