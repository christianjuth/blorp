import { Stack } from "one";
import { useTheme } from "tamagui";

import {
  CommunityHeader,
  HomeHeader,
  PostHeader,
} from "~/src/components/nav/headers";
import { LinkContext } from "~/src/components/communities/link-context";

export default function Layout() {
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
            backgroundColor: theme.color1.val,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Home",
            header: HomeHeader,
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
          name="c/[communityName]/posts/[postId]"
          options={{
            header: PostHeader,
            headerTransparent: true,
          }}
        />
      </Stack>
    </LinkContext.Provider>
  );
}
