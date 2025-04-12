import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import { ContentGutters } from "../components/gutters";
import { memo, useMemo, useState } from "react";
import { FlashList } from "../components/flashlist";
import { useComments, usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";
import { ToggleGroup } from "../components/ui/toggle-group";
import _ from "lodash";
import { useCommentsStore } from "../stores/comments";
import { MarkdownRenderer } from "../components/markdown/renderer";
import { useLinkContext } from "../components/nav/link-context";
import { encodeApId } from "../lib/lemmy/utils";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";
import { Link } from "react-router-dom";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { UserDropdown } from "../components/nav";
import { Title } from "../components/title";

const EMPTY_ARR = [];

const HEADER = "header";

type Item =
  | typeof HEADER
  | PostProps
  | {
      path: string;
      postId: number;
      creatorId: number;
    };

function isPost(item: Item): item is PostProps {
  return _.isObject(item) && "apId" in item;
}

const Post = memo((props: PostProps) => (
  <ContentGutters>
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

function Comment({ path }: { path: string }) {
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
    <Link
      to={`${linkCtx.root}c/${community.slug}/posts/${encodeApId(post.ap_id)}/comments/${newPath}`}
    >
      <MarkdownRenderer markdown={comment.content} />
    </Link>
  );
}

export default function SavedFeed() {
  const [type, setType] = useState<"posts" | "comments">("posts");

  const comments = useComments({
    saved_only: true,
    type_: "All",
  });

  const posts = usePosts({
    limit: 50,
    saved_only: true,
    type_: "All",
  });

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    if (type === "comments") {
      return (
        comments.data?.pages.map((res) => res.comments).flat() ?? EMPTY_ARR
      );
    }

    const postIds = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView) : null;
      })
      .filter(isNotNull);

    return postViews;
  }, [posts.data?.pages, comments.data?.pages, postCache]);

  return (
    <IonPage>
      <Title>Saved</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonTitle data-tauri-drag-region>Saved</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <FlashList<Item>
            className="h-full ion-content-scroll-host"
            data={[HEADER, ...data]}
            renderItem={({ item }) => {
              if (item === HEADER) {
                return null;
                // return (
                //   <ContentGutters>
                //     <div
                //       flex={1}
                //       py="$3"
                //       gap="$3"
                //       bbc="$color3"
                //       bbw={1}
                //       $md={{
                //         bbw: 0.5,
                //         pt: "$2",
                //         px: "$3",
                //       }}
                //       ai="center"
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
                //     </XStack>
                //     <></>
                //   </ContentGutters>
                // );
              }

              if (isPost(item)) {
                return <Post {...item} />;
              }

              return (
                <ContentGutters>
                  <Comment path={item.path} />
                  <></>
                </ContentGutters>
              );
            }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            // refreshing={isRefetching}
            // onRefresh={() => {
            //   if (!isRefetching) {
            //     refetch();
            //   }
            // }}
            estimatedItemSize={475}
            stickyHeaderIndices={[0]}
            refresh={refetch}
          />
        </PostReportProvider>
      </IonContent>
    </IonPage>
  );
}
