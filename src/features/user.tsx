import { ContentGutters } from "../components/gutters";
import { abbriviateNumber } from "../lib/format";
import { usePersonDetails, usePersonFeed } from "../lib/lemmy";
import {
  FeedPostCard,
  getPostProps,
  PostCardSkeleton,
  PostProps,
} from "../components/posts/post";
import { MarkdownRenderer } from "../components/markdown/renderer";
import { FlashList } from "../components/flashlist";
import { PostSortBar } from "../components/lemmy-sort";
import { memo, useMemo } from "react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { createPersonSlug, decodeApId, encodeApId } from "../lib/lemmy/utils";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
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
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { UserDropdown } from "../components/nav";
import { Title } from "../components/title";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { LuCakeSlice } from "react-icons/lu";
import { useMedia, useUrlSearchState } from "../lib/hooks";
import { PostReportProvider } from "../components/posts/post-report";
import { Skeleton } from "../components/ui/skeleton";
import { useFiltersStore } from "../stores/filters";
import { useAuth } from "../stores/auth";
import z from "zod";

const NO_ITEMS = "NO_ITEMS";
type Item = typeof NO_ITEMS | PostProps | CommentView;

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
    <ContentGutters>
      <Link
        to={`${linkCtx.root}c/${community.slug}/posts/${encodeApId(post.ap_id)}/comments/${newPath}`}
        className="py-2 border-b flex-1 overflow-hidden"
      >
        {comment.deleted ? (
          <span className="text-sm text-muted-foreground italic">deleted</span>
        ) : (
          <MarkdownRenderer markdown={comment.content} />
        )}
      </Link>
      <></>
    </ContentGutters>
  );
});

dayjs.extend(localizedFormat);

const EMPTY_ARR: never[] = [];

export default function User() {
  const media = useMedia();
  const { userId } = useParams<{ userId: string }>();

  const actorId = userId ? decodeApId(userId) : undefined;

  const [type, setType] = useUrlSearchState(
    "type",
    "all",
    z.enum(["posts", "comments", "all"]),
  );

  const postSort = useFiltersStore((s) => s.postSort);
  usePersonDetails({ actorId });
  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    data,
    isFetching,
  } = usePersonFeed({ actorId });

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const personView = useProfilesStore((s) =>
    actorId ? s.profiles[getCachePrefixer()(actorId)]?.data : undefined,
  );

  const person = personView?.person;
  const counts = personView?.counts;

  const postCache = usePostsStore((s) => s.posts);

  const listData = useMemo(() => {
    const commentViews =
      data?.pages.map((res) => res.comments).flat() ?? EMPTY_ARR;

    const postIds = data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

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
            : (a as CommentView).comment.published;
          const bPublished = isPost(b)
            ? b.published
            : (b as CommentView).comment.published;
          return bPublished.localeCompare(aPublished);
        });
    }
  }, [data?.pages, postCache, type, getCachePrefixer]);

  return (
    <IonPage>
      <Title>{person ? createPersonSlug(person) : "Person"}</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonTitle data-tauri-drag-region>
            {person ? createPersonSlug(person) : "Person"}
          </IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
        {media.maxMd && (
          <IonToolbar>
            <IonButtons slot="start">
              <div className="flex flex-row items-center">
                <div>
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
                    <ToggleGroupItem value="comments">
                      <span>Comments</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {type === "posts" && (
                  <>
                    <div className="w-[.5px] h-5 bg-border mx-3 my-auto" />
                    <PostSortBar align="start" />
                  </>
                )}
              </div>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent scrollY={false}>
        <ContentGutters className="max-md:hidden">
          <div className="flex-1" />
          <div className="absolute py-4 flex flex-col gap-3 w-full">
            <Avatar className="h-13 w-13">
              <AvatarImage src={person?.avatar} />
              <AvatarFallback className="text-xl">
                {person?.name?.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <span className="font-bold">
              {personView?.person.display_name ?? personView?.person.name}
            </span>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <LuCakeSlice />
              <span>
                Created{" "}
                {personView
                  ? dayjs(personView.person.published).format("ll")
                  : ""}
              </span>
            </div>

            {person?.bio && <MarkdownRenderer markdown={person.bio} />}

            <div className="grid grid-cols-2 grid-flow-dense text-sm">
              <span className="font-semibold col-start-1 h-5">
                {counts ? (
                  abbriviateNumber(counts.post_count)
                ) : (
                  <Skeleton className="w-1/4 h-full" />
                )}
              </span>
              <span className="col-start-1 text-sm text-muted-foreground">
                Posts
              </span>

              <span className="font-semibold col-start-2 h-5">
                {counts ? (
                  abbriviateNumber(counts.comment_count)
                ) : (
                  <Skeleton className="w-1/4 h-full" />
                )}
              </span>
              <span className="col-start-2 text-sm text-muted-foreground">
                Comments
              </span>
            </div>
          </div>
        </ContentGutters>

        <PostReportProvider>
          <FlashList<Item>
            key={type === "comments" ? "comments" : type + postSort}
            className="h-full ion-content-scroll-host"
            data={listData.length === 0 && !isFetching ? [NO_ITEMS] : listData}
            header={[
              <ContentGutters className="max-md:hidden">
                <div className="flex flex-row md:h-12 md:border-b-[0.5px] md:bg-background flex-1 items-center">
                  <div>
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
                      <ToggleGroupItem value="comments">
                        <span>Comments</span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {type === "posts" && (
                    <>
                      <div className="w-[.5px] h-5 bg-border mx-3 my-auto" />
                      <PostSortBar align="start" />
                    </>
                  )}
                </div>
                <></>
              </ContentGutters>,
            ]}
            renderItem={({ item }) => {
              if (item === NO_ITEMS) {
                return (
                  <ContentGutters>
                    <div className="flex-1 italic text-muted-foreground p-6 text-center">
                      <span>Nothing to see here</span>
                    </div>
                    <></>
                  </ContentGutters>
                );
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
            stickyHeaderIndices={[0]}
            estimatedItemSize={475}
            refresh={refetch}
            placeholder={
              <ContentGutters className="px-0">
                <PostCardSkeleton />
                <></>
              </ContentGutters>
            }
          />
        </PostReportProvider>
      </IonContent>
    </IonPage>
  );
}
