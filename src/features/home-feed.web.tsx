import { PostCard } from "~/src/components/posts/post";
import { View } from "tamagui";
import { ContentGutters } from "../components/gutters";
import { PopularCommunitiesSidebar } from "../components/populat-communities-sidebar";
import { useScrollToTop } from "@react-navigation/native";
import { useCallback, useEffect, useRef } from "react";
import { PostSortBar } from "../components/lemmy-sort";
import { useFiltersStore } from "../stores/filters";
import { usePosts } from "../lib/lemmy";
import {
  useVirtualizer,
  VirtualItem,
  defaultRangeExtractor,
  Range,
} from "@tanstack/react-virtual";
import { useIsFocused } from "one";

const EMPTY_ARR = [];

let index = 0;
let offset = 0;

let cache: VirtualItem[] = [];

export function HomeFeed() {
  const postSort = useFiltersStore((s) => s.postSort);
  const listingType = useFiltersStore((s) => s.listingType);

  const posts = usePosts({
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

  const data = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

  const items = ["header", ...data];

  const parentRef = useRef<HTMLDivElement>(null);

  const focused = useIsFocused();

  const initialItem = cache?.[index];

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => cache?.[index]?.size ?? 450,
    onChange: (instance) => {
      if (
        parentRef.current &&
        parentRef.current?.getBoundingClientRect().height > 0
      ) {
        cache = instance.measurementsCache;
        const scrollOffset = instance?.scrollOffset ?? 0;
        const firstItem = instance
          .getVirtualItems()
          .find((item) => item.start >= scrollOffset);
        if (scrollOffset > 0) {
          index = firstItem?.index ?? 0;
          offset = firstItem ? scrollOffset - firstItem.start : 0;
        }
      }
    },
    initialMeasurementsCache: cache,
    initialOffset: initialItem ? initialItem.start + offset : 0,
    enabled: focused,
    rangeExtractor: useCallback((range: Range) => {
      const next = new Set([0, ...defaultRangeExtractor(range)]);
      return Array.from(next).sort((a, b) => a - b);
    }, []),
  });

  useScrollToTop({
    current: {
      scrollToTop: () => {
        index = 0;
        offset = 0;
        rowVirtualizer.scrollToIndex(0);
      },
    },
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= items.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    items.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  return (
    <>
      <ContentGutters>
        <View flex={1} />
        <View>
          <PopularCommunitiesSidebar />
        </View>
      </ContentGutters>

      <div
        ref={parentRef}
        style={{
          overflow: "auto", // Make it scroll!
        }}
      >
        {/* The large inner element to hold all of the items */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {/* Only the visible items in the virtualizer, manually positioned to be in view */}
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const item = items[virtualItem.index];

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={
                  item === "header"
                    ? {
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }
                    : {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualItem.start}px)`,
                      }
                }
              >
                {item === "header" ? (
                  <ContentGutters bg="$background">
                    <View
                      flex={1}
                      py="$2"
                      bg="$background"
                      $md={{ dsp: "none" }}
                    >
                      <PostSortBar />
                    </View>
                    <></>
                  </ContentGutters>
                ) : (
                  <ContentGutters>
                    <PostCard
                      apId={items[virtualItem.index]}
                      featuredContext="home"
                    />
                    <></>
                  </ContentGutters>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
