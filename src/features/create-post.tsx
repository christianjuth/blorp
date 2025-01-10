import { ContentGutters } from "../components/gutters";
import { YStack, Input, XStack } from "tamagui";
import { useRecentCommunities } from "../stores/recent-communities";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MarkdownEditor,
  MarkdownEditorState,
} from "../components/markdown-editor";
import { KeyboardAvoidingView, Pressable, TextInput } from "react-native";
import { useCreatePostStore } from "../stores/create-post";
import { FlashList } from "~/src/components/flashlist";
import { SmallComunityCard } from "../components/communities/community-card";
import { useSearch } from "../lib/lemmy";
import { Link, useRouter } from "one";
import _ from "lodash";
import { Community } from "lemmy-js-client";
import { ChevronDown } from "@tamagui/lucide-icons";

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
                <SmallComunityCard community={community} disableLink />
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
            bw={0}
            p={5}
          />

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

  const searchResults = useSearch({
    q: search,
    type_: "Communities",
    limit: 10,
  });

  const communities = searchResults.data?.pages.flatMap((p) =>
    p.communities.map(({ community }) => community),
  );

  let data: Pick<Community, "name" | "id" | "title" | "icon" | "actor_id">[] =
    recentCommunities.recentlyVisited;
  if (search) {
    data = communities ?? EMPTY_ARR;
  } else if (selectedCommunity) {
    data = [selectedCommunity];
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ContentGutters p="$3" flex={1}>
        <YStack flex={1} gap="$2">
          <FlashList
            data={data}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setCommunity(item);
                  router.back();
                }}
                style={{
                  paddingVertical: 5,
                }}
              >
                <SmallComunityCard community={item} disableLink />
              </Pressable>
            )}
            estimatedItemSize={50}
            ListHeaderComponent={
              <Input
                onChangeText={debouncedSetSearch}
                mb="$2"
                placeholder="Search communities..."
              />
            }
          />
        </YStack>
      </ContentGutters>
    </KeyboardAvoidingView>
  );
}
