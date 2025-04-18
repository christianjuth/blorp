import { useEffect, useState } from "react";
import { useSettingsStore } from "@/src/stores/settings";
import { useLogout } from "@/src/lib/lemmy/index";
import { parseAccountInfo, useAuth } from "@/src/stores/auth";
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
import { Title } from "../components/title";

const version =
  _.isObject(pkgJson) && "version" in pkgJson ? pkgJson.version : undefined;

function SectionLabel({ children }: { children: string }) {
  return <span className="text-sm text-muted-foreground mt-4">{children}</span>;
}

function AccountSection() {
  const requireAuth = useRequireAuth();
  const logout = useLogout();
  const accounts = useAuth((s) => s.accounts);
  return (
    <>
      <SectionLabel>ACCOUNTS</SectionLabel>

      <IonList inset>
        {accounts.map((a, index) => {
          const { person, instance } = parseAccountInfo(a);
          const isLoggedIn = Boolean(a.jwt);
          return (
            <IonItem
              key={instance + index}
              button
              detail={false}
              className="text-brand"
              onClick={() => {
                if (isLoggedIn || index > 0) {
                  logout(index);
                } else {
                  requireAuth();
                }
              }}
            >
              {[
                isLoggedIn ? "Logout" : index === 0 ? "Login" : "Remove",
                person
                  ? `${person.display_name ?? person.name}@${instance}`
                  : index > 0
                    ? instance
                    : null,
              ]
                .filter(Boolean)
                .join(" ")}
            </IonItem>
          );
        })}
      </IonList>
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

  const showNsfw = useSettingsStore((s) => s.showNsfw);
  const setShowNsfw = useSettingsStore((s) => s.setShowNsfw);

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
      <IonContent fullscreen={true}>
        <ContentGutters className="pt-4 pb-8 max-md:px-2.5">
          <div className="flex-1 gap-2 flex flex-col">
            <AccountSection />

            <SectionLabel>FILTERS</SectionLabel>

            <IonList inset>
              <IonItem>
                <IonToggle
                  checked={hideRead}
                  onIonChange={(e) => setHideRead(e.detail.checked)}
                >
                  Hide read posts from feeds
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonToggle
                  checked={showNsfw}
                  onIonChange={(e) => setShowNsfw(e.detail.checked)}
                >
                  Show NSFW
                </IonToggle>
              </IonItem>
            </IonList>

            <SectionLabel>FILTER KEYWORDS</SectionLabel>

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
      </IonContent>
    </IonPage>
  );
}
