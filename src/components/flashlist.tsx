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
import {
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonRouter,
} from "@ionic/react";
import { twMerge } from "tailwind-merge";

import { subscribeToScrollEvent } from "../lib/scroll-events";
import _ from "lodash";
import { useElementHadFocus } from "../lib/hooks";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

function useRouterSafe() {
  try {
    return useIonRouter();
  } catch {
    return null;
  }
}

export function FlashListInternal<T>({
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
  onScroll,
  onFocusChange,
}: {
  data?: T[] | readonly T[];
  estimatedItemSize: number;
  onEndReached?: () => any;
  renderItem: (params: { item: T; index: number }) => React.ReactNode;
  stickyHeaderIndices?: number[];
  ref: React.RefObject<HTMLDivElement | null>;
  drawDistance?: number;
  numColumns?: number;
  scrollGutterBothEdges?: boolean;
  className?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => any;
  onFocusChange?: (focused: boolean) => any;
}) {
  const index = useRef(0);
  const offset = useRef(0);
  const cache = useRef<VirtualItem[]>([]);

  const scrollRef = ref;

  const initialItem = cache.current?.[index.current];

  const dataLen = data?.length ?? 0;

  const activeStickyIndexRef = useRef(-1);

  const isActiveSticky = (index: number) =>
    activeStickyIndexRef.current === index;

  const overscan =
    drawDistance && estimatedItemSize
      ? Math.round(drawDistance / estimatedItemSize)
      : undefined;

  const focused = useElementHadFocus(scrollRef);

  useEffect(() => onFocusChange?.(focused), [focused]);

  const rowVirtualizer = useVirtualizer({
    count: dataLen,
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
        const item = data?.[virtualItem?.index];

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
  );
}

export function FlashList<T>({
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
  stickyHeaderIndices?: number[];
  ref?: React.RefObject<HTMLDivElement | null>;
  drawDistance?: number;
  numColumns?: number;
  scrollGutterBothEdges?: boolean;
  className?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => any;
  onFocusChange?: (focused: boolean) => any;
  refresh?: () => Promise<any>;
}) {
  const [key, setKey] = useState(0);

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

  useEffect(() => {
    if (focused) {
      const listener = () => {
        setKey((k) => k + 1);
      };
      window.addEventListener("statusTap", listener);
      return () => window.removeEventListener("statusTap", listener);
    }
  }, [focused]);

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    Haptics.impact({ style: ImpactStyle.Medium });
    refresh?.().finally(() => event.detail.complete());
  }

  return (
    <div
      ref={scrollRef}
      className={twMerge("overflow-auto overscroll-auto flex-1", className)}
      onScroll={onScroll}
    >
      {refresh && (
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
      )}

      <FlashListInternal
        key={key}
        {...props}
        ref={scrollRef}
        onFocusChange={(newFocused) => {
          setFocused(newFocused);
          onFocusChange?.(newFocused);
        }}
      />
    </div>
  );
}
