import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  useVirtualizer,
  VirtualItem,
  defaultRangeExtractor,
  Range,
  Virtualizer,
} from "@tanstack/react-virtual";
import {
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonRouter,
} from "@ionic/react";
import { twMerge } from "tailwind-merge";
import { subscribeToScrollEvent } from "../lib/scroll-events";
import _ from "lodash";
import {
  useElementHadFocus,
  useIsInAppBrowserOpen,
  useMedia,
} from "../lib/hooks";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useAuth } from "../stores/auth";
import { cn } from "../lib/utils";
import { COMMENT_COLLAPSE_EVENT } from "./posts/config";

function useElementHeight<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  initHeight = 0,
): number {
  const [height, setHeight] = useState(initHeight);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set initial height
    setHeight(el.clientHeight);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use contentRect for height
        setHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}

/**
 * This is a hack that prevents the virtualizer from shifting the
 * scroll for 50ms after a comment is expanded/collapsed
 */
function usePreventScrollJumpingOnCommentCollapse({
  container,
  virtualizer,
}: {
  container: HTMLDivElement | null;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
}) {
  useEffect(() => {
    let shouldAdjust = true;
    if (!container) {
      return;
    }

    const { shouldAdjustScrollPositionOnItemSizeChange } = virtualizer;
    virtualizer.shouldAdjustScrollPositionOnItemSizeChange = (...args) => {
      if (!shouldAdjust) {
        return false;
      }
      return shouldAdjustScrollPositionOnItemSizeChange?.(...args) ?? false;
    };

    let timeoutId: undefined | number;
    const onToggle = () => {
      window.clearTimeout(timeoutId);
      shouldAdjust = false;
      timeoutId = window.setTimeout(() => {
        shouldAdjust = true;
      }, 50);
    };

    container.addEventListener(COMMENT_COLLAPSE_EVENT, onToggle);
    return () => {
      container.removeEventListener(COMMENT_COLLAPSE_EVENT, onToggle);
      virtualizer.shouldAdjustScrollPositionOnItemSizeChange =
        shouldAdjustScrollPositionOnItemSizeChange;
    };
  }, [container]);
}

function useRouterSafe() {
  try {
    return useIonRouter();
  } catch {
    return null;
  }
}

function VirtualListInternal<T>({
  data,
  estimatedItemSize,
  onEndReached,
  renderItem,
  stickyHeaderIndices,
  stickyFooterIndices,
  keepMountedIndices,
  ref,
  drawDistance,
  numColumns,
  onFocusChange,
  placeholder,
  numPlaceholders = 25,
  header,
  footer,
}: {
  data?: T[] | readonly T[];
  estimatedItemSize: number;
  onEndReached?: () => any;
  renderItem: (params: { item: T; index: number }) => React.ReactNode;
  keepMountedIndices?: number[];
  stickyHeaderIndices?: number[];
  stickyFooterIndices?: number[];
  ref: React.RefObject<HTMLDivElement | null>;
  drawDistance?: number;
  numColumns?: number;
  onFocusChange?: (focused: boolean) => any;
  placeholder?: ReactNode;
  numPlaceholders?: number;
  header?: ReactNode[];
  footer?: ReactNode[];
}) {
  const index = useRef(0);
  const offset = useRef(0);
  const cache = useRef<VirtualItem[]>([]);

  const scrollRef = ref;

  const initialItem = cache.current?.[index.current];

  const dataLen = data?.length;

  const activeStickyHeaderIndexRef = useRef(-1);
  const activeStickyFooterIndexRef = useRef(-1);

  const isActiveStickyHeader = (index: number) =>
    activeStickyHeaderIndexRef.current === index;

  const isActiveStickyFooter = (index: number) =>
    activeStickyFooterIndexRef.current === index;

  const overscan =
    drawDistance && estimatedItemSize
      ? Math.round(drawDistance / estimatedItemSize)
      : undefined;

  const focused = useElementHadFocus(scrollRef);

  useEffect(() => onFocusChange?.(focused), [focused]);

  let count = dataLen || (placeholder ? numPlaceholders : 0);
  if (header) {
    count += header.length;
  }
  if (footer) {
    count += footer.length;
  }
  const rowVirtualizer = useVirtualizer({
    count,
    overscan,
    lanes: numColumns === 1 ? undefined : numColumns,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => cache.current?.[index]?.size ?? estimatedItemSize,
    onChange: (instance) => {
      if (
        scrollRef.current &&
        scrollRef.current?.getBoundingClientRect().height > 0
      ) {
        cache.current = instance.measurementsCache;
        const scrollOffset = instance?.scrollOffset ?? 0;
        const firstItem = instance
          .getVirtualItems()
          .find((item) => item.start >= scrollOffset);

        index.current = firstItem?.index ?? 0;
        offset.current = firstItem ? scrollOffset - firstItem.start : 0;
      }
    },
    initialMeasurementsCache: cache.current,
    initialOffset: initialItem ? initialItem.start + offset.current : 0,
    enabled: focused,
    rangeExtractor: useCallback(
      (range: Range) => {
        const normalizedStickyFooterIndicies = stickyFooterIndices?.map(
          (index) => {
            if (index < 0) {
              return count + index;
            }
            return index;
          },
        );

        activeStickyHeaderIndexRef.current = stickyHeaderIndices
          ? ([...stickyHeaderIndices]
              .reverse()
              .find((index) => range.startIndex >= index) ?? -1)
          : -1;

        console.log(range);

        activeStickyFooterIndexRef.current = normalizedStickyFooterIndicies
          ? ([...normalizedStickyFooterIndicies].find((index) => {
              return index >= range.endIndex;
            }) ?? -1)
          : -1;

        const all = new Set<number>([
          ...(stickyHeaderIndices ?? []),
          ...(keepMountedIndices ?? []),
          ...defaultRangeExtractor(range),
          ...(normalizedStickyFooterIndicies ?? []),
        ]);

        return Array.from(all).sort((a, b) => a - b);
      },
      [stickyHeaderIndices, stickyFooterIndices, keepMountedIndices, count],
    ),
  });

  usePreventScrollJumpingOnCommentCollapse({
    container: scrollRef.current,
    virtualizer: rowVirtualizer,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem || _.isNil(dataLen)) {
      return;
    }
    if (lastItem.index >= dataLen - 1) {
      onEndReached?.();
    }
  }, [dataLen, rowVirtualizer.getVirtualItems(), onEndReached]);

  const containerHeight = useElementHeight(scrollRef, window.innerHeight);

  const colWidth = 100 / (numColumns ?? 1);

  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: "100%",
        position: "relative",
      }}
    >
      {/* Only the visible items in the virtualizer, manually positioned to be in view */}
      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
        if (!virtualItem) {
          console.warn("Attempted to stick an item index that doesn't exist");
          // This can be triggered if sticky item is set to an
          // index that does not exist
          return null;
        }

        let index = virtualItem.index;
        if (header) {
          index -= header.length;
        }
        const item = data?.[index];

        const showHeader = header && virtualItem.index < header?.length;

        const distanceFromEnd = count - virtualItem.index;
        const footerIndex = footer ? footer.length - distanceFromEnd : -1;

        const isStuckHeader = isActiveStickyHeader(virtualItem.index);
        const isStuckFooter = isActiveStickyFooter(virtualItem.index);

        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            data-is-sticky-header={isStuckHeader}
            data-is-sticky-footer={isStuckFooter}
            ref={rowVirtualizer.measureElement}
            className={cn(isStuckHeader && "max-md:bg-background")}
            style={
              isStuckHeader
                ? {
                    position: "sticky",
                    zIndex: 1,
                    top: 0,
                  }
                : isStuckFooter
                  ? {
                      position: "sticky",
                      zIndex: 1,
                      top: 0,
                      transform: `translateY(${
                        containerHeight - virtualItem.size
                      }px)`,
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
            {item
              ? renderItem?.({
                  item,
                  index,
                })
              : showHeader
                ? header[virtualItem.index]
                : (footer?.[footerIndex] ?? placeholder)}
          </div>
        );
      })}
    </div>
  );
}

export function VirtualList<T>({
  ref,
  onFocusChange,
  className,
  onScroll,
  refresh,
  ...props
}: {
  data?: T[] | readonly T[];
  estimatedItemSize: number;
  onEndReached?: () => any;
  renderItem: (params: { item: T; index: number }) => React.ReactNode;
  keepMountedIndices?: number[];
  stickyHeaderIndices?: number[];
  stickyFooterIndices?: number[];
  ref?: React.RefObject<HTMLDivElement | null>;
  drawDistance?: number;
  numColumns?: number;
  className?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => any;
  onFocusChange?: (focused: boolean) => any;
  refresh?: () => Promise<any>;
  placeholder?: ReactNode;
  numPlaceholders?: number;
  header?: ReactNode[];
  footer?: ReactNode[];
}) {
  const media = useMedia();
  const [key, setKey] = useState(0);

  const accountIndex = useAuth((s) => s.accountIndex);

  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = ref ?? internalRef;

  const [focused, setFocused] = useState(false);

  const r = useRouterSafe();
  const pathname = r?.routeInfo?.pathname;
  useEffect(() => {
    if (pathname) {
      return subscribeToScrollEvent(pathname, () => {
        setKey((k) => k + 1);
      });
    }
  }, [pathname]);

  const isBrowserOpen = useIsInAppBrowserOpen();
  useEffect(() => {
    if (focused && !isBrowserOpen) {
      const listener = () => {
        setKey((k) => k + 1);
      };
      window.addEventListener("statusTap", listener);
      return () => window.removeEventListener("statusTap", listener);
    }
  }, [focused, isBrowserOpen]);

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    Haptics.impact({ style: ImpactStyle.Medium });
    refresh?.().finally(() => event.detail.complete());
  }

  const numCols = props.numColumns ?? 1;

  return (
    // Hide refresher on large screen sizes, because it kept
    // getting triggered by my mouse
    <>
      {refresh && media.maxMd && (
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
      )}

      <div
        ref={scrollRef}
        className={twMerge(
          "overflow-y-scroll overscroll-auto flex-1",
          className,
        )}
        style={{
          scrollbarGutter: media.xxl
            ? numCols > 1
              ? "stable"
              : "stable both-edges"
            : undefined,
        }}
        onScroll={onScroll}
      >
        <VirtualListInternal
          key={`${key}-${props.numColumns}-${accountIndex}`}
          {...props}
          ref={scrollRef}
          onFocusChange={(newFocused) => {
            setFocused(newFocused);
            onFocusChange?.(newFocused);
          }}
        />
      </div>
    </>
  );
}
