import { GetPosts, LemmyHttp, Login } from "lemmy-js-client";
import {
  useQuery,
  useInfiniteQuery,
  InfiniteData,
  useQueryClient,
} from "@tanstack/react-query";
import {
  GetComments,
  GetPost,
  GetPostResponse,
  GetPostsResponse,
} from "lemmy-js-client";
import { Image as Image } from "react-native";

const imageAspectRatioCache = new Map<
  string,
  Promise<{ width: number; height: number }>
>();

export async function measureImage(src: string) {
  if (imageAspectRatioCache.has(src)) {
    return imageAspectRatioCache.get(src);
  }

  const p = new Promise<{
    width: number;
    height: number;
  }>((resolve, reject) => {
    Image.getSize(
      src,
      (width, height) => {
        resolve({ width, height });
      },
      reject,
    );
  });

  imageAspectRatioCache.set(src, p);
}

// Build the client
const baseUrl = "https://lemmy.world";
export const lemmy: LemmyHttp = new LemmyHttp(baseUrl);

export function getPostFromCache(
  cache: InfiniteData<GetPostsResponse, unknown> | undefined,
  postId: number | undefined,
) {
  if (!postId || !cache) {
    return undefined;
  }

  for (const page of cache.pages) {
    for (const view of page.posts) {
      if (view.post.id === postId) {
        return view;
      }
    }
  }

  return undefined;
}

export function usePost(form: GetPost) {
  const queryClient = useQueryClient();

  const cachedPosts = queryClient.getQueryData<
    InfiniteData<GetPostsResponse, unknown>
  >(["getPosts"]);

  return useQuery<Partial<GetPostResponse>>({
    queryKey: ["getPost", `getPost-${form.id}`],
    queryFn: async () => {
      const res = await lemmy.getPost(form);
      if (res.post_view.post.thumbnail_url) {
        measureImage(res.post_view.post.thumbnail_url);
      }
      return res;
    },
    enabled: !!form.id,
    initialData: () => ({
      post_view: getPostFromCache(cachedPosts, form.id),
    }),
  });
}

export function usePostComments(form: GetComments) {
  return useInfiniteQuery({
    queryKey: ["getComments", `getComments-${form.post_id}`],
    queryFn: async ({ pageParam }) => {
      const limit = form.limit ?? 50;
      const { comments } = await lemmy.getComments({
        ...form,
        limit,
        page: pageParam,
      });
      return {
        comments,
        page: comments.length < limit ? null : pageParam + 1,
      };
    },
    enabled: !!form.post_id,
    getNextPageParam: (data) => data.page,
    initialPageParam: 1,
  });
}

export function usePosts(form: GetPosts) {
  return useInfiniteQuery({
    queryKey: ["getPosts"],
    queryFn: async ({ pageParam }) => {
      const res = await lemmy.getPosts({
        ...form,
        page_cursor: pageParam === "init" ? undefined : pageParam,
      });

      for (const { post } of res.posts) {
        if (post.thumbnail_url) {
          measureImage(post.thumbnail_url);
        }
      }

      return res;
    },
    getNextPageParam: (lastPage) => lastPage.next_page,
    initialPageParam: "init",
  });
}
