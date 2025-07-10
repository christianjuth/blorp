import { ContentGutters } from "../components/gutters";
import { usePersonDetails, usePersonFeed } from "../lib/lemmy";
import {
  FeedPostCard,
  PostCardSkeleton,
  PostProps,
} from "../components/posts/post";
import { MarkdownRenderer } from "../components/markdown/renderer";
import { VirtualList } from "../components/virtual-list";
import { PostSortButton } from "../components/lemmy-sort";
import { memo, useEffect, useMemo } from "react";
import { decodeApId, encodeApId } from "../lib/lemmy/utils";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import _ from "lodash";
import { useCommentsStore } from "../stores/comments";
import { useLinkContext } from "../routing/link-context";
import { useProfilesStore } from "../stores/profiles";
import { usePostsStore } from "../stores/posts";
import { Link, resolveRoute, useParams } from "@/src/routing/index";
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
import { useMedia, useUrlSearchState } from "../lib/hooks";
import { PostReportProvider } from "../components/posts/post-report";
import { useFiltersStore } from "../stores/filters";
import { useAuth } from "../stores/auth";
import z from "zod";
import { PersonSidebar } from "../components/person/person-sidebar";
import { PersonActionMenu } from "../components/person/person-action-menu";
import { useHistory } from "react-router";

const NO_ITEMS = "NO_ITEMS";
type Item = string;

const Post = memo((props: PostProps) => (
  <ContentGutters className="px-0">
    <FeedPostCard {...props} featuredContext="user" />
    <></>
  </ContentGutters>
));

const Comment = memo(function Comment({ path }: { path: string }) {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const commentView = useCommentsStore(
    (s) => s.comments[getCachePrefixer()(path)]?.data,
  );
  const postView = usePostsStore((s) => {
    const postApId = commentView?.postApId;
    return postApId ? s.posts[getCachePrefixer()(postApId)]?.data : null;
  });
  const linkCtx = useLinkContext();

  if (!commentView) {
    return null;
  }

  const postTitle = commentView.postTitle ?? postView?.title;

  const parent = path.split(".").at(-2);
  const newPath = [parent !== "0" ? parent : undefined, commentView.id]
    .filter(Boolean)
    .join(".");

  return (
    <ContentGutters>
      <Link
        to={`${linkCtx.root}c/:communityName/posts/:post/comments/:comment`}
        params={{
          communityName: commentView.communitySlug,
          post: encodeApId(commentView.postApId),
          comment: newPath,
        }}
        className="py-2 border-b flex-1 overflow-hidden text-sm flex flex-col gap-1.5"
      >
        <span>
          Replied to <b>{postTitle}</b> in <b>{commentView.communitySlug}</b>
        </span>

        {commentView.deleted ? (
          <span className="text-muted-foreground italic">deleted</span>
        ) : (
          <MarkdownRenderer markdown={commentView.body} />
        )}
      </Link>
      <></>
    </ContentGutters>
  );
});

const EMPTY_ARR: never[] = [];

export default function User() {
  const media = useMedia();
  const linkCtx = useLinkContext();
  const { userId } = useParams(`${linkCtx.root}u/:userId`);

  const actorId = userId ? decodeApId(userId) : undefined;

  const [type, setType] = useUrlSearchState(
    "type",
    "Posts",
    z.enum(["Posts", "Comments"]),
  );

  const postSort = useFiltersStore((s) => s.postSort);
  const personQuery = usePersonDetails({ actorId });
  const query = usePersonFeed({ apIdOrUsername: actorId, type });

  const history = useHistory();
  useEffect(() => {
    const actualApId = personQuery.data?.apId;
    if (actorId && actualApId && actorId !== actualApId) {
      const newPath = resolveRoute(`${linkCtx.root}u/:userId`, {
        userId: encodeApId(actualApId),
      });
      history.replace(newPath);
    }
  }, [actorId, personQuery.data?.apId]);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    data,
    isLoading,
  } = query;

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const person = useProfilesStore((s) =>
    actorId ? s.profiles[getCachePrefixer()(actorId)]?.data : undefined,
  );

  const listData = useMemo(() => {
    const commentViews =
      data?.pages.map((res) => res.comments).flat() ?? EMPTY_ARR;

    const postIds = data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    switch (type) {
      case "Posts":
        return postIds;
      case "Comments":
        return commentViews;
    }
  }, [data?.pages, type, getCachePrefixer]);

  return (
    <IonPage>
      <PageTitle>{person?.slug ?? "Person"}</PageTitle>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonTitle data-tauri-drag-region>{person?.slug ?? "Person"}</IonTitle>
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
                      val && setType(val as "Posts" | "Comments")
                    }
                  >
                    <ToggleGroupItem value="Posts">Posts</ToggleGroupItem>
                    <ToggleGroupItem value="Comments">
                      <span>Comments</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {type === "Posts" && (
                  <>
                    <div className="w-[.5px] h-5 bg-border mx-3 my-auto" />
                    <PostSortButton align="start" />
                  </>
                )}
              </div>
            </IonButtons>
            <IonButtons slot="end">
              <PersonActionMenu person={person} />
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <VirtualList<Item>
            key={type === "Comments" ? "comments" : type + postSort}
            className="h-full ion-content-scroll-host"
            data={listData.length === 0 && !isLoading ? [NO_ITEMS] : listData}
            header={[
              <ContentGutters
                className="max-md:hidden"
                key="header-type-select"
              >
                <div className="flex flex-row md:h-12 md:border-b md:bg-background flex-1 items-center">
                  <div>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      size="sm"
                      value={type}
                      onValueChange={(val) =>
                        val && setType(val as "Posts" | "Comments")
                      }
                    >
                      <ToggleGroupItem value="Posts">Posts</ToggleGroupItem>
                      <ToggleGroupItem value="Comments">
                        <span>Comments</span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {type === "Posts" && (
                    <>
                      <div className="w-[.5px] h-5 bg-border mx-3 my-auto" />
                      <PostSortButton align="start" />
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

              if (type === "Posts") {
                return <Post apId={item} />;
              }

              return <Comment path={item} />;
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

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0 z-10">
          <div className="flex-1" />
          <PersonSidebar person={person} />
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
