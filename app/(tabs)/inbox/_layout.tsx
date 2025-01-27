import { Stack } from "one";
import { useMedia, useTheme } from "tamagui";

import {
  CommunityHeader,
  PostHeader,
  StackHeader,
  UserHeader,
} from "~/src/components/nav/headers";
import { LinkContext } from "~/src/components/nav/link-context";

export default function Layout() {
  const theme = useTheme();
  const media = useMedia();
  return (
    <LinkContext.Provider
      value={{
        root: "/inbox/",
      }}
    >
      <Stack
        screenOptions={{
          headerTintColor: theme.gray12.val,
          contentStyle: {
            backgroundColor: theme.background.val,
          },
          // @ts-expect-error
          header: (props) => <StackHeader {...props} />,
          animation: media.gtMd ? "none" : "default",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Inbox",
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
