import { Stack } from "one";
import { isWeb, useMedia, useTheme } from "tamagui";

import {
  CommunityHeader,
  HomeHeader,
  PostHeader,
  SearchHeader,
  UserHeader,
} from "~/src/components/nav/headers";
import { LinkContext } from "~/src/components/nav/link-context";

export default function Layout() {
  const media = useMedia();
  const theme = useTheme();
  return (
    <LinkContext.Provider
      value={{
        root: "/",
      }}
    >
      <Stack
        screenOptions={{
          headerTintColor: theme.gray12.val,
          contentStyle: {
            backgroundColor: theme.background.val,
          },
          animation: media.gtMd ? "none" : "default",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Home",
            header: (props) => <HomeHeader {...props} />,
            headerTransparent: !isWeb && media.md,
          }}
        />

        <Stack.Screen
          name="s/[search]"
          options={{
            title: "Search",
            header: (props) => <SearchHeader {...props} />,
          }}
        />

        <Stack.Screen
          name="u/[userId]"
          options={{
            title: "User",
            header: (props) => <UserHeader {...props} />,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/index"
          options={{
            title: "loading...",
            header: (props) => <CommunityHeader {...props} />,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/sidebar"
          options={{
            title: "loading...",
            header: (props) => <CommunityHeader {...props} />,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/s/[search]"
          options={{
            title: "loading...",
            header: (props) => <CommunityHeader {...props} />,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/posts/[postId]/index"
          options={{
            header: (props) => <PostHeader {...props} />,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/posts/[postId]/comments/[commentPath]"
          options={{
            header: (props) => <PostHeader {...props} />,
          }}
        />
      </Stack>
    </LinkContext.Provider>
  );
}
