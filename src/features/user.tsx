import { ContentGutters } from "../components/gutters";
import { abbriviateNumber } from "../lib/format";
import { usePersonDetails, usePersonFeed } from "../lib/lemmy";
import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "../components/posts/post";
import Markdown from "react-markdown";
import { FlashList } from "../components/flashlist";
import { PostSortBar } from "../components/lemmy-sort";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useScrollToTop } from "@react-navigation/native";
// import { CakeSlice } from "@tamagui/lucide-icons";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { decodeApId, encodeApId } from "../lib/lemmy/utils";
import { ToggleGroup } from "../components/ui/toggle-group";
import _ from "lodash";
import { useCommentsStore } from "../stores/comments";
import { useLinkContext } from "../components/nav/link-context";
import { useProfilesStore } from "../stores/profiles";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";
import { CommentView } from "lemmy-js-client";
import { Link, useParams } from "react-router-dom";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from "@ionic/react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { UserDropdown } from "../components/nav";

const BANNER = "banner";
const POST_SORT_BAR = "post-sort-bar";

type Item = typeof BANNER | typeof POST_SORT_BAR | PostProps | CommentView;

function isPost(item: Item): item is PostProps {
  return _.isObject(item) && "apId" in item;
}

const Post = memo((props: PostProps) => (
  <ContentGutters className="px-0">
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

const Comment = memo(function Comment({ path }: { path: string }) {
  const commentView = useCommentsStore((s) => s.comments[path]?.data);
  const linkCtx = useLinkContext();

  if (!commentView) {
    return null;
  }

  const { comment, community, post } = commentView;

  const parent = path.split(".").at(-2);
  const newPath = [parent !== "0" ? parent : undefined, comment.id]
    .filter(Boolean)
    .join(".");

  return (
    <ContentGutters>
      <Link
        to={`${linkCtx.root}c/${community.slug}/posts/${encodeApId(post.ap_id)}/comments/${newPath}`}
      >
        <Markdown>{comment.content}</Markdown>
      </Link>
      <></>
    </ContentGutters>
  );
});

dayjs.extend(localizedFormat);

const EMPTY_ARR = [];

export default function User() {
  const { userId } = useParams<{ userId: string }>();

  const actorId = userId ? decodeApId(userId) : undefined;

  const [type, setType] = useState<"posts" | "comments">("posts");

  const personQuery = usePersonDetails({ actorId });
  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    data,
  } = usePersonFeed({ actorId });

  const personView = useProfilesStore((s) =>
    actorId ? s.profiles[actorId]?.data : undefined,
  );

  const person = personView?.person;
  const counts = personView?.counts;

  const postCache = usePostsStore((s) => s.posts);

  const listData = useMemo(() => {
    if (type === "comments") {
      return data?.pages.map((res) => res.comments).flat() ?? EMPTY_ARR;
    }

    const postIds = data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView) : null;
      })
      .filter(isNotNull);

    return postViews;
  }, [data?.pages, postCache]);

  if (!personView) {
    return null;
  }

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    Haptics.impact({ style: ImpactStyle.Medium });

    if (!isRefetching) {
      refetch().then(() => {
        event.detail.complete();
      });
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonTitle>{person?.display_name ?? person?.name}</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        {/* <ContentGutters> */}
        {/*   <View flex={1} /> */}
        {/*   <YStack py="$4" br="$4" zIndex="$5" gap="$4" pos="absolute" w="100%"> */}
        {/*     <Text fontWeight="bold" fontSize="$5"> */}
        {/*       {personView.person.display_name ?? personView.person.name} */}
        {/*     </Text> */}

        {/*     <XStack ai="center" gap="$1.5"> */}
        {/*       <CakeSlice size="$1" color="$color11" /> */}
        {/*       <Text fontSize="$3" color="$color11"> */}
        {/*         Created {dayjs(personView.person.published).format("ll")} */}
        {/*       </Text> */}
        {/*     </XStack> */}

        {/*     {person?.bio && <Markdown markdown={person.bio} />} */}

        {/*     {counts && ( */}
        {/*       <XStack> */}
        {/*         <YStack gap="$1" flex={1}> */}
        {/*           <Text fontWeight="bold" fontSize="$4"> */}
        {/*             {abbriviateNumber(counts.post_count)} */}
        {/*           </Text> */}
        {/*           <Text fontSize="$3" color="$color11"> */}
        {/*             Posts */}
        {/*           </Text> */}
        {/*         </YStack> */}

        {/*         <YStack gap="$1" flex={1}> */}
        {/*           <Text fontWeight="bold" fontSize="$4"> */}
        {/*             {abbriviateNumber(counts.comment_count)} */}
        {/*           </Text> */}
        {/*           <Text fontSize="$3" color="$color11"> */}
        {/*             Comments */}
        {/*           </Text> */}
        {/*         </YStack> */}
        {/*       </XStack> */}
        {/*     )} */}
        {/*   </YStack> */}
        {/* </ContentGutters> */}

        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <FlashList<Item>
          className="h-full ion-content-scroll-host"
          data={
            [
              BANNER,
              // "sidebar-mobile",
              POST_SORT_BAR,
              ...listData,
            ] as const
          }
          renderItem={({ item }) => {
            // if (item === "sidebar-mobile") {
            //   return communityName ? (
            //     <ContentGutters>
            //       <SmallScreenSidebar communityName={communityName} />
            //       <></>
            //     </ContentGutters>
            //   ) : (
            //     <></>
            //   );
            // }

            if (item === "banner") {
              return null;
              // return (
              //   <ContentGutters>
              //     <XStack ai="center" flex={1} $md={{ px: "$2" }}>
              //       <Avatar size="$5" mr="$2">
              //         <Avatar.Image src={person?.avatar} borderRadius="$12" />
              //         <Avatar.Fallback
              //           backgroundColor="$color8"
              //           borderRadius="$12"
              //           ai="center"
              //           jc="center"
              //         >
              //           <Text fontSize="$7">
              //             {person?.name?.substring(0, 1).toUpperCase()}
              //           </Text>
              //         </Avatar.Fallback>
              //       </Avatar>

              //       <YStack flex={1} py="$4" gap="$1">
              //         <Text fontWeight="bold" fontSize="$7">
              //           {personView.person.display_name ?? personView.person.name}
              //         </Text>
              //         <Text>u/{personView.person.name}</Text>
              //       </YStack>
              //     </XStack>
              //   </ContentGutters>
              // );
            }

            if (item === "post-sort-bar") {
              return null;
              // return (
              //   <ContentGutters>
              //     <XStack
              //       flex={1}
              //       py="$2"
              //       gap="$3"
              //       bbc="$color3"
              //       bbw={1}
              //       $md={{
              //         bbw: 0.5,
              //         px: "$3",
              //       }}
              //       ai="center"
              //       bg="$background"
              //     >
              //       <ToggleGroup
              //         defaultValue={type}
              //         options={[
              //           { value: "posts", label: "Posts" },
              //           { value: "comments", label: "Comments" },
              //         ]}
              //         onValueChange={(newType) => {
              //           setTimeout(() => {
              //             setType(newType);
              //           }, 0);
              //         }}
              //       />

              //       {type === "posts" && (
              //         <>
              //           <View h="$1" w={1} bg="$color6" />
              //           <PostSortBar />
              //         </>
              //       )}
              //     </XStack>
              //     <></>
              //   </ContentGutters>
              // );
            }

            if (isPost(item)) {
              return <Post {...item} />;
            }

            return <Comment path={item.comment.path} />;
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          stickyHeaderIndices={[1]}
          estimatedItemSize={475}
        />
      </IonContent>
    </IonPage>
  );
}
