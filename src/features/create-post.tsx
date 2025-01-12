import { ContentGutters } from "../components/gutters";
import { YStack, Input, XStack, Text, View } from "tamagui";
import { useRecentCommunities } from "../stores/recent-communities";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MarkdownEditor,
  MarkdownEditorState,
} from "../components/markdown-editor";
import { KeyboardAvoidingView, Pressable, TextInput } from "react-native";
import { useCreatePostStore } from "../stores/create-post";
import { FlashList } from "~/src/components/flashlist";
import { SmallCommunityCard } from "../components/communities/community-card";
import { useListCommunities, useSearch } from "../lib/lemmy";
import { Link, SafeAreaView, useRouter } from "one";
import _ from "lodash";
import { Community } from "lemmy-js-client";
import { ChevronDown, Check } from "@tamagui/lucide-icons";
import * as cheerio from "cheerio";
import { Image } from "../components/image";

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
      setContent(editor.getContent());
    });
  }, [editor]);

  const parseUrl = (url: string) => {
    if (url) {
      try {
        fetch(url)
          .then((res) => res.text())
          .then((body) => {
            const $ = cheerio.load(body);
            const newTitle = $("title").text();

            if (!title) {
              setTitle(newTitle);
            }

            // Try to find the og:image meta tag
            const ogImage = $('meta[property="og:image"]').attr("content");

            // Fallback to twitter:image if og:image is not found
            const twitterImage = $('meta[name="twitter:image"]').attr(
              "content",
            );

            const imageUrl = ogImage ?? twitterImage;
            if (imageUrl) {
              setThumbnailUrl(imageUrl);
            }
          });
      } catch (err) {}
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ContentGutters flex={1}>
        <YStack flex={1} py="$3" px="$4" $gtMd={{ gap: "$5", py: "$4" }}>
          {community && (
            <Link href="/create/choose-community" asChild>
              <XStack ai="center" gap="$2" tag="a">
                <SmallCommunityCard community={community} disableLink />
                <ChevronDown />
              </XStack>
            </Link>
          )}

          <YStack>
            <Text color="$color11">Link</Text>
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
              h="$2"
              bc="$color4"
            />
          </YStack>

          <YStack>
            <Text color="$color11">Title</Text>
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
              h="$2"
              bc="$color4"
            />
          </YStack>

          {thumbnailUrl && (
            <YStack gap="$2">
              <Text color="$color11">Image</Text>
              <XStack bbw={1} bc="$color4" pb="$3" ai="flex-start">
                <Image imageUrl={thumbnailUrl} maxWidth={200} />
              </XStack>
            </YStack>
          )}

          <YStack bw={0} bc="$color4" flex={1} gap="$1">
            <Text color="$color11">Body</Text>
            <MarkdownEditor
              editor={editor}
              style={{
                flex: 1,
                fontSize: 16,
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
  const recentCommunities = useRecentCommunities();

  const [search, setSearch] = useState("");
  const debouncedSetSearch = useCallback(_.debounce(setSearch, 500), []);

  const selectedCommunity = useCreatePostStore((s) => s.community);

  const setCommunity = useCreatePostStore((s) => s.setCommunity);

  const subscribedCommunitiesRes = useListCommunities({
    type_: "Subscribed",
    limit: 20,
  });
  const subscribedCommunities =
    subscribedCommunitiesRes.data?.pages
      .flatMap((p) => p.communities)
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
