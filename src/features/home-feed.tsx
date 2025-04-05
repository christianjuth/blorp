import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import { ContentGutters } from "../components/gutters";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFiltersStore } from "../stores/filters";
import { useMostRecentPost, usePosts } from "../lib/lemmy";
import { usePostsStore } from "../stores/posts";
import _ from "lodash";
import { isNotNull } from "../lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

import { PopularCommunitiesSidebar } from "../components/populat-communities-sidebar";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
  useIonRouter,
} from "@ionic/react";
import { FlashList } from "../components/flashlist";
import { UserDropdown } from "../components/nav";
import { HomeFilter, PostSortBar } from "../components/lemmy-sort";
import { useElementHadFocus, useMedia } from "../lib/hooks";
import { Link } from "react-router-dom";
import { searchOutline } from "ionicons/icons";

export const scrollToTop = {
  current: { scrollToOffset: () => {} },
};

const EMPTY_ARR = [];

const Post = memo((props: PostProps) => (
  <ContentGutters className="px-0">
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

function useHideHeaderTabBar(div: HTMLDivElement | null, active: boolean) {
  const prevOffsetRef = useRef<number | null>(null);
  const headerAnimateRef = useRef(0);
  const tabBarAnimateRef = useRef(0);

  const [enabled, setEnabled] = useState(active);
  useEffect(() => {
    setEnabled(active);
  }, [active]);

  const { tabBar, header, toolbar } = useMemo(() => {
    const tabBar = document.querySelector("ion-tab-bar");

    const header = document.querySelector<HTMLIonHeaderElement>(
      "ion-header.dismissable",
    );
    const toolbar = document.querySelector<HTMLIonToolbarElement>(
      "ion-toolbar.dismissable",
    );

    return {
      tabBar,
      header,
      toolbar,
    };
  }, [enabled]);

  const scrollHandler = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (prevOffsetRef.current === null) {
        return;
      }

      const safeAreaTop = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--ion-safe-area-top")
          .trim(),
        10,
      );

      if (header && toolbar && tabBar) {
        const headerHeight = _.isNumber(safeAreaTop)
          ? header.offsetHeight - safeAreaTop
          : header.offsetHeight;

        const scrollOffset = Math.max(e.currentTarget.scrollTop, 0);
        const delta = scrollOffset - prevOffsetRef.current;
        prevOffsetRef.current = scrollOffset;

        headerAnimateRef.current = _.clamp(
          headerAnimateRef.current + delta / headerHeight,
          0,
          1,
        );
        tabBarAnimateRef.current = _.clamp(
          headerAnimateRef.current + delta / tabBar.offsetHeight,
          0,
          1,
        );

        header.style.transform = `translate(0, -${
          headerAnimateRef.current * headerHeight
        }px)`;
        toolbar.style.opacity = String((1 - headerAnimateRef.current) ** 3);
        tabBar.style.transform = `translate(0, ${
          tabBarAnimateRef.current * 100
        }%)`;
      }
    },
    [header, toolbar, tabBar],
  );

  useEffect(() => {
    if (!enabled) {
      prevOffsetRef.current = null;
      headerAnimateRef.current = 0;
      tabBarAnimateRef.current = 0;
      if (header && tabBar && toolbar) {
        header.style.transform = `translate(0)`;
        toolbar.style.opacity = "1";
        tabBar.style.transform = `translate(0)`;
      }
    } else {
      prevOffsetRef.current = div?.scrollTop ?? 0;
    }
  }, [enabled, tabBar, header, toolbar]);

  const reset = useCallback(() => {
    setEnabled(false);
  }, []);

  return { scrollHandler, reset };
}

export default function HomeFeed() {
  const router = useIonRouter();
  const [search, setSearch] = useState("");

  const media = useMedia();
  const postSort = useFiltersStore((s) => s.postSort);
  const listingType = useFiltersStore((s) => s.listingType);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    type_: listingType,
  });

  const mostRecentPost = useMostRecentPost({
    limit: 50,
    sort: postSort,
    type_: listingType,
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
    const postIds = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView, "home") : null;
      })
      .filter(isNotNull);

    return postViews;
  }, [posts.data?.pages, postCache]);

  const firstPost = posts.data?.pages[0]?.posts[0];
  const hasNewPost = mostRecentPost?.data?.post.ap_id !== firstPost;

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    Haptics.impact({ style: ImpactStyle.Medium });

    if (!isRefetching) {
      Promise.all([refetch(), mostRecentPost.refetch()]).finally(() => {
        event.detail.complete();
      });
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const scrollAnimation = useHideHeaderTabBar(
    scrollRef.current,
    focused && media.maxMd,
  );

  return (
    <IonPage>
      <IonHeader className="bg-background dismissable">
        <IonToolbar data-tauri-drag-region className="dismissable">
          <IonButtons slot="start">
            <HomeFilter />
          </IonButtons>
          <form
            className="max-md:hidden"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/home/s?q=${search}`);
            }}
          >
            <IonSearchbar
              className="max-w-md mx-auto"
              value={search}
              onIonInput={(e) => setSearch(e.detail.value ?? "")}
            />
          </form>
          <IonButtons slot="end" className="gap-4">
            <Link
              to="/home/s"
              className="text-2xl contents text-brand md:hidden"
            >
              <IonIcon icon={searchOutline} />
            </Link>
            <PostSortBar align="end" />
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false} fullscreen={media.maxMd}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <FlashList
          key={postSort + listingType}
          onFocusChange={setFocused}
          ref={scrollRef}
          estimatedItemSize={450}
          data={data}
          renderItem={({ item }) => {
            return (
              <Post
                key={item.apId}
                {...item}
                onNavigate={scrollAnimation.reset}
              />
            );
          }}
          className="h-full ion-content-scroll-host absolute inset-0 pt-[var(--offset-top)] pb-[var(--offset-bottom)]"
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onScroll={scrollAnimation.scrollHandler}
        />
        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0">
          <div className="flex-1" />
          <PopularCommunitiesSidebar />
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
