import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { ComentSortSelect, PostSortSelect } from "./lemmy-sort";
import { View, Text, Button, XStack, useMedia } from "tamagui";
import { ChevronLeft, X } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, Image } from "react-native";
import { useParams } from "one";
import { useCommunity } from "~/src/lib/lemmy";

export const useCustomHeaderHeight = () => {
  const insets = useSafeAreaInsets();

  // Default header heights based on platform
  const defaultHeaderHeight = Platform.select({
    ios: 40, // Default header height on iOS
    android: 56, // Default header height on Android
    default: 65, // Default header height for web or other platforms
  });

  // Add safe area top inset to ensure the header accounts for the status bar
  const height = defaultHeaderHeight + insets.top;
  return {
    height,
    insetTop: insets.top,
  };
};

// export function PostHeader(props: NativeStackHeaderProps) {
//   const { height, insetTop } = useCustomHeaderHeight();
//   return (
//     <XStack
//       bg="$color1"
//       bbc="$color4"
//       bbw={1}
//       btw={0}
//       btc="transparent"
//       w="unset"
//       px="$3"
//       ai="center"
//       pt={insetTop}
//       h={height - 1}
//     >
//       <View flex={1} flexBasis={0} ai="flex-start">
//         {props.back && (
//           <Button
//             unstyled
//             p={0}
//             bg="transparent"
//             dsp="flex"
//             fd="row"
//             ai="center"
//             bw={0}
//             onPress={props.navigation.goBack}
//             h="auto"
//           >
//             <X color="$accentColor" />
//           </Button>
//         )}
//       </View>
//       <Text fontWeight="bold" fontSize="$5" overflow="hidden">
//         {props.options.title ?? "Post"}
//       </Text>
//       <View flex={1} flexBasis={0} ai="flex-end">
//         <ComentSortSelect />
//       </View>
//     </XStack>
//   );
// }

export function CommunityHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const media = useMedia();

  const params = props.route.params;
  const communityName =
    params &&
    "communityName" in params &&
    typeof params.communityName === "string"
      ? params.communityName
      : undefined;

  const community = useCommunity({
    name: communityName,
  });

  const banner = community.data?.community_view.community.banner;

  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <XStack
      bbc="$color4"
      bbw={banner ? 0 : 0.5}
      btw={0}
      btc="transparent"
      w="unset"
      px="$3"
      ai="center"
      pt={insetTop}
      h={height - 1}
      pos="relative"
    >
      <View
        bg="$color1"
        opacity={0.95}
        pos="absolute"
        t={0}
        r={0}
        b={0}
        l={0}
      />

      {banner && (
        <Image
          source={{ uri: banner }}
          style={{
            objectFit: "cover",
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: media.gtMd ? 0 : 1,
          }}
        />
      )}

      <View flex={1} flexBasis={0} ai="flex-start">
        {"back" in props && props.back && (
          <Button
            unstyled
            p={2}
            bg="$color075"
            borderRadius="$12"
            dsp="flex"
            fd="row"
            ai="center"
            bw={0}
            onPress={() => props.navigation.pop(1)}
            h="auto"
          >
            <ChevronLeft color="$color1" size="$2" />
          </Button>
        )}
      </View>
      <Text
        fontWeight="bold"
        fontSize="$5"
        overflow="hidden"
        pos="relative"
        $md={{ dsp: banner ? "none" : undefined }}
      >
        {communityName ?? "Home"}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end"></View>
    </XStack>
  );
}

export function PostHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const media = useMedia();

  const params = props.route.params;
  const communityName =
    params &&
    "communityName" in params &&
    typeof params.communityName === "string"
      ? params.communityName
      : undefined;

  const community = useCommunity({
    name: communityName,
  });

  const banner = community.data?.community_view.community.banner;

  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <XStack
      bbc="$color4"
      bbw={banner ? 0 : 0.5}
      btw={0}
      btc="transparent"
      w="unset"
      px="$3"
      ai="center"
      pt={insetTop}
      h={height - 1}
      pos="relative"
    >
      <View
        bg="$color1"
        opacity={0.95}
        pos="absolute"
        t={0}
        r={0}
        b={0}
        l={0}
      />

      {banner && (
        <Image
          source={{ uri: banner }}
          style={{
            objectFit: "cover",
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: media.gtMd ? 0 : 1,
          }}
          blurRadius={50}
        />
      )}

      <View flex={1} flexBasis={0} ai="flex-start">
        {"back" in props && props.back && (
          <Button
            unstyled
            bg="$color05"
            borderRadius="$12"
            bw={0}
            onPress={() => props.navigation.pop(1)}
            dsp="flex"
            ai="center"
            jc="center"
            h="$2.5"
            w="$2.5"
          >
            <ChevronLeft color="$color1" size="$2" />
          </Button>
        )}
      </View>
      <Text
        fontWeight="bold"
        fontSize="$5"
        overflow="hidden"
        pos="relative"
        color={banner && media.md ? "white" : undefined}
      >
        {communityName}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end">
        <View
          dsp="flex"
          ai="center"
          jc="center"
          h="$2.5"
          w="$2.5"
          bg="$color05"
          borderRadius="$12"
        >
          <ComentSortSelect />
        </View>
      </View>
    </XStack>
  );
}

export function ModalHeader(props: NativeStackHeaderProps) {
  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <XStack
      bg="$color1"
      bbc="$color4"
      bbw={1}
      btw={0}
      btc="transparent"
      w="unset"
      px="$3"
      ai="center"
      pt={insetTop}
      h={height - 1}
    >
      <View flex={1} flexBasis={0} ai="flex-start">
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
            h="auto"
          >
            <X color="$accentColor" />
          </Button>
        )}
      </View>
      <Text fontWeight="bold" fontSize="$5" overflow="hidden">
        {props.options.title}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end"></View>
    </XStack>
  );
}
