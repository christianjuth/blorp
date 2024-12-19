import { View, Text, Button, YStack } from "tamagui";
import { useQueryClient } from "@tanstack/react-query";
import FastImage from "~/src/components/fast-image";
import { useState } from "react";

export default function HomePage() {
  const queryClient = useQueryClient();
  const [clearCachePressed, setClearCachePressed] = useState(false);
  return (
    <View height="100%" bg="$color3" p="$4" gap="$2">
      <Text p="$2">OTHER</Text>

      <YStack bg="$color1" br="$4">
        <Button
          onPress={async () => {
            if (clearCachePressed) {
              return;
            }
            setClearCachePressed(true);
            try {
              queryClient.clear();
            } catch (err) {}
            try {
              await Promise.all([
                queryClient.invalidateQueries(),
                FastImage.clearDiskCache(),
              ]);
            } catch (err) {}
            setClearCachePressed(false);
          }}
          unstyled
          h="$4"
          px="$3.5"
          jc="center"
          br="$4"
          bg={clearCachePressed ? "$color4" : undefined}
        >
          <Text color="$accentColor" fontSize="$5">
            Clear cache
          </Text>
        </Button>
      </YStack>
    </View>
  );
}
