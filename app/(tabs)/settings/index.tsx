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
import { Fragment, useMemo, useState } from "react";
import { Switch } from "tamagui";
import { useSettingsStore } from "~/src/stores/settings";
import { useLogout } from "~/src/lib/lemmy/index";
import { parseAccountInfo, useAuth } from "~/src/stores/auth";
import { useRequireAuth } from "~/src/components/auth-context";
import { clearCache as clearImageCache } from "~/src/components/image";
import { ContentGutters } from "~/src/components/gutters";
import { Link, LinkProps } from "one";
import _ from "lodash";
import { Logo } from "~/src/components/logo";
import pkgJson from "~/package.json";
import { usePostsStore } from "~/src/stores/posts";
import { useCommunitiesStore } from "~/src/stores/communities";
import { useCommentsStore } from "~/src/stores/comments";

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

function AccountSection() {
  const requireAuth = useRequireAuth();
  const logout = useLogout();
  const accounts = useAuth((s) => s.accounts);
  return (
    <>
      <Text p="$2">ACCOUNTS</Text>

      <YStack bg="$color3" br="$4">
        {accounts.map((a) => {
          const { person, instance } = parseAccountInfo(a);
          const isLoggedIn = Boolean(a.jwt);
          return (
            <SettingsButton onClick={isLoggedIn ? logout : requireAuth}>
              {[
                isLoggedIn ? "Logout" : "Login",
                person && `${person.display_name ?? person.name}@${instance}`,
              ]
                .filter(Boolean)
                .join(" ")}
            </SettingsButton>
          );
        })}
      </YStack>
    </>
  );
}

function CacheSection() {
  const queryClient = useQueryClient();
  const settings = useSettingsStore();

  const numPosts = Object.keys(usePostsStore((s) => s.posts)).length;
  const numCommunities = Object.keys(
    useCommunitiesStore((s) => s.communities),
  ).length;
  const numComments = Object.keys(useCommentsStore((s) => s.comments)).length;

  const total = numPosts + numCommunities + numComments;

  return (
    <>
      <Text p="$2">STORAGE</Text>

      <YStack bg="$color3" br="$4">
        <YStack px="$4" py="$4" gap="$2.5">
          <XStack h="$2" gap={1}>
            <View
              w={`${(numCommunities / total) * 100}%`}
              bg="#8CFFEA"
              btlr="$2"
              bblr="$2"
              h="100%"
            />

            <View w={`${(numPosts / total) * 100}%`} h="100%" bg="#4F93F2" />

            <View
              w={`${(numComments / total) * 100}%`}
              bg="$accentColor"
              h="100%"
              btrr="$2"
              bbrr="$2"
            />
          </XStack>

          <XStack gap="$2" ai="center">
            <View h={13} w={13} bg="#8CFFEA" br={9999} />
            <Text col="$color11" fontSize="$3">
              Communities
            </Text>

            <View h={13} w={13} bg="#4F93F2" br={9999} />
            <Text col="$color11" fontSize="$3">
              Posts
            </Text>

            <View h={13} w={13} bg="$accentColor" br={9999} />
            <Text col="$color11" fontSize="$3">
              Comments
            </Text>
          </XStack>
        </YStack>

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
          onClick={async () => {
            try {
              queryClient.clear();
            } catch (err) {}
            try {
              await Promise.all([
                queryClient.invalidateQueries(),
                clearImageCache(),
              ]);
            } catch (err) {}
          }}
        >
          Clear cache
        </SettingsButton>
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
      <Text fontSize="$5">{children}</Text>
      <Switch
        size="$3"
        bg={value ? "$accentColor" : "$color8"}
        checked={value}
        onCheckedChange={onToggle}
        borderColor={value ? "$accentColor" : "$color10"}
        bw={1}
        px={1}
        animation="100ms"
      >
        <Switch.Thumb bg="$color" animation="100ms" mt={1} />
      </Switch>
    </XStack>
  );
}

function Divider() {
  return <View h={1} bg="$color7" mx="$3.5" />;
}

export default function SettingsPage() {
  const logout = useLogout();
  const requireAuth = useRequireAuth();
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const showNsfw = useSettingsStore((s) => s.showNsfw);
  const setShowNsfw = useSettingsStore((s) => s.setShowNsfw);

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

          <Text p="$2">FILTERS</Text>

          <YStack bg="$color3" br="$4">
            <SettingsToggle value={showNsfw} onToggle={setShowNsfw}>
              Show NSFW
            </SettingsToggle>
          </YStack>

          <Text p="$2">FILTER KEYWORDS</Text>

          <YStack bg="$color3" br="$4">
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
                  bg="$color3"
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

          <Text p="$2">OTHER</Text>

          <YStack bg="$color3" br="$4">
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
