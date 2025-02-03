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
import { useAuth } from "~/src/stores/auth";
import { useRequireAuth } from "~/src/components/auth-context";
import { Image as ExpoImage } from "expo-image";
import { ContentGutters } from "~/src/components/gutters";
import { Link, LinkProps } from "one";
import _ from "lodash";

function SettignsLink({ children, ...rest }: LinkProps) {
  return (
    <Link {...rest} asChild>
      <Text h="$4" px="$3.5" tag="a" lh="$9" col="$accentColor">
        {children}
      </Text>
    </Link>
  );
}

function SettingsButton({
  onClick,
  children,
}: {
  onClick: () => any;
  children: string;
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
        size="$4"
        bg={value ? "$accentColor" : "$color6"}
        checked={value}
        onCheckedChange={onToggle}
      >
        <Switch.Thumb bg="$color" animation="100ms" />
      </Switch>
    </XStack>
  );
}

function Divider() {
  return <View h={1} bg="$color7" mx="$3.5" />;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useSettingsStore();
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
          <Text p="$2">ACCOUNT</Text>

          <YStack bg="$color3" br="$4">
            <SettingsButton onClick={isLoggedIn ? logout : requireAuth}>
              {isLoggedIn ? "Logout" : "Login"}
            </SettingsButton>
          </YStack>

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

          <Text p="$2">STORAGE</Text>

          <YStack bg="$color3" br="$4">
            <SettingsToggle
              value={isWeb ? false : settings.cacheImages}
              onToggle={(newVal) => {
                if (isWeb) {
                  return;
                }
                settings.setCacheImages(newVal);
                if (!newVal) {
                  ExpoImage.clearDiskCache();
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
                    ExpoImage.clearDiskCache(),
                    ExpoImage.clearMemoryCache(),
                  ]);
                } catch (err) {}
              }}
            >
              Clear cache
            </SettingsButton>
          </YStack>

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
          </YStack>
        </YStack>
      </ContentGutters>
    </ScrollView>
  );
}
