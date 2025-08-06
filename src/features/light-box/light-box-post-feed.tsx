import { ContentGutters } from "@/src/components/gutters";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useTabbarHeight,
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
  PostVoting,
  usePostVoting,
} from "@/src/components/posts/post-buttons";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePostsStore } from "@/src/stores/posts";
import z from "zod";
import { decodeApId, encodeApId } from "@/src/lib/api/utils";
import { useLinkContext } from "@/src/routing/link-context";
import { useParams } from "@/src/routing";

const EMPTY_ARR: never[] = [];

function HorizontalVirtualizer<T>({
  data,
  renderItem,
  initIndex = 0,
  onIndexChange,
  onEndReached,
  className,
}: {
  data?: T[] | readonly T[];
  renderItem: (params: { item: T; index: number }) => React.ReactNode;
  initIndex?: number;
  onIndexChange: (index: number) => void;
  onEndReached?: () => any;
  className?: string;
}) {
  const count = data?.length ?? 0;

  const scrollRef = useRef<HTMLDivElement>(null);

  const itemWidth = scrollRef.current?.clientWidth ?? window.innerWidth;

  const initialOffset = initIndex * itemWidth;

  const focused = useElementHadFocus(scrollRef);

  const rowVirtualizer = useVirtualizer({
    count,
    overscan: 2,
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

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem || _.isNil(count)) {
      return;
    }
    if (lastItem.index >= count - 1) {
      onEndReached?.();
    }
  }, [count, rowVirtualizer.getVirtualItems(), onEndReached]);

  const isReady = rowVirtualizer.getVirtualIndexes().includes(initIndex);

  const updateIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !isReady) return;
    const offset = rowVirtualizer.scrollOffset ?? 0;
    const cache = rowVirtualizer.measurementsCache;

    let bestIndex = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < cache.length; i++) {
      const item = cache[i];
      if (_.isNil(item)) {
        continue;
      }
      const start = item.start;
      const distance = Math.abs(offset - start);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      } else {
        // Since cache is sorted by `start`, once distance grows
        // beyond the minimum we've seen, it will only increase.
        break;
      }
    }

    if (bestIndex > -1 && bestIndex !== initIndex) {
      onIndexChange(bestIndex);
    }
  }, [isReady, rowVirtualizer.measurementsCache, initIndex]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        updateIndex();
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [updateIndex]);

  const [snap, setSnap] = useState(true);

  const timerRef = useRef<number>(-1);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "j":
          window.clearTimeout(timerRef.current);
          e.preventDefault();
          e.stopPropagation();
          setSnap(false);
          rowVirtualizer.scrollBy(-itemWidth, {
            behavior: "auto",
            align: "start",
          });
          updateIndex();
          timerRef.current = window.setTimeout(() => {
            setSnap(true);
          }, 50);
          break;
        case "d":
        case "k":
        case "ArrowRight":
          window.clearTimeout(timerRef.current);
          e.preventDefault();
          e.stopPropagation();
          setSnap(false);
          rowVirtualizer.scrollBy(itemWidth, {
            behavior: "auto",
            align: "start",
          });
          updateIndex();
          timerRef.current = window.setTimeout(() => {
            setSnap(true);
          }, 50);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [itemWidth, rowVirtualizer.scrollBy, updateIndex]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "overflow-x-scroll overflow-y-hidden hide-scrollbars h-full w-full relative",
        snap && "snap-x snap-mandatory",
        className,
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
            className="relative snap-start snap-always"
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
    paddingT,
    paddingB,
    onZoom,
  }: {
    apId: string;
    paddingT: number;
    paddingB: number;
    onZoom: (scale: number) => void;
  }) => {
    const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
    const postView = usePostsStore(
      (s) => s.posts[getCachePrefixer()(apId)]?.data,
    );
    const img = postView?.thumbnailUrl;
    return img ? (
      <ResponsiveImage
        img={img}
        onZoom={onZoom}
        paddingT={paddingT}
        paddingB={paddingB}
        className="border-x border-background -mx-px"
      />
    ) : null;
  },
);

export default function LightBoxPostFeed() {
  useHideTabBarOnMount();

  const linkCtx = useLinkContext();
  const { communityName } = useParams(
    `${linkCtx.root}c/:communityName/lightbox`,
  );

  const [encodedApId, setEncodedApId] = useUrlSearchState(
    "apId",
    "",
    z.string(),
  );
  const decodedApId = decodeApId(encodedApId);

  const [hideNav, setHideNav] = useState(false);
  const navbar = useNavbarHeight();
  const isActive = useIsActiveRoute();

  const tabbar = useTabbarHeight();

  const listingType = useFiltersStore((s) => s.listingType);
  const posts = usePosts(
    communityName
      ? {
          communitySlug: communityName,
        }
      : {
          type: listingType,
        },
  );
  const data = useMemo(
    () => _.uniq(posts.data?.pages.flatMap((p) => p.imagePosts)) ?? EMPTY_ARR,
    [posts.data],
  );

  const initIndex = data.findIndex((apId) => apId === decodedApId);

  const postApId = data[initIndex];
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = usePostsStore((s) =>
    postApId ? s.posts[getCachePrefixer()(postApId)]?.data : null,
  );

  const community = useCommunity({
    name: communityName,
  });

  const updateRecent = useRecentCommunitiesStore((s) => s.update);

  useEffect(() => {
    if (community.data) {
      updateRecent(community.data.community);
    }
  }, [community.data]);

  const voting = usePostVoting(postApId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (post) {
        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "h":
            e.preventDefault();
            e.stopPropagation();
            voting?.vote.mutate({
              score: voting.isUpvoted ? 0 : 1,
              postApId: post.apId,
              postId: post.id,
            });
            break;
          case "ArrowDown":
          case "s":
          case "l":
            e.preventDefault();
            e.stopPropagation();
            voting?.vote.mutate({
              score: voting.isDownvoted ? 0 : -1,
              postApId: post.apId,
              postId: post.id,
            });
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [voting?.vote]);

  return (
    <IonPage className="dark">
      <PageTitle>Image</PageTitle>
      <IonHeader>
        <IonToolbar
          style={{
            "--ion-toolbar-background": hideNav
              ? "transparent"
              : "var(--shad-background)",
            "--ion-toolbar-border-color": "var(--shad-border)",
          }}
          className={cn(
            "dark",
            isActive && "backdrop-blur-2xl",
            hideNav && "opacity-0",
          )}
        >
          <IonButtons slot="start" className="gap-2">
            <ToolbarBackButton />
            <ToolbarTitle size="sm">{post?.title ?? "Loading..."}</ToolbarTitle>
          </IonButtons>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent
        fullscreen
        style={{
          "--ion-background-color": "black",
        }}
        scrollY={false}
        className="absolute inset-0"
      >
        <HorizontalVirtualizer
          key={posts.isPending ? "pending" : "loaded"}
          onIndexChange={(newIndex) => {
            const newApId = data[newIndex];
            if (newApId && !posts.isPending) {
              setEncodedApId(encodeApId(newApId));
            }
          }}
          initIndex={initIndex}
          data={data}
          renderItem={(item) => (
            <Post
              apId={item.item}
              paddingT={navbar.height + navbar.inset}
              paddingB={tabbar.height + tabbar.inset}
              onZoom={(scale) => setHideNav(scale > 1.05)}
            />
          )}
          onEndReached={() => {
            if (posts.hasNextPage && !posts.isFetchingNextPage) {
              posts.fetchNextPage();
            }
          }}
        />
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
        <ContentGutters className="h-full">
          <div className="flex flex-row items-center gap-3">
            {postApId && <PostShareButton postApId={postApId} />}
            <div className="flex-1" />
            {postApId && <PostCommentsButton postApId={postApId} />}
            {postApId && <PostVoting key={postApId} apId={postApId} />}
          </div>
        </ContentGutters>
      </div>
    </IonPage>
  );
}
