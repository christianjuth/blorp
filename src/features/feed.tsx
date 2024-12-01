import { lemmy } from "~/src/lib/lemmy";
import { useInfiniteQuery } from "@tanstack/react-query";
import { GetPosts } from "lemmy-js-client";
import { PostsFeed } from "../components/posts/posts-feed";

function usePosts(form: GetPosts) {
  return useInfiniteQuery({
    queryKey: ["getPosts"],
    queryFn: ({ pageParam }) => {
      return lemmy.getPosts({
        ...form,
        page_cursor: pageParam === "init" ? undefined : pageParam,
      });
    },
    getNextPageParam: (lastPage) => lastPage.next_page,
    initialPageParam: "init",
  });
}

export function Feed() {
  const posts = usePosts({
    limit: 50,
    sort: "Active",
  });

  return <PostsFeed posts={posts} />;
}
