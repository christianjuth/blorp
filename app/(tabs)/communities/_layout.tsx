import { Stack } from "one";
import { useMedia, useTheme } from "tamagui";

import {
  CommunityHeader,
  CommunitiesHeader,
  PostHeader,
  UserHeader,
  SearchHeader,
  SavedPostsHeader,
} from "~/src/components/nav/headers";
import { LinkContext } from "~/src/components/nav/link-context";

export default function Layout() {
  const theme = useTheme();
  const media = useMedia();
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
          animation: media.gtMd ? "none" : "default",
          freezeOnBlur: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Communities",
            header: (props) => <CommunitiesHeader {...props} />,
          }}
        />

        <Stack.Screen
          name="saved"
          options={{
            title: "Saved",
            header: (props) => <SavedPostsHeader {...props} />,
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
