import { Stack } from "one";
import { useTheme } from "tamagui";

import {
  CommunityHeader,
  PostHeader,
  StackHeader,
} from "~/src/components/nav/headers";
import { LinkContext } from "~/src/components/communities/link-context";

export default function Layout() {
  const theme = useTheme();
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
          header: (props) => <StackHeader {...props} />,
          headerTransparent: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Inbox",
            headerTitle: "Inbox",
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
