import {
  PostCompact,
  POST_HEIGHT,
  EXPANDED_POST_HEIGHT,
} from "~/src/components/post";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { GetPostsResponse } from "lemmy-js-client";

const EMPTY_ARR = [];

export function PostsFeed({
  posts,
}: {
  posts: UseInfiniteQueryResult<InfiniteData<GetPostsResponse, unknown>, Error>;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const { hasNextPage, fetchNextPage, isFetchingNextPage } = posts;
  const data = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const getHeight = (index: number) => {
    const view = data[index];
    const isExpanded = expanded[view.post.id];
    return isExpanded ? EXPANDED_POST_HEIGHT : POST_HEIGHT;
  };

  const virtualizer = useVirtualizer({
    count: data?.length ?? 0,
    estimateSize: getHeight,
    overscan: 5,
    getScrollElement: () => listRef.current, // Use the custom scroll container
  });

  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= data.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    data.length,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const prevState = prev[id] ?? false;
      return {
        ...prev,
        [id]: !prevState,
      };
    });
  };

  return (
    <div
      ref={listRef}
      style={{
        height: "100%", // Full viewport height
        overflow: "auto", // Enable scrolling
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const view = data[item.index];
          return (
            <div
              key={item.key}
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${item.start}px)`,
                display: "flex",
              }}
            >
              <PostCompact
                key={view.post.id}
                postView={view}
                toggleExpand={() => toggleExpand(view.post.id)}
                expanded={expanded[view.post.id] ?? false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
