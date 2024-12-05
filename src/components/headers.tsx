import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { ComentSortSelect } from "./lemmy-sort";
import { View, Text, Button } from "tamagui";
import { ChevronLeft } from "@tamagui/lucide-icons";

export function PostHeader(props: NativeStackHeaderProps) {
  return (
    <View
      bg="$color1"
      bbc="$color4"
      bbw={1}
      btw={0}
      btc="transparent"
      dsp="flex"
      fd="row"
      w="unset"
      px="$3"
      ai="center"
      h={64}
      justifyContent="space-between"
    >
      {props.back && (
        <Button
          unstyled
          p={0}
          bg="transparent"
          dsp="flex"
          fd="row"
          ai="center"
          bw={0}
          onPress={props.navigation.goBack}
        >
          <>
            <ChevronLeft color="$accentColor" />
            <Text fontSize="$5" color="$accentColor">
              {props.back.title}
            </Text>
          </>
        </Button>
      )}
      <Text>{props.options.title ?? "Post"}</Text>
      <ComentSortSelect />
    </View>
  );
}
