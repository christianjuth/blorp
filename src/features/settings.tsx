import { Fragment, useEffect, useMemo, useState } from "react";
import { useSettingsStore } from "~/src/stores/settings";
import { useLogout } from "~/src/lib/lemmy/index";
import { parseAccountInfo, useAuth } from "~/src/stores/auth";
import { useRequireAuth } from "~/src/components/auth-context";
import { ContentGutters } from "~/src/components/gutters";
import _ from "lodash";
import { Logo } from "~/src/components/logo";
import pkgJson from "~/package.json";
import { getDbSizes } from "~/src/lib/create-storage";

import { Link, LinkProps } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
} from "@ionic/react";

const version =
  _.isObject(pkgJson) && "version" in pkgJson ? pkgJson.version : undefined;

function SettignsLink({ children, ...rest }: LinkProps) {
  return (
    <Link {...rest}>
      {/* <Text h="$4" px="$3.5" tag="a" lh="$9" col="$accentColor"> */}
      {children}
      {/* </Text> */}
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <span>{children}</span>;
}

function AccountSection() {
  const requireAuth = useRequireAuth();
  const logout = useLogout();
  const accounts = useAuth((s) => s.accounts);
  return (
    <>
      <SectionLabel>ACCOUNTS</SectionLabel>

      <div>
        {accounts.map((a, index) => {
          const { person, instance } = parseAccountInfo(a);
          const isLoggedIn = Boolean(a.jwt);
          return (
            <Fragment key={instance + index}>
              {index > 0 && <Divider />}
              <SettingsButton
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
              </SettingsButton>
            </Fragment>
          );
        })}
      </div>
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

      <div>
        <span>
          Cache {formatSize(totalSize)}
          {settings.cacheImages ? " (excludes images)" : ""}
        </span>

        {totalSize > 0 && (
          <div>
            <div>
              {cacheSizes.map(([key, size], index) => (
                <div
                  key={key}
                  // w={`${(size / totalSize) * 100}%`}
                  // h="100%"
                  // bg="$accentColor"
                  // o={(cacheSizes.length - index) / cacheSizes.length}
                />
              ))}
            </div>

            <div>
              {cacheSizes.map(([key], index) => (
                <div key={key}>
                  <div
                  // h={11}
                  // w={11}
                  // bg="$accentColor"
                  // br={9999}
                  // o={(cacheSizes.length - index) / cacheSizes.length}
                  />
                  <span
                  // col="$color11"
                  // fontSize="$3"
                  // $md={{ fontSize: "$2" }}
                  // textTransform="capitalize"
                  >
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
    </>
  );
}

function SettingsButton({
  onClick,
  children,
}: {
  onClick: () => any;
  children: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={async () => {
        if (pressed) {
          return;
        }
        setPressed(true);
        const p = onClick();
        if (p instanceof Promise) {
          p.finally(() => {
            setPressed(false);
          });
        } else {
          setPressed(false);
        }
      }}
      // unstyled
      // h="$4"
      // px="$3.5"
      // jc="center"
      // ai="flex-start"
      // br="$4"
      // bg={pressed ? "$color4" : "transparent"}
      // bw={0}
    >
      {children}
    </button>
  );
}

function SettingsToggle({
  value,
  onToggle,
  children,
}: {
  value: boolean;
  onToggle: (newVal: boolean) => void;
  children: string;
}) {
  return (
    <div>
      <span>{children}</span>
      <IonToggle
        checked={value}
        onIonChange={(e) => onToggle(e.detail.checked)}
      />
    </div>
  );
}

function Divider() {
  return <div />;
}

export function SettingsPage() {
  const showNsfw = useSettingsStore((s) => s.showNsfw);
  const setShowNsfw = useSettingsStore((s) => s.setShowNsfw);

  const hideRead = useSettingsStore((s) => s.hideRead);
  const setHideRead = useSettingsStore((s) => s.setHideRead);

  const filterKeywords = useSettingsStore((s) => s.filterKeywords);
  const setFilterKeywords = useSettingsStore((s) => s.setFilterKeywords);
  const pruneFiltersKeywords = useSettingsStore((s) => s.pruneFiltersKeywords);

  const setFilterKeywordsDebounced = useMemo(
    () => _.debounce(setFilterKeywords, 500),
    [],
  );

  const keywords = [...filterKeywords, ""];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonTitle data-tauri-drag-region>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true}>
        <ContentGutters>
          <div>
            <AccountSection />

            <SectionLabel>FILTERS</SectionLabel>

            <div>
              <SettingsToggle value={hideRead} onToggle={setHideRead}>
                Hide read posts from feeds
              </SettingsToggle>
              <SettingsToggle value={showNsfw} onToggle={setShowNsfw}>
                Show NSFW
              </SettingsToggle>
            </div>

            <SectionLabel>FILTER KEYWORDS</SectionLabel>

            <div>
              {keywords.map((keyword, index) => (
                <Fragment key={index}>
                  {index > 0 && <Divider />}
                  <input
                    defaultValue={keyword}
                    onChange={(e) =>
                      setFilterKeywordsDebounced({
                        index,
                        keyword: e.target.value,
                      })
                    }
                    onBlur={() => {
                      setFilterKeywordsDebounced.flush();
                      pruneFiltersKeywords();
                    }}
                    placeholder="Keyword to filter..."
                  />
                </Fragment>
              ))}
            </div>

            <CacheSection />

            <SectionLabel>OTHER</SectionLabel>

            <div>
              <SettignsLink
                to="https://github.com/christianjuth/blorp/tags"
                target="_blank"
              >
                What's new
              </SettignsLink>
              <Divider />
              <SettignsLink
                to="https://github.com/christianjuth/blorp/issues/new"
                target="_blank"
              >
                Report issue
              </SettignsLink>

              <Divider />
              <SettignsLink to="/privacy">Privacy Policy</SettignsLink>
            </div>

            <div>
              <Logo />
              <span>v{version}</span>
            </div>
          </div>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
