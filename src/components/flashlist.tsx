import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
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
import {
  useElementHadFocus,
  useIsInAppBrowserOpen,
  useMedia,
} from "../lib/hooks";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useAuth } from "../stores/auth";
import { cn } from "../lib/utils";

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
  onFocusChange,
  placeholder,
  header,
}: {
  data?: T[] | readonly T[];
  estimatedItemSize: number;
  onEndReached?: () => any;
  renderItem: (params: { item: T; index: number }) => React.ReactNode;
  stickyHeaderIndices?: number[];
  ref: React.RefObject<HTMLDivElement | null>;
  drawDistance?: number;
  numColumns?: number;
  onFocusChange?: (focused: boolean) => any;
  placeholder?: ReactNode;
  header?: ReactNode[];
}) {
  const index = useRef(0);
  const offset = useRef(0);
  const cache = useRef<VirtualItem[]>([]);

  const scrollRef = ref;

  const initialItem = cache.current?.[index.current];

  const dataLen = data?.length;

  const activeStickyIndexRef = useRef(-1);

  const isActiveSticky = (index: number) =>
    activeStickyIndexRef.current === index;

  const overscan =
    drawDistance && estimatedItemSize
      ? Math.round(drawDistance / estimatedItemSize)
      : undefined;

  const focused = useElementHadFocus(scrollRef);

  useEffect(() => onFocusChange?.(focused), [focused]);

  let count = dataLen || (placeholder ? 25 : 0);
  if (header) {
    count += header.length;
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
    if (!lastItem || _.isNil(dataLen)) {
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
        let index = virtualItem.index;
        if (header) {
          index -= header.length;
        }
        const item = data?.[index];

        const showHeader = header && virtualItem.index <= header?.length;

        const isStuck = isActiveSticky(virtualItem.index);

        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            className={cn(isStuck && "max-md:bg-background")}
            style={
              isStuck
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
            {item
              ? renderItem?.({
                  item,
                  index,
                })
              : showHeader
                ? header[virtualItem.index]
                : placeholder}
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
  className?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => any;
  onFocusChange?: (focused: boolean) => any;
  refresh?: () => Promise<any>;
  placeholder?: ReactNode;
  header?: ReactNode[];
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

  return (
    <>
      {refresh && (
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
          scrollbarGutter: media.md ? "stable both-edges" : undefined,
        }}
        onScroll={onScroll}
      >
        <FlashListInternal
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
