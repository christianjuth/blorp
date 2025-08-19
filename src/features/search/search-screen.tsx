import { useCommunity, useSearch } from "@/src/lib/api";
import {
  FeedPostCard,
  PostCardSkeleton,
  PostProps,
} from "@/src/components/posts/post";
import { CommunitySidebar } from "@/src/components/communities/community-sidebar";
import { ContentGutters } from "@/src/components/gutters";
import { memo, useMemo, useState } from "react";
import { VirtualList } from "@/src/components/virtual-list";
import {
  CommunityCard,
  CommunityCardSkeleton,
} from "@/src/components/communities/community-card";
import { useFiltersStore } from "@/src/stores/filters";
import _ from "lodash";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { usePostsStore } from "@/src/stores/posts";
import { SearchType } from "lemmy-v3";
import { Link, useParams } from "@/src/routing/index";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonToolbar,
} from "@ionic/react";
import { PageTitle } from "@/src/components/page-title";
import { UserDropdown } from "@/src/components/nav";
import { useMedia, useUrlSearchState } from "@/src/lib/hooks";
import { PostReportProvider } from "@/src/components/posts/post-report";
import { useAuth } from "@/src/stores/auth";
import z from "zod";
import { PersonCard } from "@/src/components/person/person-card";
import { useLinkContext } from "@/src/routing/link-context";
import { Schemas } from "@/src/lib/api/adapters/api-blueprint";
import { BadgeIcon } from "@/src/components/badge-count";
import { PersonAvatar } from "@/src/components/person/person-avatar";
import { MarkdownRenderer } from "@/src/components/markdown/renderer";
import { RelativeTime } from "@/src/components/relative-time";
import { Message } from "@/src/components/icons";
import { Separator } from "@/src/components/ui/separator";
import { ToolbarBackButton } from "@/src/components/toolbar/toolbar-back-button";
import { ToolbarButtons } from "@/src/components/toolbar/toolbar-buttons";
import { SearchBar } from "./search-bar";

const EMPTY_ARR: never[] = [];

const NO_ITEMS = "NO_ITEMS";
type Item = string | Schemas.Comment;

const Post = memo((props: PostProps) => (
  <ContentGutters className="max-md:px-0">
    <FeedPostCard {...props} featuredContext="search" />
    <></>
  </ContentGutters>
));

function Comment({ comment }: { comment: Schemas.Comment }) {
  const linkCtx = useLinkContext();
  const path = comment.path.split(".");
  const parent = path.at(-2);
  const newPath = [parent !== "0" ? parent : undefined, comment.id]
    .filter(Boolean)
    .join(".");
  return (
    <ContentGutters className="px-0">
      <div className="flex-1">
        <div className="flex my-2.5 gap-3 items-start max-md:px-3.5">
          <BadgeIcon
            icon={<Message className="h-full w-full text-muted-foreground" />}
          >
            <PersonAvatar actorId={comment.creatorApId} size="sm" />
          </BadgeIcon>
          <div className={"flex-1 text-sm leading-6 block overflow-x-hidden"}>
            <Link
              to={`${linkCtx.root}c/:communityName/posts/:post/comments/:comment`}
              params={{
                communityName: comment.communitySlug,
                post: encodeURIComponent(comment.postApId),
                comment: newPath,
              }}
            >
              <div className="flex flex-row flex-wrap">
                <span>
                  <span className="font-bold">{comment.creatorSlug}</span>
                  <span> commented in </span>
                  <span className="font-bold">{comment.postTitle}</span>
                </span>
              </div>
              <MarkdownRenderer
                markdown={comment.body}
                className="pb-2"
                disableLinks
              />
            </Link>
            <div className="flex flex-row justify-end gap-2 text-muted-foreground">
              <RelativeTime time={comment.createdAt} />
            </div>
          </div>
        </div>
        <Separator />
      </div>
      <></>
    </ContentGutters>
  );
}

export default function SearchFeed({
  scope = "global",
  defaultType = "posts",
}: {
  scope?: "community" | "global";
  defaultType?: "posts" | "communities" | "users";
}) {
  const media = useMedia();

  const linkCtx = useLinkContext();
  const { communityName } = useParams(`${linkCtx.root}c/:communityName/s`);

  const [searchInput, setSearchInput] = useUrlSearchState("q", "", z.string());
  const [search, setSearch] = useState(searchInput);

  const setDebouncedSearch = useMemo(
    () =>
      _.debounce((newSearch: string) => {
        setSearch(newSearch);
      }, 500),
    [],
  );

  const [type, setType] = useUrlSearchState(
    "type",
    defaultType,
    z.enum(["posts", "communities", "users", "comments"]),
  );

  const postSort = useFiltersStore((s) => s.postSort);

  const community = useCommunity({
    name: communityName,
  });

  let type_: SearchType;
  switch (type) {
    case "posts":
      type_ = "Posts";
      break;
    case "communities":
      type_ = "Communities";
      break;
    case "users":
      type_ = "Users";
      break;
    case "comments":
      type_ = "Comments";
      break;
  }

  const searchResults = useSearch({
    q: search ?? "",
    sort: type === "communities" ? "TopAll" : postSort,
    communitySlug:
      scope === "community" || type === "posts" ? communityName : undefined,
    type: type_,
  });

  const { hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    searchResults;

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    if (type === "users") {
      const users =
        searchResults.data?.pages.map((res) => res.users).flat() ?? EMPTY_ARR;
      return users;
    }

    if (type === "communities") {
      const communities =
        searchResults.data?.pages.map((res) => res.communities).flat() ??
        EMPTY_ARR;
      return communities;
    }

    if (type === "comments") {
      const comments =
        searchResults.data?.pages.map((res) => res.comments).flat() ??
        EMPTY_ARR;
      return comments;
    }

    return searchResults.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;
  }, [searchResults.data?.pages, postCache, type, getCachePrefixer]);

  return (
    <IonPage>
      <PageTitle>
        {communityName ? `Search ${communityName}` : "Search"}
      </PageTitle>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <ToolbarButtons side="left">
            <ToolbarBackButton />
          </ToolbarButtons>
          <SearchBar
            value={searchInput}
            onValueChange={(value) => {
              setSearchInput(value);
              setDebouncedSearch(value);
            }}
            placeholder={
              communityName && type === "posts"
                ? `Search ${communityName}`
                : undefined
            }
          />
          <ToolbarButtons side="right">
            <UserDropdown />
          </ToolbarButtons>
        </IonToolbar>
        {media.maxMd && (
          <IonToolbar>
            <ToggleGroup
              slot="start"
              type="single"
              variant="outline"
              size="sm"
              value={type}
              onValueChange={(val) =>
                val &&
                setType(val as "posts" | "communities" | "users" | "comments")
              }
            >
              <ToggleGroupItem value="posts">Posts</ToggleGroupItem>
              {scope === "global" && (
                <ToggleGroupItem value="communities">
                  Communities
                </ToggleGroupItem>
              )}
              {scope === "global" && (
                <ToggleGroupItem value="users">Users</ToggleGroupItem>
              )}
              <ToggleGroupItem value="comments">Comments</ToggleGroupItem>
            </ToggleGroup>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <VirtualList<Item>
            key={type === "communities" ? "communities" : type + postSort}
            className="h-full ion-content-scroll-host"
            data={
              data.length === 0 &&
              !searchResults.isRefetching &&
              !searchResults.isPending
                ? [NO_ITEMS]
                : data
            }
            header={[
              <ContentGutters
                className="max-md:hidden"
                key="header-type-toggle"
              >
                <div className="flex flex-row h-12 md:border-b md:bg-background flex-1 items-center">
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={type}
                    onValueChange={(val) =>
                      val &&
                      setType(
                        val as "posts" | "communities" | "users" | "comments",
                      )
                    }
                  >
                    <ToggleGroupItem value="posts">Posts</ToggleGroupItem>
                    {scope === "global" && (
                      <ToggleGroupItem value="communities">
                        Communities
                      </ToggleGroupItem>
                    )}
                    {scope === "global" && (
                      <ToggleGroupItem value="users">Users</ToggleGroupItem>
                    )}
                    <ToggleGroupItem value="comments">Comments</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <></>
              </ContentGutters>,
            ]}
            renderItem={({ item }) => {
              if (!_.isString(item)) {
                return <Comment comment={item} />;
              }

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

              if (type === "posts") {
                return <Post apId={item} />;
              }

              if (type === "users") {
                return (
                  <ContentGutters>
                    <PersonCard actorId={item} />
                  </ContentGutters>
                );
              }

              return (
                <ContentGutters>
                  <CommunityCard communitySlug={item} className="pt-3.5" />
                  <></>
                </ContentGutters>
              );
            }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            estimatedItemSize={type === "posts" ? 475 : 52}
            refresh={refetch}
            placeholder={
              <ContentGutters
                className={type !== "communities" ? "px-0" : undefined}
              >
                {type === "communities" ? (
                  <CommunityCardSkeleton className="flex-1" />
                ) : (
                  <PostCardSkeleton />
                )}
                <></>
              </ContentGutters>
            }
            stickyHeaderIndices={[0]}
          />
        </PostReportProvider>

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0 z-10">
          <div className="flex-1" />
          {communityName && (
            <CommunitySidebar
              communityName={communityName}
              actorId={community.data?.community.apId}
            />
          )}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
