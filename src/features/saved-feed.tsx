import {
  FeedPostCard,
  getPostProps,
  PostCardSkeleton,
  PostProps,
} from "@/src/components/posts/post";
import { ContentGutters } from "../components/gutters";
import { memo, useMemo } from "react";
import { VirtualList } from "../components/virtual-list";
import { useComments, usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import _ from "lodash";
import { useCommentsStore } from "../stores/comments";
import { MarkdownRenderer } from "../components/markdown/renderer";
import { useLinkContext } from "../routing/link-context";
import { encodeApId } from "../lib/lemmy/utils";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";
import { Link } from "@/src/routing/index";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { UserDropdown } from "../components/nav";
import { PageTitle } from "../components/page-title";
import { useFiltersStore } from "../stores/filters";
import { useAuth } from "../stores/auth";
import { useMedia, useUrlSearchState } from "../lib/hooks";
import z from "zod";

const EMPTY_ARR: never[] = [];

const NO_ITEMS = "NO_ITEMS";
type Item =
  | typeof NO_ITEMS
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
  <ContentGutters className="px-0">
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

function Comment({ path }: { path: string }) {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const commentView = useCommentsStore(
    (s) => s.comments[getCachePrefixer()(path)]?.data,
  );
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
      className="border-b pb-4 mt-4"
      to={`${linkCtx.root}c/:communityName/posts/:post/comments/:comment`}
      params={{
        communityName: community.slug,
        post: encodeApId(post.ap_id),
        comment: newPath,
      }}
    >
      <MarkdownRenderer markdown={comment.content} />
    </Link>
  );
}

export default function SavedFeed() {
  const media = useMedia();

  const [type, setType] = useUrlSearchState(
    "type",
    "all",
    z.enum(["posts", "comments", "all"]),
  );

  const comments = useComments({
    saved_only: true,
    type_: "All",
  });

  const postSort = useFiltersStore((s) => s.postSort);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const posts = usePosts({
    limit: 50,
    saved_only: true,
    type_: "All",
  });

  const { hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = posts;

  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    const commentViews =
      comments.data?.pages.map((res) => res.comments).flat() ?? EMPTY_ARR;

    const postIds = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = _.uniq(postIds)
      .map((apId) => {
        const postView = postCache[getCachePrefixer()(apId)]?.data;
        return postView ? getPostProps(postView) : null;
      })
      .filter(isNotNull);

    switch (type) {
      case "posts":
        return postViews;
      case "comments":
        return commentViews;
      default:
        return [...postViews, ...commentViews].sort((a, b) => {
          const aPublished = isPost(a)
            ? a.published
            : (a as { published: string }).published;
          const bPublished = isPost(b)
            ? b.published
            : (b as { published: string }).published;
          return bPublished.localeCompare(aPublished);
        });
    }
  }, [
    posts.data?.pages,
    comments.data?.pages,
    postCache,
    type,
    getCachePrefixer,
  ]);

  return (
    <IonPage>
      <PageTitle>Saved</PageTitle>
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
        {media.maxMd && (
          <IonToolbar>
            <IonButtons slot="start">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={type}
                onValueChange={(val) =>
                  val && setType(val as "posts" | "comments" | "all")
                }
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="posts">Posts</ToggleGroupItem>
                <ToggleGroupItem value="comments">comments</ToggleGroupItem>
              </ToggleGroup>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <VirtualList<Item>
            key={type === "comments" ? "comments" : type + postSort}
            className="h-full ion-content-scroll-host"
            data={
              data.length === 0 && !posts.isRefetching && !posts.isPending
                ? [NO_ITEMS]
                : data
            }
            header={[
              <ContentGutters
                className="max-md:hidden"
                key="header-type-select"
              >
                <div className="flex flex-row md:h-12 md:border-b md:bg-background flex-1 items-center">
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={type}
                    onValueChange={(val) =>
                      val && setType(val as "posts" | "comments" | "all")
                    }
                  >
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                    <ToggleGroupItem value="posts">Posts</ToggleGroupItem>
                    <ToggleGroupItem value="comments">comments</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <></>
              </ContentGutters>,
            ]}
            renderItem={({ item }) => {
              if (item === NO_ITEMS) {
                return (
                  <ContentGutters>
                    <div className="flex-1 italic text-muted-foreground p-6 text-center">
                      <span>Nothing saved yet</span>
                    </div>
                    <></>
                  </ContentGutters>
                );
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
            estimatedItemSize={475}
            stickyHeaderIndices={[0]}
            refresh={refetch}
            placeholder={
              posts.isPending ? (
                <ContentGutters className="px-0">
                  <PostCardSkeleton />
                  <></>
                </ContentGutters>
              ) : undefined
            }
          />
        </PostReportProvider>
      </IonContent>
    </IonPage>
  );
}
