import { ContentGutters } from "@/src/components/gutters";
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCommunity, usePosts } from "@/src/lib/api";
import _ from "lodash";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from "@ionic/react";
import { useRecentCommunitiesStore } from "@/src/stores/recent-communities";

import { UserDropdown } from "@/src/components/nav";
import { PageTitle } from "@/src/components/page-title";
import { useFiltersStore } from "@/src/stores/filters";
import {
  useElementHadFocus,
  useHideTabBarOnMount,
  useIsActiveRoute,
  useNavbarHeight,
  useSafeAreaInsets,
  useUrlSearchState,
} from "@/src/lib/hooks";
import { ToolbarTitle } from "@/src/components/toolbar/toolbar-title";
import { useAuth } from "@/src/stores/auth";
import { ToolbarBackButton } from "@/src/components/toolbar/toolbar-back-button";
import { cn } from "@/src/lib/utils";
import { ResponsiveImage } from "./light-box";
import {
  PostCommentsButton,
  PostShareButton,
  Voting,
} from "@/src/components/posts/post-buttons";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePostsStore } from "@/src/stores/posts";
import z from "zod";
import { decodeApId } from "@/src/lib/api/utils";

const EMPTY_ARR: never[] = [];

function HorizontalVirtualizer<T>({
  data,
  renderItem,
  initIndex = 0,
}: {
  data?: T[] | readonly T[];
  renderItem: (params: { item: T; index: number }) => React.ReactNode;
  initIndex?: number;
}) {
  const count = data?.length ?? 0;

  const scrollRef = useRef<HTMLDivElement>(null);

  const itemWidth = scrollRef.current?.clientWidth ?? window.innerWidth;

  const initialOffset = initIndex * itemWidth;

  const focused = useElementHadFocus(scrollRef);

  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => itemWidth,
    horizontal: true,
    initialMeasurementsCache: Array.from({
      length: count,
    })
      .fill(0)
      .map((_i, index) => ({
        key: index,
        index: index,
        start: index * itemWidth,
        end: index * itemWidth + itemWidth,
        size: itemWidth,
        lane: 0,
      })),
    initialOffset: initialOffset,
    enabled: focused,
    initialRect: {
      width: itemWidth,
      height: window.innerHeight,
    },
  });

  return (
    <div
      ref={scrollRef}
      className={cn(
        "overflow-x-scroll overflow-y-hidden snap-x snap-mandatory h-full w-full relative",
      )}
    >
      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
        const item = data?.[virtualItem.index];
        return item ? (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            style={{
              width: itemWidth,
              minWidth: itemWidth,
              maxWidth: itemWidth,
              position: "absolute",
              inset: 0,
              transform: `translateX(${virtualItem.start}px)`,
            }}
            className="relative snap-start"
          >
            {renderItem?.({
              item,
              index: virtualItem.index,
            })}
          </div>
        ) : null;
      })}
    </div>
  );
}

const Post = memo(
  ({
    apId,
    paddingY,
    onZoom,
  }: {
    apId: string;
    paddingY: number;
    onZoom: (scale: number) => void;
  }) => {
    const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
    const postView = usePostsStore(
      (s) => s.posts[getCachePrefixer()(apId)]?.data,
    );
    const img = postView?.thumbnailUrl;
    return img ? (
      <ResponsiveImage img={img} onZoom={onZoom} paddingY={paddingY} />
    ) : null;
  },
);

export default function LightBoxPostFeed() {
  useHideTabBarOnMount();

  const [initApId] = useUrlSearchState("apId", "", z.string());
  const decodedApId = decodeApId(initApId);

  const [hideNav, setHideNav] = useState(false);
  const navbar = useNavbarHeight();
  const isActive = useIsActiveRoute();

  const insets = useSafeAreaInsets();
  const tabbar = {
    height: navbar.height,
    inset: insets.bottom,
  };

  const postSort = useFiltersStore((s) => s.postSort);
  const listingType = useFiltersStore((s) => s.listingType);
  const posts = usePosts({
    sort: postSort,
    type: listingType,
  });
  const data = useMemo(
    () => _.uniq(posts.data?.pages.flatMap((p) => p.imagePosts)) ?? EMPTY_ARR,
    [posts.data],
  );

  const initIndex = data.findIndex((apId) => apId === decodedApId);

  const community = useCommunity({
    name: "",
  });

  const updateRecent = useRecentCommunitiesStore((s) => s.update);

  useEffect(() => {
    if (community.data) {
      updateRecent(community.data.community);
    }
  }, [community.data]);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  return (
    <IonPage className="dark">
      <PageTitle>Image</PageTitle>
      <IonHeader translucent={true}>
        <IonToolbar
          style={{
            "--ion-toolbar-background": "transparent",
            "--ion-toolbar-border-color": "var(--shad-border)",
          }}
          className={cn(
            isActive && "absolute backdrop-blur-2xl",
            hideNav && "opacity-0",
          )}
        >
          <IonButtons slot="start" className="gap-2">
            <ToolbarBackButton />
            <ToolbarTitle size="sm">Posts</ToolbarTitle>
          </IonButtons>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent
        fullscreen={true}
        style={{
          "--ion-background-color": "black",
        }}
        scrollY={false}
      >
        <ContentGutters className="h-full max-md:px-0">
          <HorizontalVirtualizer
            initIndex={initIndex}
            data={data}
            renderItem={(item) => (
              <Post
                apId={item.item}
                paddingY={
                  navbar.height + navbar.inset + tabbar.height + tabbar.inset
                }
                onZoom={(scale) => setHideNav(scale > 1.05)}
              />
            )}
          />
        </ContentGutters>
      </IonContent>
      <div
        className={cn(
          "border-t-[.5px] z-10 absolute bottom-0 inset-x-0 backdrop-blur-2xl",
          hideNav && "opacity-0",
          !isActive && "hidden",
        )}
        style={{
          height: tabbar.height + tabbar.inset,
          paddingBottom: tabbar.inset,
        }}
      >
        <ContentGutters>
          <div className="h-[60px] flex flex-row items-center">
            <PostShareButton postApId="" />
            <div className="flex-1" />
            <PostCommentsButton
              commentsCount={0}
              communityName={""}
              postApId={""}
            />
            <Voting apId={""} score={100} myVote={0} />
          </div>
        </ContentGutters>
      </div>
    </IonPage>
  );
}
