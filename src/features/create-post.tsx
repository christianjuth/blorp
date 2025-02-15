import { ContentGutters } from "../components/gutters";
import { YStack, Input, XStack, Text, View } from "tamagui";
import { useRecentCommunitiesStore } from "../stores/recent-communities";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MarkdownEditor,
  MarkdownEditorState,
} from "../components/markdown-editor";
import { KeyboardAvoidingView, Pressable } from "react-native";
import { useCreatePostStore } from "../stores/create-post";
import { FlashList } from "~/src/components/flashlist";
import { SmallCommunityCard } from "../components/communities/community-card";
import { useListCommunities, useSearch } from "../lib/lemmy";
import { Link, useRouter } from "one";
import _ from "lodash";
import { Community } from "lemmy-js-client";
import { ChevronDown, Check, X } from "@tamagui/lucide-icons";
import { Image } from "../components/image";
import { parseOgData } from "../lib/html-parsing";

const EMPTY_ARR = [];

export function CreatePostStepOne() {
  const community = useCreatePostStore((s) => s.community);

  const editorKey = useCreatePostStore((s) => s.key);

  const title = useCreatePostStore((s) => s.title);
  const setTitle = useCreatePostStore((s) => s.setTitle);

  const url = useCreatePostStore((s) => s.url);
  const setUrl = useCreatePostStore((s) => s.setUrl);

  const content = useCreatePostStore((s) => s.content);
  const setContent = useCreatePostStore((s) => s.setContent);

  const thumbnailUrl = useCreatePostStore((s) => s.thumbnailUrl);
  const setThumbnailUrl = useCreatePostStore((s) => s.setThumbnailUrl);

  const editor = useMemo(() => new MarkdownEditorState(content), [editorKey]);

  useEffect(() => {
    return editor.addEventListener(() => {
      setContent(editor.getState().content);
    });
  }, [editor]);

  const parseUrl = (url: string) => {
    if (url) {
      try {
        fetch(url)
          .then((res) => res.text())
          .then((body) => {
            const ogData = parseOgData(body);

            if (!title && ogData.title) {
              setTitle(ogData.title);
            }

            if (ogData.image) {
              setThumbnailUrl(ogData.image);
            }
          });
      } catch (err) {}
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ContentGutters flex={1}>
        <YStack flex={1} py="$4" px="$4" gap="$3" $gtMd={{ gap: "$5", px: 0 }}>
          {community && (
            <Link href="/create/choose-community" asChild>
              <XStack ai="center" gap="$2" tag="a">
                <SmallCommunityCard community={community} disableLink />
                <ChevronDown />
              </XStack>
            </Link>
          )}

          <YStack>
            <Text color="$color11" fontSize="$3">
              Link
            </Text>
            <Input
              placeholder="Link"
              value={url}
              $md={{
                px: 0,
                bw: 0,
              }}
              onChangeText={(newUrl) => {
                setUrl(newUrl);
                if (newUrl.length - (url?.length ?? 0) > 1) {
                  parseUrl(newUrl);
                }
              }}
              color="$color11"
              br={0}
              bw={0}
              bbw={1}
              px={0}
              fontSize="$5"
              h="$3"
              bc="$color4"
            />
          </YStack>

          <YStack>
            <Text color="$color11" fontSize="$3">
              Title
            </Text>
            <Input
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              $md={{
                px: 0,
                bw: 0,
              }}
              br={0}
              bw={0}
              bbw={1}
              px={0}
              fontSize="$5"
              h="$3"
              bc="$color4"
            />
          </YStack>

          {thumbnailUrl && (
            <YStack gap="$2">
              <Text color="$color11" fontSize="$3">
                Image
              </Text>
              <XStack bbw={1} bc="$color4" pb="$3" ai="flex-start">
                <View pos="relative">
                  <Image imageUrl={thumbnailUrl} maxWidth={200} />
                  <View
                    tag="button"
                    pos="absolute"
                    bg="$background"
                    br={9999}
                    right={0}
                    p={1}
                    transform={[{ translateX: "50%" }, { translateY: "-50%" }]}
                    onPress={() => setThumbnailUrl(undefined)}
                  >
                    <X color="red" />
                  </View>
                </View>
              </XStack>
            </YStack>
          )}

          <YStack bw={0} bc="$color4" flex={1} gap="$1">
            <Text color="$color11" fontSize="$3">
              Body
            </Text>
            <MarkdownEditor
              editor={editor}
              style={{
                flex: 1,
                borderRadius: 0,
              }}
              placeholder="Body..."
              scrollEnabled
            />
          </YStack>
        </YStack>
      </ContentGutters>
    </KeyboardAvoidingView>
  );
}

export function CreatePostStepTwo() {
  const router = useRouter();
  const recentCommunities = useRecentCommunitiesStore();

  const [search, setSearch] = useState("");
  const debouncedSetSearch = useCallback(_.debounce(setSearch, 500), []);

  const selectedCommunity = useCreatePostStore((s) => s.community);

  const setCommunity = useCreatePostStore((s) => s.setCommunity);

  const subscribedCommunitiesRes = useListCommunities({
    type_: "Subscribed",
    limit: 50,
  });
  const subscribedCommunities =
    subscribedCommunitiesRes.data?.pages
      .flatMap((p) => p.communities)
      .sort((a, b) => a.community.name.localeCompare(b.community.name))
      .map(({ community }) => community) ?? EMPTY_ARR;

  const searchResultsRes = useSearch({
    q: search,
    type_: "Communities",
    limit: 10,
  });

  const searchResultsCommunities =
    searchResultsRes.data?.pages.flatMap((p) =>
      p.communities.map(({ community }) => community),
    ) ?? EMPTY_ARR;

  let data: (
    | Pick<Community, "name" | "id" | "title" | "icon" | "actor_id">
    | "Selected"
    | "Recent"
    | "Subscribed"
    | "Search results"
  )[] = [
    "Recent",
    ...recentCommunities.recentlyVisited,
    "Subscribed",
    ...subscribedCommunities,
  ];

  if (search) {
    data = ["Search results", ...searchResultsCommunities];
  }
  if (selectedCommunity) {
    data = ["Selected", selectedCommunity, ...data];
  }

  data = _.uniqBy(data, (item) => {
    if (typeof item === "string") {
      return item;
    }
    return item.actor_id;
  });

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ContentGutters p="$3" flex={1}>
        <YStack flex={1} gap="$2">
          <FlashList
            data={data}
            renderItem={({ item }) => {
              if (typeof item === "string") {
                return (
                  <Text color="$color10" fontSize="$2" mt="$3">
                    {item}
                  </Text>
                );
              }

              return (
                <Pressable
                  onPress={() => {
                    setCommunity(item);
                    router.back();
                  }}
                >
                  <XStack py="$2" ai="center" gap="$2">
                    <SmallCommunityCard community={item} disableLink />
                    {selectedCommunity &&
                      item.actor_id === selectedCommunity?.actor_id && (
                        <Check color="$accentColor" />
                      )}
                  </XStack>
                </Pressable>
              );
            }}
            estimatedItemSize={50}
            ListHeaderComponent={
              <Input
                onChangeText={debouncedSetSearch}
                placeholder="Search communities..."
              />
            }
            keyExtractor={(item) =>
              typeof item === "string" ? item : item.actor_id
            }
            getItemType={(item) =>
              typeof item === "string" ? "title" : "community"
            }
          />
        </YStack>
      </ContentGutters>
    </KeyboardAvoidingView>
  );
}
