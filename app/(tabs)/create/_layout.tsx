import { Stack, useFocusEffect, useNavigation } from "one";
import { useCallback } from "react";
import { useTheme } from "tamagui";
import {
  CreatePostHeaderStepOne,
  CreatePostHeaderStepTwo,
} from "~/src/components/nav/headers";

export default function Layout() {
  const setNavOptions = useNavigation().getParent()?.setOptions;

  useFocusEffect(
    useCallback(() => {
      setNavOptions?.({ tabBarStyle: { display: "none" } });
      return () => {
        // Reset the tab bar visibility when leaving the screen
        setNavOptions?.({
          tabBarStyle: { display: "flex", backgroundColor: "transparent" },
        });
      };
    }, [setNavOptions]),
    [setNavOptions],
  );

  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.gray12.val,
        contentStyle: {
          backgroundColor: theme.background.val,
        },
        headerTransparent: true,
        presentation: "containedModal",
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Create Post",
          header: (props) => <CreatePostHeaderStepOne {...props} />,
          headerTransparent: true,
        }}
      />

      <Stack.Screen
        name="choose-community"
        options={{
          title: "Choose Community",
          header: (props) => <CreatePostHeaderStepTwo {...props} />,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
