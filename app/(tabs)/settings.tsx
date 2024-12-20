import { View, Text, Button, YStack, XStack } from "tamagui";
import { useQueryClient } from "@tanstack/react-query";
import FastImage from "~/src/components/fast-image";
import { useState } from "react";
import { Switch } from "tamagui";
import { useSettingsStore } from "~/src/stores/settings";

function SettingsButton({
  onClick,
  children,
}: {
  onClick: () => any;
  children: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Button
      onPress={async () => {
        if (pressed) {
          return;
        }
        setPressed(true);
        await onClick();
        setPressed(false);
      }}
      unstyled
      h="$4"
      px="$3.5"
      jc="center"
      br="$4"
      bg={pressed ? "$color4" : undefined}
    >
      <Text color="$accentColor" fontSize="$5">
        {children}
      </Text>
    </Button>
  );
}

function SettingsToggle({
  value,
  onToggle,
  children,
}: {
  value: boolean;
  onToggle: (newVal: boolean) => void;
  children: string;
}) {
  return (
    <XStack h="$4" px="$3.5" jc="space-between" ai="center" br="$4">
      <Text fontSize="$5">{children}</Text>
      <Switch
        size="$4"
        bg={value ? "$accentColor" : "$color6"}
        checked={value}
        onCheckedChange={onToggle}
      >
        <Switch.Thumb bg="$color" animation="100ms" />
      </Switch>
    </XStack>
  );
}

function Divider() {
  return <View h={1} bg="$color7" mx="$3.5" />;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const settings = useSettingsStore();

  return (
    <View height="100%" bg="$color3" p="$4" gap="$2">
      <Text p="$2">OTHER</Text>

      <YStack bg="$color1" br="$4">
        <SettingsToggle
          value={settings.cacheImages}
          onToggle={(newVal) => {
            settings.setCacheImages(newVal);
            if (!newVal) {
              FastImage.clearDiskCache();
            }
          }}
        >
          Cache images
        </SettingsToggle>

        <Divider />

        <SettingsButton
          onClick={async () => {
            try {
              queryClient.clear();
            } catch (err) {}
            try {
              await Promise.all([
                queryClient.invalidateQueries(),
                FastImage.clearDiskCache(),
              ]);
            } catch (err) {}
          }}
        >
          Clear cache
        </SettingsButton>
      </YStack>
    </View>
  );
}
