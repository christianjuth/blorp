import { ContentGutters } from "../components/gutters";
import { YStack, Input, XStack, Text } from "tamagui";
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
import { Link, useRouter } from "one";
import _ from "lodash";
import { Community } from "lemmy-js-client";
import { ChevronDown, Check } from "@tamagui/lucide-icons";

const EMPTY_ARR = [];

export function CreatePostStepOne() {
  const community = useCreatePostStore((s) => s.community);

  const editorKey = useCreatePostStore((s) => s.key);

  const content = useCreatePostStore((s) => s.content);
  const setContent = useCreatePostStore((s) => s.setContent);

  const title = useCreatePostStore((s) => s.title);
  const setTitle = useCreatePostStore((s) => s.setTitle);

  const editor = useMemo(() => new MarkdownEditorState(content), [editorKey]);

  useEffect(() => {
    return editor.addEventListener(() => {
      setContent(editor.getContent());
    });
  }, [editor]);

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ContentGutters flex={1}>
        <YStack flex={1} gap="$3" py="$4">
          {community && (
            <Link href="/create/choose-community" asChild>
              <XStack ai="center" gap="$2" tag="a">
                <SmallCommunityCard community={community} disableLink />
                <ChevronDown />
              </XStack>
            </Link>
          )}

          <Input
            placeholder="Title"
            fontWeight="bold"
            fontSize="$6"
            value={title}
            onChangeText={setTitle}
          />

          <YStack bw={1} bc="$color4" br="$6" flex={1} p="$3" pt="$2">
            <MarkdownEditor
              editor={editor}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 5,
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
