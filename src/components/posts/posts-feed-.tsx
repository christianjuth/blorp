import { useVirtualizer } from "@tanstack/react-virtual";
import { PostCard } from "~/src/components/posts/post";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { FeedGutters } from "../feed-gutters";
import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { usePostsStore } from "~/src/stores/posts";
import useResizeObserver from "@react-hook/resize-observer";
import { Dimensions } from "react-native";
const windowDimensions = Dimensions.get("window");
import { useParams } from "one";
import {
  Sidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { PopularCommunitiesSidebar } from "../populat-communities-sidebar";

const EMPTY_ARR = [];

export function PostsFeed({
  posts,
}: {
  posts: UseInfiniteQueryResult<
    InfiniteData<{ posts: number[] }, unknown>,
    Error
  >;
}) {
  const { communityName } = useParams<{ communityName: string }>();

  const [width, setWidth] = useState(Math.min(windowDimensions.width, 640));
  const postRef = useRef(null);
  // Use ResizeObserver to measure the width
  useResizeObserver(postRef, (entry) => {
    setWidth(Math.min(entry.contentRect.width, 640));
  });

  const data = useMemo(
    () => posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR,
    [posts.data?.pages],
  );

  const postCache = usePostsStore((s) => s.posts);

  const estimateSize = (index: number) => {
    const postId = data[index];
    const post = postCache[postId]?.data;

    if (!post) {
      return 500;
    }

    const imageDetails = post.imageDetails;
    const hasImage = post.post.thumbnail_url;

    const aspectRatio = imageDetails
      ? imageDetails.width / imageDetails.height
      : 1;

    const REST_HEIGHT = 71 + 18 * 2;
    const TITLE_LINE_HEIGHT = 24;
    const CHARS_PER_LINE = 76;
    const LINES = Math.ceil(post?.post.name.length / CHARS_PER_LINE);
    const TITLE_HEIGHT = LINES * TITLE_LINE_HEIGHT;
    const IMAGE_HEIGHT = width / aspectRatio;

    return (hasImage ? IMAGE_HEIGHT : 0) + REST_HEIGHT + TITLE_HEIGHT;
  };

  // The scrollable element for your list
  const parentRef = useRef(null);

  // The virtualizer
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    // overscan: 10,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= data.length - 1 &&
      posts.hasNextPage &&
      !posts.isFetchingNextPage
    ) {
      posts.fetchNextPage();
    }
  }, [
    posts.hasNextPage,
    posts.fetchNextPage,
    data.length,
    posts.isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  return (
    <>
      <FeedGutters>
        <div ref={postRef} style={{ flex: 1 }} />
        <></>
      </FeedGutters>
      {/* The scrollable element for your list */}
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
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                // height: `${virtualItem.size}px`,
                // height: estimateSize(virtualItem.index),
                transform: `translateY(${virtualItem.start}px)`,
                overflow: "hidden",
              }}
            >
              <FeedGutters>
                <PostCard postId={data[virtualItem.index]} />
                {virtualItem.index === 0 ? (
                  communityName ? (
                    <Sidebar communityName={communityName} />
                  ) : (
                    <PopularCommunitiesSidebar />
                  )
                ) : (
                  <></>
                )}
              </FeedGutters>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
