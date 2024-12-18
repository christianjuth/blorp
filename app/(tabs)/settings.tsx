import { View, Text, Button } from "tamagui";
import { useQueryClient } from "@tanstack/react-query";

export default function HomePage() {
  const queryClient = useQueryClient();
  return (
    <View height="100%" bg="$color1">
      <Button onPress={() => queryClient.clear()}>Clear cache</Button>
    </View>
  );
}
