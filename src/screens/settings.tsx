import { useEffect, useId, useRef, useState } from "react";
import { useSettingsStore } from "@/src/stores/settings";
import { useLogout } from "@/src/lib/lemmy/index";
import { Account, parseAccountInfo, useAuth } from "@/src/stores/auth";
import { useRequireAuth } from "@/src/components/auth-context";
import { ContentGutters } from "@/src/components/gutters";
import _ from "lodash";
import { Logo } from "@/src/components/logo";
import pkgJson from "@/package.json";
import { getDbSizes } from "@/src/lib/create-storage";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonAlert,
} from "@ionic/react";
import { UserDropdown } from "../components/nav";
import { PageTitle } from "../components/page-title";
import { PersonCard } from "../components/person/person-card";
import { Deferred } from "../lib/deferred";
import { createSlug } from "../lib/lemmy/utils";
import { cn } from "../lib/utils";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { openUrl } from "../lib/linking";
import { RoutePath } from "../routing/routes";

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

  const [alrt] = useIonAlert();
  const requireAuth = useRequireAuth();
  const logout = useLogout();
  const logoutZustand = useAuth((s) => s.logout);
  const { person, instance } = parseAccountInfo(account);
  const isLoggedIn = Boolean(account.jwt);

  return (
    <>
      <SectionLabel>{`ACCOUNT ${accountIndex + 1}`}</SectionLabel>
      <IonList inset>
        {person && (
          <IonItem>
            <PersonCard
              actorId={person.actor_id}
              person={person}
              className="my-2"
            />
          </IonItem>
        )}

        {isLoggedIn && (
          <IonItem
            button
            onClick={() => {
              alrt({
                header: `Delete Account?`,
                message:
                  "You’ll be taken to Lemmy’s website to confirm deletion. Continue?",
                buttons: [
                  {
                    text: "Cancel",
                    role: "cancel",
                  },
                  {
                    text: "Continue",
                    role: "destructive",
                    handler: () => {
                      if (Capacitor.isNativePlatform()) {
                        Browser.open({
                          url: `${account.instance}settings`,
                        });
                      } else {
                        openUrl(`${account.instance}settings`);
                      }
                    },
                  },
                ],
              });
            }}
            rel="noopener noreferrer"
            id={modalTriggerId}
            detail={false}
            className="text-brand"
          >
            Delete account
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
              deferred.promise.then(() => logout.mutate(account));
            } else if (accountIndex > 0) {
              logoutZustand(accountIndex);
            } else {
              requireAuth();
            }
          }}
        >
          {[
            isLoggedIn ? "Logout" : accountIndex > 0 ? "Remove" : "Login",
            person
              ? `${person.name}@${instance}`
              : accountIndex > 0
                ? instance
                : null,
          ]
            .filter(Boolean)
            .join(" ")}
        </IonItem>
      </IonList>
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
      <PageTitle>Settings</PageTitle>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonTitle data-tauri-drag-region>Settings</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true}>
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
                rel="noopener noreferrer"
                detail={false}
                className="text-brand"
              >
                What's new
              </IonItem>
              <IonItem
                href="https://github.com/christianjuth/blorp/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                detail={false}
                className="text-brand"
              >
                Report issue
              </IonItem>
              <IonItem
                routerLink={"/privacy" satisfies RoutePath}
                detail={false}
                className="text-brand"
              >
                Privacy Policy
              </IonItem>

              <IonItem
                routerLink={"/terms" satisfies RoutePath}
                detail={false}
                className="text-brand"
              >
                Terms of Use
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
      </IonContent>
    </IonPage>
  );
}
