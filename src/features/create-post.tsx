import { ContentGutters } from "../components/gutters";
import { ScrollView, Text, YStack } from "tamagui";
import { Select } from "../components/ui/select";
import { useRecentCommunities } from "../stores/recent-communities";
import { useMemo, useState } from "react";
import {
  MarkdownEditor,
  MarkdownEditorState,
} from "../components/markdown-editor";
import { KeyboardAvoidingView } from "react-native";

export function CreatePost() {
  const recentCommunities = useRecentCommunities();
  const [community, setCommunity] = useState<string>();
  const [content, setContent] = useState("");

  const editor = useMemo(() => new MarkdownEditorState(""), []);

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        <ContentGutters p="$3">
          <YStack gap="$4" flex={1}>
            <Text fontWeight="bold" $md={{ dsp: "none" }}>
              Create Post
            </Text>

            <Select
              title="Select a community"
              onValueChange={setCommunity}
              value={community}
              options={recentCommunities.recentlyVisited.map((r) => ({
                label: r.title,
                value: r.actor_id,
              }))}
            />

            <MarkdownEditor
              editor={editor}
              style={{
                flex: 1,
                minHeight: 500,
                padding: 14,
              }}
              placeholder="Body..."
            />
          </YStack>
        </ContentGutters>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
