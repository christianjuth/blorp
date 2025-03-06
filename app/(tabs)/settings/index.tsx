import {
  Input,
  View,
  Text,
  Button,
  YStack,
  XStack,
  ScrollView,
  isWeb,
} from "tamagui";
import { useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Switch } from "tamagui";
import { useSettingsStore } from "~/src/stores/settings";
import { useLogout } from "~/src/lib/lemmy/index";
import { parseAccountInfo, useAuth } from "~/src/stores/auth";
import { useRequireAuth } from "~/src/components/auth-context";
import { clearCache as clearImageCache } from "~/src/components/image";
import { ContentGutters } from "~/src/components/gutters";
import { Link, LinkProps, useIsFocused } from "one";
import _ from "lodash";
import { Logo } from "~/src/components/logo";
import pkgJson from "~/package.json";
import { getDbSizes } from "~/src/lib/create-storage";
import { useAlert } from "~/src/components/ui/alert";

const version =
  _.isObject(pkgJson) && "version" in pkgJson ? pkgJson.version : undefined;

function SettignsLink({ children, ...rest }: LinkProps) {
  return (
    <Link {...rest} asChild>
      <Text h="$4" px="$3.5" tag="a" lh="$9" col="$accentColor">
        {children}
      </Text>
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text p="$2" pb="$1" pt="$4" col="$color11">
      {children}
    </Text>
  );
}

function AccountSection() {
  const requireAuth = useRequireAuth();
  const logout = useLogout();
  const accounts = useAuth((s) => s.accounts);
  return (
    <>
      <SectionLabel>ACCOUNTS</SectionLabel>

      <YStack bg="$color2" br="$4" bw={1} bc="$color3">
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
      </YStack>
    </>
  );
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024); // Convert bytes to MB
  return `${mb.toFixed(2)} MB`; // Round to 2 decimal places
}

function CacheSection() {
  const alrt = useAlert();

  const queryClient = useQueryClient();
  const settings = useSettingsStore();

  const [signal, setSignal] = useState(0);

  const focused = useIsFocused();

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

      <YStack bg="$color2" br="$4" bw={1} bc="$color3">
        <Text px="$4" pt="$3" pb="$2.5" fontSize="$4" col="$color11">
          Cache {formatSize(totalSize)}
          {settings.cacheImages ? " (excludes images)" : ""}
        </Text>

        {totalSize > 0 && (
          <YStack px="$4" pb="$4" gap="$3">
            <XStack h="$2" gap={1} br="$3" overflow="hidden">
              {cacheSizes.map(([key, size], index) => (
                <View
                  key={key}
                  w={`${(size / totalSize) * 100}%`}
                  h="100%"
                  bg="$accentColor"
                  o={(cacheSizes.length - index) / cacheSizes.length}
                />
              ))}
            </XStack>

            <XStack rowGap="$2" columnGap="$3" flexWrap="wrap">
              {cacheSizes.map(([key], index) => (
                <XStack key={key} gap="$1.5" ai="center">
                  <View
                    h={11}
                    w={11}
                    bg="$accentColor"
                    br={9999}
                    o={(cacheSizes.length - index) / cacheSizes.length}
                  />
                  <Text
                    col="$color11"
                    fontSize="$3"
                    $md={{ fontSize: "$2" }}
                    textTransform="capitalize"
                  >
                    {key.split("_")[1]?.replaceAll("-", " ")}
                  </Text>
                </XStack>
              ))}
            </XStack>
          </YStack>
        )}

        {settings.cacheImages && (
          <>
            <Divider />

            <SettingsToggle
              value={isWeb ? false : settings.cacheImages}
              onToggle={(newVal) => {
                if (isWeb) {
                  return;
                }
                settings.setCacheImages(newVal);
                if (!newVal) {
                  clearImageCache();
                }
              }}
            >
              Cache images
            </SettingsToggle>

            <Divider />

            <SettingsButton
              onClick={() => {
                alrt("Clear image cache?").then(async () => {
                  try {
                    clearImageCache();
                  } catch (err) {}
                  refreshCacheSizes();
                });
              }}
            >
              Clear image cache
            </SettingsButton>
          </>
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
      </YStack>
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
    <Button
      onPress={async () => {
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
      unstyled
      h="$4"
      px="$3.5"
      jc="center"
      ai="flex-start"
      br="$4"
      bg={pressed ? "$color4" : "transparent"}
      bw={0}
    >
      <Text color="$accentColor" fontSize="$5">
        {children}
      </Text>
    </Button>
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
    <XStack h="$4" px="$3.5" jc="space-between" ai="center" br="$4">
      <Text fontSize="$5" col="$color11">
        {children}
      </Text>
      <Switch
        size="$3"
        bg={value ? "$accentColor" : "$color7"}
        checked={value}
        onCheckedChange={onToggle}
        borderColor={value ? "$accentColor" : "$color8"}
        bw={1}
        px={1}
        animation="100ms"
      >
        <Switch.Thumb bg="white" animation="100ms" mt={1} />
      </Switch>
    </XStack>
  );
}

function Divider() {
  return <View h={1} bg="$color4" mx="$3.5" />;
}

export default function SettingsPage() {
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
    <ScrollView height="100%" bg="$background" p="$3" py="$4">
      <ContentGutters>
        <YStack flex={1} gap="$2">
          <AccountSection />

          <SectionLabel>FILTERS</SectionLabel>

          <YStack bg="$color2" br="$4" bw={1} bc="$color3">
            <SettingsToggle value={hideRead} onToggle={setHideRead}>
              Hide read posts from feeds
            </SettingsToggle>
            <SettingsToggle value={showNsfw} onToggle={setShowNsfw}>
              Show NSFW
            </SettingsToggle>
          </YStack>

          <SectionLabel>FILTER KEYWORDS</SectionLabel>

          <YStack bg="$color2" br="$4" bw={1} bc="$color3">
            {keywords.map((keyword, index) => (
              <Fragment key={index}>
                {index > 0 && <Divider />}
                <Input
                  defaultValue={keyword}
                  onChangeText={(keyword) =>
                    setFilterKeywordsDebounced({
                      index,
                      keyword,
                    })
                  }
                  bg="$color2"
                  onBlur={() => {
                    setFilterKeywordsDebounced.flush();
                    pruneFiltersKeywords();
                  }}
                  placeholder="Keyword to filter..."
                />
              </Fragment>
            ))}
          </YStack>

          <CacheSection />

          <SectionLabel>OTHER</SectionLabel>

          <YStack bg="$color2" br="$4" bw={1} bc="$color3">
            <SettignsLink
              href="https://github.com/christianjuth/blorp/tags"
              target="_blank"
            >
              What's new
            </SettignsLink>
            <Divider />
            <SettignsLink
              href="https://github.com/christianjuth/blorp/issues/new"
              target="_blank"
            >
              Report issue
            </SettignsLink>

            <Divider />
            <SettignsLink href="/privacy">Privacy Policy</SettignsLink>
          </YStack>

          <YStack ai="center" my="$5" gap="$2">
            <Logo />
            <Text col="$color10" fontSize="$4">
              v{version}
            </Text>
          </YStack>
        </YStack>
      </ContentGutters>
    </ScrollView>
  );
}
