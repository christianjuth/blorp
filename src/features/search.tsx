import { useCommunity, useSearch } from "../lib/lemmy";
import {
  FeedPostCard,
  getPostProps,
  PostCardSkeleton,
  PostProps,
} from "@/src/components/posts/post";
import { CommunitySidebar } from "@/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";
import { memo, useMemo, useState } from "react";
import { PostSortButton } from "../components/lemmy-sort";
import { VirtualList } from "../components/virtual-list";
import {
  CommunityCard,
  CommunityCardSkeleton,
} from "../components/communities/community-card";
import { useFiltersStore } from "../stores/filters";
import _ from "lodash";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";
import { CommunityView, SearchType } from "lemmy-js-client";
import { useParams } from "@/src/routing/index";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonToolbar,
} from "@ionic/react";
import { PageTitle } from "../components/page-title";
import { UserDropdown } from "../components/nav";
import { useMedia, useUrlSearchState } from "../lib/hooks";
import { PostReportProvider } from "../components/posts/post-report";
import { useAuth } from "../stores/auth";
import z from "zod";
import { PersonCard } from "../components/person/person-card";
import { useLinkContext } from "../routing/link-context";

const EMPTY_ARR: never[] = [];

const NO_ITEMS = "NO_ITEMS";
type Item = typeof NO_ITEMS | string | PostProps | CommunityView;

function isPost(item: Item): item is PostProps {
  return _.isObject(item) && "apId" in item;
}

const Post = memo((props: PostProps) => (
  <ContentGutters className="max-md:px-0">
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

export function SearchFeed({
  defaultType = "posts",
}: {
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
    z.enum(["posts", "communities", "users"]),
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
  }

  const searchResults = useSearch({
    q: search ?? "",
    sort: type === "communities" ? "TopAll" : postSort,
    community_name: type === "posts" ? communityName : undefined,
    type_,
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

    const postIds =
      searchResults.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = _.uniq(postIds)
      .map((apId) => {
        const postView = postCache[getCachePrefixer()(apId)]?.data;
        return postView ? getPostProps(postView) : null;
      })
      .filter(isNotNull);

    return postViews;
  }, [searchResults.data?.pages, postCache, type, getCachePrefixer]);

  return (
    <IonPage>
      <PageTitle>
        {communityName ? `Search ${communityName}` : "Search"}
      </PageTitle>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonSearchbar
            mode="ios"
            className="max-w-md mx-auto h-3"
            value={searchInput}
            onIonInput={(e) => {
              setSearchInput(e.detail.value ?? "");
              setDebouncedSearch(e.detail.value ?? "");
            }}
            placeholder={
              communityName && type === "posts"
                ? `Search ${communityName}`
                : undefined
            }
          />
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
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
                val && setType(val as "posts" | "communities" | "users")
              }
            >
              <ToggleGroupItem value="posts">Posts</ToggleGroupItem>
              <ToggleGroupItem value="communities">Communities</ToggleGroupItem>
              <ToggleGroupItem value="users">Users</ToggleGroupItem>
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
                <div className="flex flex-row h-12 md:border-b-[0.5px] md:bg-background flex-1 items-center">
                  <div>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      size="sm"
                      value={type}
                      onValueChange={(val) =>
                        val && setType(val as "posts" | "communities" | "users")
                      }
                    >
                      <ToggleGroupItem value="posts">Posts</ToggleGroupItem>
                      <ToggleGroupItem value="communities">
                        Communities
                      </ToggleGroupItem>
                      <ToggleGroupItem value="users">Users</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {type === "posts" && (
                    <>
                      <div className="w-[.5px] h-2/3 bg-border mx-3 my-auto" />
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

              if (isPost(item)) {
                return <Post {...item} />;
              }

              if (_.isString(item)) {
                return (
                  <ContentGutters>
                    <PersonCard actorId={item} />
                  </ContentGutters>
                );
              }

              return (
                <ContentGutters>
                  <CommunityCard communityView={item} className="pt-3.5" />
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
              actorId={community.data?.community_view.community.actor_id}
            />
          )}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}

export default SearchFeed;
