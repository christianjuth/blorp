import {
  PostCompact,
  POST_HEIGHT,
  EXPANDED_POST_HEIGHT,
} from "~/src/components/post";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { GetPostsResponse } from "lemmy-js-client";

const EMPTY_ARR = [];

const PADDING = 10;

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
    const paddingY = PADDING * 2;
    const postHeight = isExpanded ? EXPANDED_POST_HEIGHT : POST_HEIGHT;
    return postHeight + paddingY;
  };

  const virtualizer = useWindowVirtualizer({
    count: data?.length ?? 0,
    estimateSize: getHeight,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    enabled: true,
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
    <div ref={listRef} className="List">
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
                paddingTop: PADDING,
                paddingBottom: PADDING,
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${
                  item.start - virtualizer.options.scrollMargin
                }px)`,
                display: "flex",
                borderBottom: "1px solid gray",
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
