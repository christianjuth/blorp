import {
  UIEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useVirtualizer,
  VirtualItem,
  defaultRangeExtractor,
  Range,
} from "@tanstack/react-virtual";
import { useIonRouter } from "@ionic/react";
import { twMerge } from "tailwind-merge";

import { RefObject } from "react";
import { subscribeToScrollEvent } from "../lib/scroll-events";
import _ from "lodash";

interface ObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export function useIntersectionObserver<T extends HTMLElement | null>(
  ref: RefObject<T>,
  options: ObserverOptions = { root: null, rootMargin: "0px", threshold: 0.1 },
): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      options,
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options.root, options.rootMargin, options.threshold]);

  return isVisible;
}

function useRouterSafe() {
  try {
    return useIonRouter();
  } catch {
    return null;
  }
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
  dismissHeaderTabBar,
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
  dismissHeaderTabBar?: boolean;
}) {
  const index = useRef(0);
  const offset = useRef(0);
  const cache = useRef<VirtualItem[]>([]);

  const parentRef = useRef<HTMLDivElement>(null);

  const initialItem = cache.current?.[index.current];

  const dataLen = data?.length ?? 0;

  const activeStickyIndexRef = useRef(-1);

  const isActiveSticky = (index: number) =>
    activeStickyIndexRef.current === index;

  const overscan =
    drawDistance && estimatedItemSize
      ? Math.round(drawDistance / estimatedItemSize)
      : undefined;

  const focused = useIntersectionObserver(parentRef);

  const rowVirtualizer = useVirtualizer({
    count: dataLen,
    overscan,
    lanes: numColumns === 1 ? undefined : numColumns,
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

        index.current = firstItem?.index ?? 0;
        offset.current = firstItem ? scrollOffset - firstItem.start : 0;
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

  const r = useRouterSafe();
  const pathname = r?.routeInfo.pathname;
  useEffect(() => {
    if (pathname) {
      return subscribeToScrollEvent(pathname, () => {
        if (rowVirtualizer.scrollOffset) {
          rowVirtualizer.scrollToIndex(0, { behavior: "smooth" });
        }
      });
    }
  }, [pathname]);

  useEffect(() => {
    if (focused) {
      const listener = () => {
        rowVirtualizer.scrollToIndex(0, { behavior: "smooth" });
      };
      window.addEventListener("statusTap", listener);
      return () => window.removeEventListener("statusTap", listener);
    }
  }, [focused]);

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

  const prevOffsetRef = useRef<number | null>(null);
  const headerAnimateRef = useRef(0);
  const tabBarAnimateRef = useRef(0);

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
  }, [focused]);

  const throttledHandleScroll = useCallback(
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
    if (!focused || !dismissHeaderTabBar) {
      prevOffsetRef.current = null;
      headerAnimateRef.current = 0;
      tabBarAnimateRef.current = 0;
      if (header && tabBar && toolbar) {
        header.style.transform = `translate(0)`;
        toolbar.style.opacity = "1";
        tabBar.style.transform = `translate(0)`;
      }
    } else {
      prevOffsetRef.current = parentRef.current?.scrollTop ?? 0;
    }
  }, [focused, dismissHeaderTabBar, tabBar, header, toolbar]);

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
        onScroll={dismissHeaderTabBar ? throttledHandleScroll : undefined}
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
