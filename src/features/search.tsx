import { useSearch } from "../lib/lemmy";
import {
  FeedPostCard,
  getPostProps,
  PostCardSkeleton,
  PostProps,
} from "@/src/components/posts/post";
import { CommunitySidebar } from "@/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";
import { memo, useMemo, useRef, useState } from "react";
import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import {
  CommunityCard,
  CommunityCardSkeleton,
} from "../components/communities/community-card";
import { useFiltersStore } from "../stores/filters";
import _ from "lodash";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";
import { CommunityView } from "lemmy-js-client";
import { useHistory, useParams } from "react-router";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import { Title } from "../components/title";
import { UserDropdown } from "../components/nav";
import { useMedia } from "../lib/hooks";
import { PostReportProvider } from "../components/posts/post-report";

const EMPTY_ARR = [];

type Item = PostProps | CommunityView;

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
  defaultType?: "posts" | "communities" | "all";
}) {
  const media = useMedia();

  const router = useIonRouter();
  const history = useHistory();
  const initSearch = useRef(new URLSearchParams(location.search)).current.get(
    "q",
  );

  const { communityName } = useParams<{
    communityName?: string;
  }>();

  const [search, setSearch] = useState(initSearch);
  const [debouncedSearch, _setDebouncedSearch] = useState(initSearch);
  const setDebouncedSearch = useMemo(
    () =>
      _.debounce((newSearch: string) => {
        _setDebouncedSearch(newSearch);
        history.replace(router.routeInfo.pathname + `?q=${newSearch}`);
      }, 500),
    [history.replace],
  );

  const [type, setType] = useState(defaultType);

  const postSort = useFiltersStore((s) => s.postSort);

  const searchResults = useSearch({
    q: debouncedSearch ?? "",
    sort: type === "communities" ? "TopAll" : postSort,
    community_name: type === "posts" ? communityName : undefined,
  });

  const { hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    searchResults;

  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    if (type === "communities") {
      const communities =
        searchResults.data?.pages.map((res) => res.communities).flat() ??
        EMPTY_ARR;
      return communities;
    }

    const postIds =
      searchResults.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView) : null;
      })
      .filter(isNotNull);

    return postViews;
  }, [searchResults.data?.pages, postCache, type]);

  return (
    <IonPage>
      <Title>{communityName ? `Search ${communityName}` : "Search"}</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonSearchbar
            mode="ios"
            className="max-w-md mx-auto h-3"
            value={search}
            onIonInput={(e) => {
              setSearch(e.detail.value ?? "");
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
                val && setType(val as "posts" | "communities" | "all")
              }
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="posts">Posts</ToggleGroupItem>
              <ToggleGroupItem value="communities">Communities</ToggleGroupItem>
            </ToggleGroup>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <FlashList<Item>
            key={type === "communities" ? "communities" : type + postSort}
            className="h-full ion-content-scroll-host"
            data={data}
            header={
              <ContentGutters className="max-md:hidden">
                <div className="flex flex-row h-12 md:border-b-[0.5px] md:bg-background flex-1 items-center">
                  <div>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      size="sm"
                      value={type}
                      onValueChange={(val) =>
                        val && setType(val as "posts" | "communities" | "all")
                      }
                    >
                      <ToggleGroupItem value="all">All</ToggleGroupItem>
                      <ToggleGroupItem value="posts">Posts</ToggleGroupItem>
                      <ToggleGroupItem value="communities">
                        Communities
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {type === "posts" && (
                    <>
                      <div className="w-[.5px] h-2/3 bg-border mx-3 my-auto" />
                      <PostSortBar align="start" />
                    </>
                  )}
                </div>
                <></>
              </ContentGutters>
            }
            renderItem={({ item }) => {
              if (isPost(item)) {
                return <Post {...item} />;
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

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0">
          <div className="flex-1" />
          {communityName && <CommunitySidebar communityName={communityName} />}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}

export default SearchFeed;
