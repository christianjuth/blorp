import { Stack } from "one";
import { useTheme } from "tamagui";

import {
  CommunityHeader,
  CommunitiesHeader,
  PostHeader,
  UserHeader,
  SearchHeader,
} from "~/src/components/nav/headers";
import { LinkContext } from "~/src/components/nav/link-context";

export default function Layout() {
  const theme = useTheme();
  return (
    <LinkContext.Provider
      value={{
        root: "/communities/",
      }}
    >
      <Stack
        screenOptions={{
          headerTintColor: theme.gray12.val,
          contentStyle: {
            backgroundColor: theme.background.val,
          },
          headerTransparent: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Communities",
            header: (props) => <CommunitiesHeader {...props} />,
            headerTransparent: true,
          }}
        />

        <Stack.Screen
          name="s/[search]"
          options={{
            title: "Search",
            header: (props) => <SearchHeader {...props} />,
            headerTransparent: true,
          }}
        />

        <Stack.Screen
          name="u/[userId]"
          options={{
            title: "Search",
            header: (props) => <UserHeader {...props} />,
            headerTransparent: true,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/index"
          options={{
            title: "loading...",
            header: (props) => <CommunityHeader {...props} />,
            headerTransparent: true,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/s/[search]"
          options={{
            title: "loading...",
            header: (props) => <CommunityHeader {...props} />,
            headerTransparent: true,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/posts/[postId]/index"
          options={{
            header: (props) => <PostHeader {...props} />,
            headerTransparent: true,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/posts/[postId]/comments/[commentPath]"
          options={{
            header: (props) => <PostHeader {...props} />,
            headerTransparent: true,
          }}
        />
      </Stack>
    </LinkContext.Provider>
  );
}
