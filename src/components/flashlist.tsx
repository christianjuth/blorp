import { useCallback, useEffect, useRef, useState } from "react";
import {
  useVirtualizer,
  VirtualItem,
  defaultRangeExtractor,
  Range,
} from "@tanstack/react-virtual";
import { useIonRouter } from "@ionic/react";
import { useRouteMatch } from "react-router";
import { twMerge } from "tailwind-merge";

function useIsFocused() {
  let currentPath: string | null = null;
  let routePath: string | null = null;

  try {
    currentPath = useIonRouter()?.routeInfo?.pathname;
  } catch {}
  try {
    routePath = useRouteMatch().path;
  } catch {}

  const nextIsFocused = routePath === currentPath;

  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (nextIsFocused !== focused) {
      requestAnimationFrame(() => {
        setFocused(nextIsFocused);
      });
    }
  }, [nextIsFocused, focused]);

  if (currentPath === null || routePath === null) {
    return true;
  }

  return focused;
}

export function FlashList<T>({
  data,
  estimatedItemSize,
  onEndReached,
  renderItem,
  stickyHeaderIndices,
  ref,
  drawDistance,
  numColumns,
  scrollGutterBothEdges,
  className,
}: {
  data?: T[] | readonly T[];
  estimatedItemSize: number;
  onEndReached?: () => any;
  renderItem: (params: { item: T; index: number }) => React.ReactNode;
  stickyHeaderIndices?: number[];
  ref?: React.RefObject<HTMLDivElement | null>;
  drawDistance?: number;
  numColumns?: number;
  scrollGutterBothEdges?: boolean;
  className?: string;
}) {
  const index = useRef(0);
  const offset = useRef(0);
  const cache = useRef<VirtualItem[]>([]);

  // const focused = useIsFocused();

  const parentRef = useRef<HTMLDivElement>(null);

  if (ref) {
    // ref.current = {
    //   scrollToOffset: (offset: number) => {
    //     parentRef.current?.scrollTo({
    //       top: offset,
    //     });
    //   },
    // };
  }

  const initialItem = cache.current?.[index.current];

  const dataLen = data?.length ?? 0;

  const activeStickyIndexRef = useRef(-1);

  const isActiveSticky = (index: number) =>
    activeStickyIndexRef.current === index;

  const overscan =
    drawDistance && estimatedItemSize
      ? Math.round(drawDistance / estimatedItemSize)
      : undefined;

  const focused = useIsFocused();

  const rowVirtualizer = useVirtualizer({
    count: dataLen,
    overscan,
    lanes: numColumns,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => cache.current?.[index]?.size ?? estimatedItemSize,
    onChange: (instance) => {
      if (
        parentRef.current &&
        parentRef.current?.getBoundingClientRect().height > 0
      ) {
        cache.current = instance.measurementsCache;
        const scrollOffset = instance?.scrollOffset ?? 0;
        const firstItem = instance
          .getVirtualItems()
          .find((item) => item.start >= scrollOffset);
        if (scrollOffset > 0) {
          index.current = firstItem?.index ?? 0;
          offset.current = firstItem ? scrollOffset - firstItem.start : 0;
        }
      }
    },
    initialMeasurementsCache: cache.current,
    initialOffset: initialItem ? initialItem.start + offset.current : 0,
    enabled: focused,
    rangeExtractor: useCallback((range: Range) => {
      if (!stickyHeaderIndices) {
        return defaultRangeExtractor(range);
      }

      activeStickyIndexRef.current =
        [...stickyHeaderIndices]
          .reverse()
          .find((index) => range.startIndex >= index) ?? -1;

      const next = new Set([
        ...stickyHeaderIndices,
        ...defaultRangeExtractor(range),
      ]);
      return Array.from(next).sort((a, b) => a - b);
    }, []),
  });

  // useScrollToTop({
  //   current: {
  //     scrollToTop: () => {
  //       index = 0;
  //       offset = 0;
  //       rowVirtualizer.scrollToIndex(0);
  //     },
  //   },
  // });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem) {
      return;
    }
    if (lastItem.index >= dataLen - 1) {
      onEndReached?.();
    }
  }, [dataLen, rowVirtualizer.getVirtualItems(), onEndReached]);

  const colWidth = 100 / (numColumns ?? 1);

  console.log(
    dataLen,
    estimatedItemSize,
    rowVirtualizer.getVirtualItems(),
    focused,
  );

  return (
    <>
      <div
        ref={parentRef}
        style={
          {
            // scrollbarGutter: `stable${scrollGutterBothEdges ? "both-edges" : ""}`,
          }
        }
        className={twMerge("overflow-auto overscroll-auto flex-1", className)}
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
            const item = data?.[virtualItem.index];

            if (!item) {
              return null;
            }

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={
                  isActiveSticky(virtualItem.index)
                    ? {
                        position: "sticky",
                        zIndex: 1,
                        top: 0,
                      }
                    : {
                        position: "absolute",
                        top: 0,
                        left: `${colWidth * virtualItem.lane}%`,
                        width: `${colWidth}%`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }
                }
              >
                {renderItem?.({
                  item,
                  index: virtualItem.index,
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
