import { Stack, useFocusEffect, useNavigation } from "one";
import { useTheme } from "tamagui";
import {
  CreatePostHeaderStepOne,
  CreatePostHeaderStepTwo,
} from "~/src/components/nav/headers";

export default function Layout() {
  const navigation = useNavigation();
  useFocusEffect(() => {
    const parent = navigation;
    parent?.setOptions({ tabBarStyle: { display: "none" } });

    return () => {
      // Reset the tab bar visibility when leaving the screen
      parent?.setOptions({
        tabBarStyle: { display: "flex", backgroundColor: "transparent" },
      });
    };
  });

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
