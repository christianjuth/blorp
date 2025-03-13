import { useCallback, useEffect, useRef } from "react";
import {
  useVirtualizer,
  VirtualItem,
  defaultRangeExtractor,
  Range,
} from "@tanstack/react-virtual";
import { useIsFocused } from "one";
import { FlashListProps } from "@shopify/flash-list";

export function FlashList<T>({
  data,
  estimatedItemSize,
  onEndReached,
  renderItem,
  stickyHeaderIndices,
  // @ts-expect-error
  ref,
  drawDistance,
}: FlashListProps<T>) {
  const index = useRef(0);
  const offset = useRef(0);
  const cache = useRef<VirtualItem[]>([]);

  const focused = useIsFocused();

  const parentRef = useRef<HTMLDivElement>(null);

  if (ref) {
    ref.current = {
      scrollToOffset: (offset: number) => {
        parentRef.current?.scrollTo({
          top: offset,
        });
      },
    };
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

  const rowVirtualizer = useVirtualizer({
    count: dataLen,
    overscan,
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

  return (
    <div
      ref={parentRef}
      style={{
        overflow: "auto",
        overscrollBehavior: "auto",
        scrollbarGutter: "stable both-edges",
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
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }
              }
            >
              {renderItem?.({
                item,
                index: virtualItem.index,
                target: {} as any,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
