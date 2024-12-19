import { Stack } from "one";
import { useTheme } from "tamagui";
import { Platform } from "react-native";

import {
  CommunityHeader,
  CommunitysHeader,
  PostHeader,
} from "~/src/components/headers";
import { LinkContext } from "~/src/components/communities/link-context";

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
            backgroundColor: theme.color1.val,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Communities",
            header: (props) => <CommunitysHeader {...props} />,
            headerTransparent: Platform.OS !== "web" ? true : false,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/index"
          options={{
            title: "loading...",
            header: (props) => <CommunityHeader {...props} />,
            headerTransparent: Platform.OS !== "web" ? true : false,
          }}
        />

        <Stack.Screen
          name="c/[communityName]/posts/[postId]"
          options={{
            header: PostHeader,
          }}
        />
      </Stack>
    </LinkContext.Provider>
  );
}
