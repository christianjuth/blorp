import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import {
  CommentSortSelect,
  CommunityFilter,
  CommunitySortSelect,
  HomeFilter,
  PostSortBar,
} from "../lemmy-sort";
import {
  View,
  Text,
  XStack,
  Input,
  Avatar,
  YStack,
  isWeb,
  useTheme,
  XStackProps,
} from "tamagui";
import {
  ChevronLeft,
  X,
  User,
  LogOut,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Search,
  Bookmark,
} from "@tamagui/lucide-icons";
import Animated from "react-native-reanimated";
import { useCustomHeaderHeight } from "./hooks";
import { useScrollContext } from "./scroll-animation-context";
import { useMedia } from "tamagui";
import { useAnimatedStyle, interpolate } from "react-native-reanimated";
import { Link, useRouter } from "one";
import { useState } from "react";
import { useLinkContext } from "./link-context";
import { parseAccountInfo, useAuth } from "~/src/stores/auth";
import { useRequireAuth } from "../auth-context";
import { Dropdown } from "../ui/dropdown";
import {
  useCreatePost,
  useLogout,
  useMostRecentPost,
  usePosts,
} from "~/src/lib/lemmy/index";
import { useCreatePostStore } from "~/src/stores/create-post";
import { Button, RefreshButton } from "../ui/button";
import * as React from "react";
import { encodeApId } from "~/src/lib/lemmy/utils";
import { useFiltersStore } from "~/src/stores/filters";
import { scrollToTop } from "~/src/features/home-feed";

const EMPTY_ARR = [];

interface HeaderGuttersProps extends XStackProps {
  darkBackground?: boolean;
}

function HeaderGutters({
  darkBackground,
  children,
  ...props
}: HeaderGuttersProps) {
  const { height, insetTop } = useCustomHeaderHeight();

  const [first, second, third] = React.Children.toArray(children);

  return (
    <YStack
      tag="nav"
      pt={insetTop}
      h={height - 0.5}
      bbw={0.5}
      bbc={darkBackground ? "#02024E" : "$color3"}
      bg={darkBackground ? "#02024E" : "$background"}
      {...props}
      $theme-dark={{
        bg: "$background",
        bbc: "$color3",
        ...props["$theme-dark"],
      }}
      $gtMd={{
        h: height - 1,
        bbw: 1,
        bg: "$background",
        bbc: "$color3",
        ...props.$gtMd,
      }}
      data-tauri-drag-region
    >
      <XStack
        flex={1}
        maxWidth={1050}
        w="100%"
        mx="auto"
        gap="$3"
        px="$3"
        ai="center"
        $gtMd={{ px: "$4" }}
        $gtLg={{ px: "$5" }}
        data-tauri-drag-region
      >
        <XStack
          ai="center"
          gap="$3"
          $gtMd={{ flex: 1, gap: "$4" }}
          data-tauri-drag-region
        >
          {first}
        </XStack>

        <XStack
          flex={1}
          ai="center"
          $gtMd={{ jc: "center" }}
          data-tauri-drag-region
        >
          {second}
        </XStack>

        <XStack
          jc="flex-end"
          ai="center"
          gap="$3"
          $gtMd={{ flex: 1, gap: "$4" }}
          data-tauri-drag-region
        >
          {third}
        </XStack>
      </XStack>
    </YStack>
  );
}

const BBW = 0.5;
const BBC = "$color3";

const MemoedUserAvatar = React.memo(UserAvatar);

function UserAvatar() {
  const linkCtx = useLinkContext();
  const logout = useLogout();
  const requireAuth = useRequireAuth();

  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const selectedAccount = useAuth((s) => s.getSelectedAccount());
  const accounts = useAuth((s) => s.accounts);
  const setAccountIndex = useAuth((s) => s.setAccountIndex);

  const { person, instance } = parseAccountInfo(selectedAccount);

  const [accountSwitcher, setAccountSwitcher] = useState(false);

  if (!isLoggedIn && accounts.length === 1) {
    return (
      <Button br="$12" size="$3" onPress={() => requireAuth()}>
        Login
      </Button>
    );
  }

  return (
    <Dropdown
      placement="bottom-end"
      trigger={
        <Avatar size="$2.5">
          <Avatar.Image src={person?.avatar} borderRadius="$12" />
          <Avatar.Fallback
            backgroundColor="$color8"
            borderRadius="$12"
            ai="center"
            jc="center"
          >
            {person ? (
              <Text fontSize="$3">
                {person.name?.substring(0, 1).toUpperCase()}
              </Text>
            ) : (
              <User size="$1" />
            )}
          </Avatar.Fallback>
        </Avatar>
      }
      onOpenChange={() => setAccountSwitcher(false)}
    >
      {({ close }) => (
        <YStack minWidth={250}>
          <YStack ai="center" bbw={1} bbc="$color6" py="$2.5" gap="$2">
            <Avatar size="$5">
              <Avatar.Image src={person?.avatar} borderRadius="$12" />
              <Avatar.Fallback
                backgroundColor="$color8"
                borderRadius={99999}
                ai="center"
                jc="center"
              >
                {person ? (
                  <Text fontSize="$5">
                    {person.name?.substring(0, 1).toUpperCase()}
                  </Text>
                ) : (
                  <User size="$2" />
                )}
              </Avatar.Fallback>
            </Avatar>
            <XStack
              onPress={() => setAccountSwitcher((b) => !b)}
              tag="button"
              ai="center"
              gap="$1"
              pl="$4.5"
            >
              <YStack ai="center">
                <Text fontSize="$4">
                  {person?.display_name ?? person?.name}
                </Text>
                <Text fontSize="$3" col="$color10">
                  {instance}
                </Text>
              </YStack>
              {accountSwitcher ? (
                <ChevronUp size="$1" col="$accentColor" />
              ) : (
                <ChevronDown size="$1" col="$accentColor" />
              )}
            </XStack>
          </YStack>
          <YStack py="$1.5">
            {accountSwitcher ? (
              <>
                {accounts.map((a, index) => {
                  const { person, instance } = parseAccountInfo(a);
                  return (
                    <XStack
                      py="$1.5"
                      tag="button"
                      ai="center"
                      px="$2.5"
                      gap="$2.5"
                      onPress={() => {
                        close();
                        setAccountIndex(index);
                      }}
                      key={instance + index}
                    >
                      <Avatar size="$2.5">
                        <Avatar.Image src={person?.avatar} borderRadius="$12" />
                        <Avatar.Fallback
                          backgroundColor="$color8"
                          borderRadius="$12"
                          ai="center"
                          jc="center"
                        >
                          {person ? (
                            <Text fontSize="$4">
                              {person.name?.substring(0, 1).toUpperCase()}
                            </Text>
                          ) : (
                            <User size="$1" />
                          )}
                        </Avatar.Fallback>
                      </Avatar>
                      <YStack ai="flex-start">
                        <Text fontSize="$4">
                          {person?.display_name ?? person?.name}
                        </Text>
                        <Text fontSize="$3" col="$color11">
                          {instance}
                        </Text>
                      </YStack>
                    </XStack>
                  );
                })}

                <XStack
                  py="$2"
                  tag="button"
                  ai="center"
                  px="$2.5"
                  gap="$2.5"
                  onPress={() => {
                    close();
                    requireAuth({ addAccount: true });
                  }}
                >
                  <PlusCircle size="$2" px="$1" col="$color9" />
                  <Text fontSize="$4" col="$color10">
                    Add account
                  </Text>
                </XStack>
              </>
            ) : (
              <>
                {isLoggedIn && (
                  <Link href={`${linkCtx.root}saved`} push asChild>
                    <XStack
                      py="$2"
                      tag="a"
                      ai="center"
                      px="$2.5"
                      gap="$2.5"
                      onPress={close}
                    >
                      <Bookmark size="$1.5" col="$color10" />
                      <Text>Saved</Text>
                    </XStack>
                  </Link>
                )}

                {person && (
                  <Link
                    href={`${linkCtx.root}u/${encodeApId(person.actor_id)}`}
                    push
                    asChild
                  >
                    <XStack
                      py="$2"
                      tag="a"
                      ai="center"
                      px="$2.5"
                      gap="$2.5"
                      onPress={close}
                    >
                      <User size="$1.5" col="$color10" />
                      <Text>Profile</Text>
                    </XStack>
                  </Link>
                )}

                <XStack
                  py="$2"
                  ai="center"
                  px="$2.5"
                  gap="$2.5"
                  bg="transparent"
                  tag="button"
                  bw={0}
                  onPress={() => {
                    logout();
                    close();
                  }}
                >
                  <LogOut size="$1.5" col="$color10" />
                  <Text>Logout</Text>
                </XStack>
              </>
            )}
          </YStack>
        </YStack>
      )}
    </Dropdown>
  );
}

function NavbarRightSide({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {children}
      <MemoedUserAvatar />
    </>
  );
}

function SearchBar({
  defaultValue,
  hideOnMd,
}: {
  defaultValue?: string;
  hideOnMd?: boolean;
}) {
  const linkCtx = useLinkContext();
  const router = useRouter();
  const [search, setSearch] = useState(defaultValue ?? "");

  return (
    <Input
      bg="$color3"
      bw={0}
      $gtMd={{
        opacity: 0.7,
      }}
      br="$12"
      h="$3"
      bc="$color3"
      placeholder={`Search`}
      flex={1}
      value={search}
      onChangeText={setSearch}
      onSubmitEditing={() => {
        if (linkCtx.root !== "/inbox/") {
          router.push(`${linkCtx.root}s/${search}`);
        }
      }}
      $md={{
        display: hideOnMd ? "none" : "flex",
      }}
    />
  );
}

export function useHeaderAnimation() {
  const { scrollY } = useScrollContext();
  const header = useCustomHeaderHeight();
  const media = useMedia();

  // Animated style for the header
  const container = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 1],
      [0, -1 * (header.height - header.insetTop)],
      "clamp",
    );
    return {
      transform: [{ translateY: media.gtMd ? 0 : translateY }],
    };
  }, [scrollY, header.height, header.insetTop, media.gtMd]);

  const content = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 1], [1, 0], "clamp");
    return {
      opacity: media.gtMd ? 1 : opacity,
    };
  }, [scrollY, media.gtMd]);

  return {
    container,
    content,
  };
}

export function HomeHeader({ navigation, route }: NativeStackHeaderProps) {
  const theme = useTheme();
  const styles = useHeaderAnimation();

  const postSort = useFiltersStore((s) => s.postSort);
  const listingType = useFiltersStore((s) => s.listingType);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    type_: listingType,
  });

  const mostRecentPost = useMostRecentPost({
    limit: 50,
    sort: postSort,
    type_: listingType,
  });

  const data = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;
  const hasNewPost = data[0] && mostRecentPost?.data?.post.ap_id !== data[0];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.background.val,
        },
      ]}
    >
      <Animated.View style={styles.content}>
        <HeaderGutters>
          <HomeFilter />
          <SearchBar hideOnMd />
          <>
            {hasNewPost && (
              <RefreshButton
                hideOnGtMd
                onPress={() => {
                  scrollToTop.current.scrollToOffset();
                  posts.refetch();
                }}
              />
            )}
            <PostSortBar hideOnGtMd />
            <NavbarRightSide />
          </>
        </HeaderGutters>
      </Animated.View>
    </Animated.View>
  );
}

function BackButton({ onPress }: { onPress?: () => any }) {
  const router = useRouter();
  const linkCtx = useLinkContext();

  if (!onPress) {
    onPress = () => {
      router.replace(linkCtx.root);
    };
  }

  return (
    <Button
      unstyled
      p={2}
      px={0}
      bg="transparent"
      borderRadius="$12"
      dsp="flex"
      fd="row"
      ai="center"
      bw={0}
      onPress={onPress}
      h="auto"
      w="auto"
      mx={-7}
    >
      <ChevronLeft color="$accentColor" size="$2" />
    </Button>
  );
}

export function SavedPostsHeader(props: NativeStackHeaderProps) {
  return (
    <HeaderGutters>
      <BackButton
        onPress={
          "back" in props && props.back
            ? () => props.navigation.pop(1)
            : undefined
        }
      />

      <Text fontSize="$5" fontWeight="bold">
        Saved
      </Text>

      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function CommunityHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const media = useMedia();
  const linkCtx = useLinkContext();

  const router = useRouter();

  const params = props.route.params;
  const communityName =
    params &&
    "communityName" in params &&
    typeof params.communityName === "string"
      ? params.communityName
      : undefined;

  const initSearch =
    params && "search" in params && typeof params.search === "string"
      ? params.search
      : undefined;

  const [search, setSearch] = useState(initSearch);

  return (
    <HeaderGutters darkBackground>
      <BackButton
        onPress={
          "back" in props && props.back
            ? () => props.navigation.pop(1)
            : undefined
        }
      />

      <>
        {media.gtMd && (
          <Input
            bg="$color3"
            br="$12"
            h="$3"
            bc="$color3"
            placeholder={`Search ${communityName}`}
            flex={1}
            maxWidth={500}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              router.push(`${linkCtx.root}c/${communityName}/s/${search}`);
            }}
          />
        )}
        {media.md && (
          <Text col="white" fontSize="$5" fontWeight="bold">
            {communityName}
          </Text>
        )}
      </>

      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function SearchHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const params = props.route.params;
  const initSearch =
    params && "search" in params && typeof params.search === "string"
      ? params.search
      : undefined;

  return (
    <HeaderGutters $md={{ bbc: "transparent", bbw: 0 }}>
      <>
        {"back" in props && props.back && (
          <Button
            unstyled
            p={0}
            bg="transparent"
            borderRadius="$12"
            dsp="flex"
            fd="row"
            ai="center"
            bw={0}
            onPress={() => props.navigation.pop(1)}
            h="auto"
          >
            <ChevronLeft color="$accentColor" size="$1.5" />
          </Button>
        )}
      </>
      <SearchBar defaultValue={initSearch} />
      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function CommunitiesHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  return (
    <HeaderGutters>
      <CommunityFilter />
      <SearchBar />
      <NavbarRightSide>
        <CommunitySortSelect />
      </NavbarRightSide>
    </HeaderGutters>
  );
}

export function UserHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  return (
    <HeaderGutters>
      <>
        {"back" in props && props.back && (
          <Button
            unstyled
            p={2}
            bg="transparent"
            borderRadius="$12"
            dsp="flex"
            fd="row"
            ai="center"
            bw={0}
            onPress={() => props.navigation.pop(1)}
            h="auto"
          >
            <ChevronLeft color="$accentColor" size="$2" />
          </Button>
        )}
      </>
      <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
        {props.options.title}
      </Text>
      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function PostHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const params = props.route.params;
  const communityName =
    params &&
    "communityName" in params &&
    typeof params.communityName === "string"
      ? params.communityName
      : undefined;

  return (
    <HeaderGutters darkBackground>
      <BackButton
        onPress={
          "back" in props && props.back
            ? () => props.navigation.pop(1)
            : undefined
        }
      />
      <Text
        fontWeight="bold"
        fontSize="$5"
        overflow="hidden"
        pos="relative"
        numberOfLines={1}
        col="white"
      >
        {communityName}
      </Text>
      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function ModalHeader(props: NativeStackHeaderProps) {
  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <XStack
      bg="$background"
      bbc={BBC}
      bbw={BBW}
      btw={0}
      btc="transparent"
      w="unset"
      px="$3"
      ai="center"
      pt={insetTop}
      h={height - BBW}
    >
      <View flex={1} flexBasis={0} ai="flex-start">
        {props.back && (
          <Button
            unstyled
            p={0}
            bg="transparent"
            dsp="flex"
            fd="row"
            ai="center"
            bw={0}
            onPress={props.navigation.goBack}
            h="auto"
          >
            <X color="$accentColor" />
          </Button>
        )}
      </View>
      <Text fontWeight="bold" fontSize="$5" overflow="hidden">
        {props.options.title}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end"></View>
    </XStack>
  );
}

export function StackHeader(props: NativeStackHeaderProps) {
  return (
    <HeaderGutters>
      <>
        {"back" in props && props.back && (
          <Button
            unstyled
            p={2}
            bg="transparent"
            borderRadius="$12"
            dsp="flex"
            fd="row"
            ai="center"
            bw={0}
            onPress={() => props.navigation.pop(1)}
            h="auto"
          >
            <ChevronLeft color="$accentColor" size="$2" />
          </Button>
        )}

        <Text fontWeight={900} fontSize="$5" overflow="hidden" pos="relative">
          {props.options.title ?? props.route.name}
        </Text>
      </>

      <></>

      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function BottomTabBarHeader(props: BottomTabHeaderProps) {
  return (
    <HeaderGutters>
      <>
        {props.navigation.canGoBack() && (
          <Button
            unstyled
            p={2}
            bg="transparent"
            borderRadius="$12"
            dsp="flex"
            fd="row"
            ai="center"
            bw={0}
            onPress={() => props.navigation.goBack()}
            h="auto"
          >
            <ChevronLeft color="$accentColor" size="$2" />
          </Button>
        )}

        <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
          {props.options.title ?? props.route.name}
        </Text>
      </>
      <></>
      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function CreatePostHeaderStepOne(props: BottomTabHeaderProps) {
  const router = useRouter();

  const selectedCommunity = useCreatePostStore((s) => s.community);
  const isPostReady = useCreatePostStore(
    (s) => s.community && s.title.length > 0 && s.content.length > 0,
  );
  const createPost = useCreatePost();
  const reset = useCreatePostStore((s) => s.reset);
  const title = useCreatePostStore((s) => s.title);
  const content = useCreatePostStore((s) => s.content);
  const url = useCreatePostStore((s) => s.url);

  return (
    <HeaderGutters>
      <>
        {props.navigation.canGoBack() && (
          <Button
            unstyled
            p={2}
            bg="transparent"
            borderRadius="$12"
            dsp="flex"
            fd="row"
            ai="center"
            bw={0}
            onPress={() => props.navigation.goBack()}
            h="auto"
          >
            <X color="$accentColor" size="$2" />
          </Button>
        )}
      </>
      <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
        {props.options.title ?? props.route.name}
      </Text>
      {selectedCommunity ? (
        <Button
          bg={isPostReady ? "$accentColor" : "$color3"}
          br="$12"
          size="$3"
          onPress={() => {
            createPost
              .mutateAsync({
                community_id: selectedCommunity.id,
                name: title,
                body: content ? content : undefined,
                url: url ? url : undefined,
              })
              .then(() => {
                reset();
              });
          }}
          disabled={!isPostReady || createPost.isPending}
        >
          Post
        </Button>
      ) : (
        // Web seems to erase stack history on page reload,
        // so replace works better on web, but on native
        // it negativly impacts the modal animation
        // so we replace on web and push on native
        <Link href="/create/choose-community" asChild replace={isWeb}>
          <Button bg="$accentColor" br="$12" size="$3">
            Next
          </Button>
        </Link>
      )}
    </HeaderGutters>
  );
}

export function CreatePostHeaderStepTwo(props: BottomTabHeaderProps) {
  const router = useRouter();
  return (
    <HeaderGutters>
      <>
        {props.navigation.canGoBack() && (
          <Button
            unstyled
            p={2}
            bg="transparent"
            borderRadius="$12"
            dsp="flex"
            fd="row"
            ai="center"
            bw={0}
            onPress={() => {
              // Web seems to erase stack history on page reload,
              // so replace works better on web, but on native
              // it negativly impacts the modal animation
              // so we replace on web and pop on native
              if (isWeb) {
                router.replace("/create");
              } else {
                props.navigation.goBack();
              }
            }}
            h="auto"
          >
            <X color="$accentColor" size="$2" />
          </Button>
        )}
      </>
      <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
        {props.options.title ?? props.route.name}
      </Text>
    </HeaderGutters>
  );
}

export function SettingsHeader(props: BottomTabHeaderProps) {
  return (
    <HeaderGutters>
      <Text fontWeight={900} fontSize="$5" overflow="hidden" pos="relative">
        Settings
      </Text>
      <></>
      <NavbarRightSide />
    </HeaderGutters>
  );
}
