import { YStack, Text, View, XStack, Button, Progress } from "tamagui";
import { Modal } from "../components/ui/modal";
import { LinearGradient } from "tamagui/linear-gradient";
import { useAuth } from "../stores/auth";
import { useInstances } from "../lib/lemmy";
import { useMemo, useState } from "react";
import { abbriviateNumber } from "~/src/lib/format";
import { ChevronLeft, ChevronRight } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import _ from "lodash";

const COLORS = [
  {
    bg1: "#2B696A",
    bg2: "#082725",
    accent: "#16CA88",
  },
  {
    bg1: "#361F70",
    bg2: "#1A0535",
    accent: "#A026E6",
  },
];

const HIDDEN_TAGS = ["cloudflare"];

const TAGS = [
  "NSFW",
  "General purpose",
  "Gaming",
  "Tech",
  "LGBT",
  "Cats",
  "Activism",
] as const;

export function Onboarding() {
  const instance = useAuth((s) => s.instance);
  const setInstance = useAuth((s) => s.setInstance);

  const [selectedTags, setSelectedTags] = useState<
    Partial<Record<(typeof TAGS)[number], boolean>>
  >({
    NSFW: true,
  });

  const instances = useInstances();

  const [totals, data] = useMemo(() => {
    const selectedTagsClone = { ...selectedTags };

    const showNSFW = selectedTagsClone.NSFW;
    delete selectedTagsClone["NSFW"];

    const data = instances.data
      ?.filter((i) => {
        if (!i.open || i.private) {
          return false;
        }

        if (!showNSFW && i.nsfw) {
          return false;
        }

        for (const [tag, selected] of Object.entries(selectedTagsClone)) {
          if (
            selected &&
            !i.tags.find((t) => t.toLowerCase().includes(tag.toLowerCase()))
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.score - a.score);

    let largestUsers = 0;
    let largestPosts = 0;

    for (const i of data ?? []) {
      largestUsers = Math.max(largestUsers, i.counts.users_active_month);
      largestPosts = Math.max(largestPosts, i.counts.posts);
    }

    return [
      {
        largestUsers,
        largestPosts,
      },
      data,
    ] as const;
  }, [instances.data, selectedTags]);

  const [index, setIndex] = useState(0);

  const selectedInstance = data?.[index];
  const colors = COLORS[1];

  return (
    <Modal
      open={!instance}
      onClose={() => {
        if (selectedInstance) {
          setInstance(selectedInstance?.url);
        }
      }}
    >
      <LinearGradient
        colors={[colors.bg1, colors.bg2]}
        p="$6"
        maxWidth={350}
        br="inherit"
      >
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontWeight="bold" color="white">
              Lemmyway Galaxy
            </Text>

            <Text color="white" o={0.6} fontWeight={300}>
              Start by selecting your home planet—a base to connect with many
              worlds.
            </Text>
          </YStack>

          <YStack gap="$3">
            <Text color="white" fontWeight="bold">
              My planet's population should be...
            </Text>
            <XStack flexWrap="wrap" gap="$2" mb="$2">
              {TAGS.map((t) => (
                <Button
                  key={t}
                  unstyled
                  px="$2"
                  py="$1"
                  bg={selectedTags[t] ? "$accentColor" : "transparent"}
                  bw={1}
                  bc={selectedTags[t] ? "$accentColor" : "white"}
                  o={selectedTags[t] ? 1 : 0.6}
                  br="$12"
                  onPress={() => {
                    setIndex(0);
                    setSelectedTags((prev) => ({
                      ...prev,
                      [t]: prev[t] ? !prev[t] : true,
                    }));
                  }}
                >
                  <Text color={selectedTags[t] ? "white" : "white"}>{t}</Text>
                </Button>
              ))}
            </XStack>
          </YStack>

          <Text
            fontWeight="bold"
            color="white"
            textAlign="center"
            fontSize="$7"
          >
            {selectedInstance?.baseurl}
          </Text>

          <XStack jc="space-between" ai="center">
            <Button
              onPress={() => setIndex((i) => Math.max(i - 1, 0))}
              unstyled
              bg="transparent"
              p={0}
              bw={0}
              o={index === 0 ? 0.3 : 1}
            >
              <ChevronLeft color="white" />
            </Button>

            <YStack ai="center" gap="$4">
              <View
                width={200}
                aspectRatio={1}
                br={9999999}
                bg={colors.accent}
                ai="center"
                jc="center"
              >
                <Text
                  maxWidth="80%"
                  textAlign="center"
                  fontSize="$2"
                  color="white"
                >
                  {selectedInstance?.tags
                    .filter((t) => !HIDDEN_TAGS.includes(t.toLowerCase()))
                    .join(", ")}
                </Text>
              </View>
            </YStack>

            <Button
              onPress={() =>
                setIndex((i) =>
                  Math.min(i + 1, data?.length ? data.length - 1 : 0),
                )
              }
              unstyled
              bg="transparent"
              p={0}
              bw={0}
              o={data ? (index === data.length - 1 ? 0.3 : 1) : 1}
            >
              <ChevronRight color="white" />
            </Button>
          </XStack>

          <Text color="white" textAlign="center" fontSize="$2" o={0.6}>
            {index + 1} of {data?.length}
          </Text>

          {/* <YStack gap="$2"> */}
          {/*   <Text color="white" fontSize="$3"> */}
          {/*     Monthly Active Users{" "} */}
          {/*     {abbriviateNumber( */}
          {/*       selectedInstance?.counts.users_active_month ?? 0, */}
          {/*     )} */}
          {/*   </Text> */}
          {/*   <Progress */}
          {/*     value={ */}
          {/*       ((selectedInstance?.counts.users_active_month ?? 0) / */}
          {/*         totals.largestUsers) * */}
          {/*       100 */}
          {/*     } */}
          {/*     size="$2" */}
          {/*   > */}
          {/*     <Progress.Indicator bg={colors.accent} /> */}
          {/*   </Progress> */}

          {/*   <Text color="white" fontSize="$3"> */}
          {/*     Total Posts{" "} */}
          {/*     {abbriviateNumber(selectedInstance?.counts.posts ?? 0)} */}
          {/*   </Text> */}
          {/*   <Progress */}
          {/*     value={ */}
          {/*       ((selectedInstance?.counts.posts ?? 0) / totals.largestPosts) * */}
          {/*       100 */}
          {/*     } */}
          {/*     size="$2" */}
          {/*   > */}
          {/*     <Progress.Indicator bg={colors.accent} /> */}
          {/*   </Progress> */}
          {/* </YStack> */}

          <Button
            mt="$2"
            onPress={() => {
              if (selectedInstance) {
                setInstance(selectedInstance?.url);
              }
            }}
            size="$3"
          >
            Select
          </Button>
        </YStack>
      </LinearGradient>
    </Modal>
  );
}
