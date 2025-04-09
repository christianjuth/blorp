import { ContentGutters } from "../components/gutters";
import { useRecentCommunitiesStore } from "../stores/recent-communities";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCreatePostStore } from "../stores/create-post";
import { FlashList } from "~/src/components/flashlist";
import { SmallCommunityCard } from "../components/communities/community-card";
import { useCreatePost, useListCommunities, useSearch } from "../lib/lemmy";
import _ from "lodash";
import { Community } from "lemmy-js-client";
import { Image } from "../components/image";
import { parseOgData } from "../lib/html-parsing";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import { UserDropdown } from "../components/nav";
import { MarkdownEditor } from "../components/markdown/editor";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { close } from "ionicons/icons";
import { FaCheck, FaChevronDown } from "react-icons/fa6";
import { LuLoaderCircle } from "react-icons/lu";

const EMPTY_ARR = [];

function CreatePostStepOne({ setStep }: { setStep: (step: 1 | 2) => void }) {
  const router = useIonRouter();

  const community = useCreatePostStore((s) => s.community);

  const editorKey = useCreatePostStore((s) => s.key);

  const reset = useCreatePostStore((s) => s.reset);

  const title = useCreatePostStore((s) => s.title);
  const setTitle = useCreatePostStore((s) => s.setTitle);

  const url = useCreatePostStore((s) => s.url);
  const setUrl = useCreatePostStore((s) => s.setUrl);

  const content = useCreatePostStore((s) => s.content);
  const setContent = useCreatePostStore((s) => s.setContent);

  const thumbnailUrl = useCreatePostStore((s) => s.thumbnailUrl);
  const setThumbnailUrl = useCreatePostStore((s) => s.setThumbnailUrl);

  const createPost = useCreatePost();

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
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Create post</IonTitle>

          <IonButtons slot="end" className="gap-4">
            <Button
              size="sm"
              onClick={() => {
                if (!community) {
                  setStep(2);
                } else {
                  createPost
                    .mutateAsync({
                      name: title,
                      community_id: community.id,
                      body: content,
                      url: url || undefined,
                      custom_thumbnail: thumbnailUrl,
                    })
                    .then(() => reset());
                }
              }}
            >
              {community ? "Post" : "Next"}
              {createPost.isPending && (
                <LuLoaderCircle className="animate-spin" />
              )}
            </Button>
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <ContentGutters className="h-full">
          <div className="flex flex-col py-4 gap-4">
            {community && (
              <button
                onClick={() => setStep(2)}
                className="flex flex-row items-center gap-2"
              >
                <SmallCommunityCard community={community} disableLink />
                <FaChevronDown className="text-brand" />
              </button>
            )}

            <IonInput
              label="Link"
              labelPlacement="floating"
              className="border-b border-border"
              value={url}
              onIonInput={({ detail }) => setUrl(detail.value ?? "")}
              onIonChange={({ detail }) =>
                detail.value && parseUrl(detail.value)
              }
            />

            <IonInput
              label="Title"
              labelPlacement="floating"
              className="border-b border-border"
              value={title}
              onIonInput={({ detail }) => setTitle(detail.value ?? "")}
            />

            <span className="text-muted-foreground text-sm">Body</span>
            <MarkdownEditor
              content={content}
              onChange={setContent}
              className="md:-mx-3"
              placeholder="Write something..."
            />
          </div>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );

  // return (
  //   <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
  //     <ContentGutters flex={1}>
  //       <YStack flex={1} py="$4" px="$4" gap="$3" $gtMd={{ gap: "$5", px: 0 }}>
  //         {community && (
  //           <Link href="/create/choose-community" asChild>
  //             <XStack ai="center" gap="$2" tag="a">
  //               <SmallCommunityCard community={community} disableLink />
  //               <ChevronDown />
  //             </XStack>
  //           </Link>
  //         )}

  //         <YStack>
  //           <Text color="$color11" fontSize="$3">
  //             Link
  //           </Text>
  //           <Input
  //             placeholder="Link"
  //             value={url}
  //             $md={{
  //               px: 0,
  //               bw: 0,
  //             }}
  //             onChangeText={(newUrl) => {
  //               setUrl(newUrl);
  //               if (newUrl.length - (url?.length ?? 0) > 1) {
  //                 parseUrl(newUrl);
  //               }
  //             }}
  //             color="$color11"
  //             br={0}
  //             bw={0}
  //             bbw={1}
  //             px={0}
  //             fontSize="$5"
  //             h="$3"
  //             bc="$color4"
  //           />
  //         </YStack>

  //         <YStack>
  //           <Text color="$color11" fontSize="$3">
  //             Title
  //           </Text>
  //           <Input
  //             placeholder="Title"
  //             value={title}
  //             onChangeText={setTitle}
  //             $md={{
  //               px: 0,
  //               bw: 0,
  //             }}
  //             br={0}
  //             bw={0}
  //             bbw={1}
  //             px={0}
  //             fontSize="$5"
  //             h="$3"
  //             bc="$color4"
  //           />
  //         </YStack>

  //         {thumbnailUrl && (
  //           <YStack gap="$2">
  //             <Text color="$color11" fontSize="$3">
  //               Image
  //             </Text>
  //             <XStack bbw={1} bc="$color4" pb="$3" ai="flex-start">
  //               <View pos="relative">
  //                 <Image imageUrl={thumbnailUrl} maxWidth={200} />
  //                 <View
  //                   tag="button"
  //                   pos="absolute"
  //                   bg="$background"
  //                   br={9999}
  //                   right={0}
  //                   p={1}
  //                   transform={[{ translateX: "50%" }, { translateY: "-50%" }]}
  //                   onPress={() => setThumbnailUrl(undefined)}
  //                 >
  //                   <X color="red" />
  //                 </View>
  //               </View>
  //             </XStack>
  //           </YStack>
  //         )}

  //         <YStack bw={0} bc="$color4" flex={1} gap="$1">
  //           <Text color="$color11" fontSize="$3">
  //             Body
  //           </Text>
  //           <MarkdownEditor
  //             editor={editor}
  //             style={{
  //               flex: 1,
  //               borderRadius: 0,
  //             }}
  //             placeholder="Body..."
  //             scrollEnabled
  //           />
  //         </YStack>
  //       </YStack>
  //     </ContentGutters>
  //   </KeyboardAvoidingView>
  // );
}

function CreatePostStepTwo({ setStep }: { setStep: (step: 1 | 2) => void }) {
  const router = useIonRouter();
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
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => setStep(1)}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>

          <IonTitle>Choose Community</IonTitle>

          <IonButtons className="gap-4" slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <ContentGutters>
          <IonInput
            label="Search communities"
            labelPlacement="floating"
            value={search}
            onIonInput={({ detail }) => debouncedSetSearch(detail.value ?? "")}
          />
        </ContentGutters>

        <FlashList
          data={data}
          renderItem={({ item }) => {
            if (typeof item === "string") {
              return (
                <ContentGutters className="py-2">
                  <span className="text-muted-foreground text-sm">{item}</span>
                </ContentGutters>
              );
            }

            return (
              <ContentGutters className="py-2 cursor-pointer">
                <button
                  onClick={() => {
                    setCommunity(item);
                    setStep(1);
                  }}
                  className="flex flex-row items-center gap-2"
                >
                  <SmallCommunityCard community={item} disableLink />
                  {selectedCommunity &&
                    item.actor_id === selectedCommunity?.actor_id && (
                      <FaCheck className="text-brand" />
                    )}
                </button>
              </ContentGutters>
            );
          }}
          estimatedItemSize={50}
        />
      </IonContent>
    </IonPage>
  );

  // return (
  //   <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
  //     <ContentGutters p="$3" flex={1}>
  //       <YStack flex={1} gap="$2">
  //       </YStack>
  //     </ContentGutters>
  //   </KeyboardAvoidingView>
  // );
}

export default function CreatePost() {
  const [step, setStep] = useState<1 | 2>(1);
  switch (step) {
    case 1:
      return <CreatePostStepOne setStep={setStep} />;
    case 2:
      return <CreatePostStepTwo setStep={setStep} />;
  }
}
