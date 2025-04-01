import { useSearch } from "../lib/lemmy";
import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import {
  CommunitySidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";
import { memo, useCallback, useId, useMemo, useRef, useState } from "react";
import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import { Community } from "~/src/components/community";
import { useFiltersStore } from "../stores/filters";
import _ from "lodash";
// import { ToggleGroup } from "../components/ui/toggle-group";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";
import { CommunityView } from "lemmy-js-client";
import { useHistory, useParams } from "react-router";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonLabel,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
  RefresherEventDetail,
  useIonRouter,
} from "@ionic/react";
import { Title } from "../components/title";
import { UserDropdown } from "../components/nav";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const EMPTY_ARR = [];

const SIDEBAR_MOBILE = "sidebar-mobile";
const FILTER_SORT_BAR = "filter-sort-bar";

type Item =
  | typeof SIDEBAR_MOBILE
  | typeof FILTER_SORT_BAR
  | PostProps
  | CommunityView;

function isPost(item: Item): item is PostProps {
  return _.isObject(item) && "apId" in item;
}

const Post = memo((props: PostProps) => (
  <ContentGutters>
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

export function SearchFeed({
  defaultType = "posts",
}: {
  defaultType?: "posts" | "communities";
}) {
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
    sort: postSort,
    community_name: communityName,
  });

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = searchResults;

  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    if (type === "communities") {
      const communities =
        searchResults.data?.pages.map((res) => res.communities).flat() ??
        EMPTY_ARR;

      communities.sort((a, b) => {
        if (_.isString(a) || _.isString(b)) {
          return 0;
        }
        return b.counts.subscribers - a.counts.subscribers;
      });

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

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    Haptics.impact({ style: ImpactStyle.Medium });

    if (!isRefetching) {
      refetch().finally(() => {
        event.detail.complete();
      });
    }
  }

  return (
    <IonPage>
      <Title>{communityName}</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonSearchbar
            className="max-w-md mx-auto"
            value={search}
            onIonInput={(e) => {
              setSearch(e.detail.value ?? "");
              setDebouncedSearch(e.detail.value ?? "");
            }}
          />
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <FlashList<Item>
          className="h-full ion-content-scroll-host"
          // ref={ref}
          data={["sidebar-mobile", "filter-sort-bar", ...data]}
          renderItem={({ item }) => {
            // if (item === "sidebar-desktop") {
            //   return (
            //     <ContentGutters>
            //       <View flex={1} />
            //       {communityName ? (
            //         <CommunitySidebar
            //           communityName={communityName}
            //           hideDescription
            //         />
            //       ) : (
            //         <></>
            //       )}
            //     </ContentGutters>
            //   );
            // }

            if (item === SIDEBAR_MOBILE) {
              return communityName ? (
                <ContentGutters>
                  <SmallScreenSidebar communityName={communityName} />
                  <></>
                </ContentGutters>
              ) : (
                <></>
              );
            }

            if (item === FILTER_SORT_BAR) {
              return (
                <ContentGutters className="bg-background">
                  <div className="flex flex-row h-12 border-b-[0.5px] flex-1 items-center">
                    <div>
                      <IonSegment
                        value={type}
                        onIonChange={(e) =>
                          setType(e.detail.value as "posts" | "communities")
                        }
                      >
                        <IonSegmentButton value="posts">
                          <IonLabel>Posts</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="communities">
                          <IonLabel>Communities</IonLabel>
                        </IonSegmentButton>
                      </IonSegment>
                    </div>

                    {type === "posts" && (
                      <>
                        <div className="w-[.5px] h-2/3 bg-border mx-3 my-auto" />
                        <PostSortBar />
                      </>
                    )}
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
                <Community communityView={item} />
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
          estimatedItemSize={type === "posts" ? 475 : 52}
          key={type}
          stickyHeaderIndices={[1]}
        />

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0">
          <div className="flex-1" />
          {communityName && <CommunitySidebar communityName={communityName} />}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}

export default SearchFeed;
