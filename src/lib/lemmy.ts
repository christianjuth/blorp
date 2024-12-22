import {
  CommentSortType,
  CommentView,
  Community,
  CreateCommentLike,
  GetPosts,
  ImageDetails,
  LemmyHttp,
  ListCommunities,
  Login,
  Person,
  Post,
  PostAggregates,
  PostView,
} from "lemmy-js-client";
import {
  useQuery,
  useInfiniteQuery,
  InfiniteData,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { GetComments } from "lemmy-js-client";
import { Image as RNImage } from "react-native";
import { useFiltersStore } from "~/src/stores/filters";
import { useAuth } from "../stores/auth";
import { useMemo } from "react";
import { Image as ExpoImage } from "expo-image";
import _ from "lodash";
import throttledQueue from "throttled-queue";
import { usePostsStore } from "../stores/posts";
import { useSettingsStore } from "../stores/settings";

function getLemmyServer({ actor_id }: { actor_id: string }) {
  const server = new URL(actor_id);
  return server.host;
}

export function createCommunitySlug(
  community: Pick<Community, "actor_id" | "name">,
) {
  const server = getLemmyServer(community);
  return `${community.name}@${server}`;
}

export function parseCommunitySlug(slug: string) {
  const [communityName, lemmyServer] = slug.split("@");
  return {
    communityName,
    lemmyServer,
  };
}

const imageAspectRatioCache = new Map<
  string,
  Promise<{ width: number; height: number }>
>();

export const imageSizeCache = new Map<
  string,
  { width: number; height: number }
>();

export async function measureImage(src: string) {
  if (imageAspectRatioCache.has(src)) {
    return await imageAspectRatioCache.get(src);
  }

  const p = new Promise<{
    width: number;
    height: number;
  }>((resolve, reject) => {
    RNImage.getSize(
      src,
      (width, height) => {
        imageSizeCache.set(src, { width, height });
        resolve({ width, height });
      },
      reject,
    );
  });

  imageAspectRatioCache.set(src, p);

  p.catch(() => {
    imageAspectRatioCache.delete(src);
  });

  return await p;
}

function useLemmyClient() {
  const jwt = useAuth((s) => s.jwt);
  const instance = useAuth((s) => s.instance);

  return useMemo(() => {
    const client = new LemmyHttp(instance);

    if (jwt) {
      client.setHeaders({ Authorization: `Bearer ${jwt}` });
    }

    return client;
  }, [jwt]);
}

export function getPostFromCache(
  cache: InfiniteData<FlattenedGetPostResponse, unknown> | undefined,
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

export type FlattenedPost = {
  optimisticMyVote?: number;
  myVote?: number;
  post: Post;
  community: {
    name: string;
    title: string;
    icon?: string;
    slug: string;
  };
  creator: Pick<Person, "id" | "name" | "avatar">;
  counts: Pick<PostAggregates, "score" | "comments">;
  imageDetails?: Pick<ImageDetails, "height" | "width">;
};
export type FlattenedGetPostResponse = {
  posts: FlattenedPost[];
};

function flattenPost(postView: PostView): FlattenedPost {
  const community = postView.community;
  const creator = postView.creator;
  const post = postView.post;
  return {
    myVote: postView.my_vote,
    post,
    community: {
      name: community.name,
      title: community.title,
      icon: community.icon,
      slug: createCommunitySlug(postView.community),
    },
    creator: {
      id: creator.id,
      name: creator.name,
      avatar: creator.avatar,
    },
    counts: _.pick(postView.counts, ["score", "comments"]),
    imageDetails: postView.image_details
      ? _.pick(postView.image_details, ["width", "height"])
      : undefined,
  };
}

export function usePost(form: { id?: string; communityName?: string }) {
  const client = useLemmyClient();

  const postId = form.id ? +form.id : undefined;

  const queryKey = ["getPost", form.id];

  const initialData = usePostsStore((s) =>
    form.id ? s.posts[form.id]?.data : undefined,
  );

  const cachePost = usePostsStore((s) => s.cachePost);
  const patchPost = usePostsStore((s) => s.patchPost);

  const cacheImages = useSettingsStore((s) => s.cacheImages);

  return useQuery<FlattenedPost>({
    queryKey,
    queryFn: async () => {
      if (!postId) {
        throw new Error("Missing post id");
      }
      const res = await client.getPost({
        id: postId,
      });
      const post = flattenPost(res.post_view);
      const cachedPost = cachePost(post);
      const thumbnail = res.post_view.post.thumbnail_url;

      if (thumbnail) {
        if (!cachedPost.imageDetails) {
          measureImage(thumbnail).then((data) => {
            if (data) {
              patchPost(postId, {
                imageDetails: data,
              });
            }
          });
        }
        ExpoImage.prefetch([thumbnail], {
          cachePolicy: cacheImages ? "disk" : "memory",
        });
      }
      return post;
    },
    enabled: _.isNumber(postId),
    initialData,
  });
}

export function usePostComments(form: GetComments) {
  const commentSort = useFiltersStore((s) => s.commentSort);
  const sort = form.sort ?? commentSort;
  const client = useLemmyClient();

  const queryKey = ["getComments", String(form.post_id), sort];

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const limit = form.limit ?? 50;
      const { comments } = await client.getComments({
        ...form,
        limit,
        page: pageParam,
        sort,
      });
      return {
        comments,
        nextPage: comments.length < limit ? null : pageParam + 1,
      };
    },
    enabled: !!form.post_id,
    getNextPageParam: (data) => data.nextPage,
    initialPageParam: 1,
    placeholderData: (prev) => {
      const firstComment = prev?.pages[0]?.comments?.[0];
      if (!firstComment || firstComment.post.id !== form.post_id) {
        return undefined;
      }
      return prev;
    },
  });
}

export function usePosts(form: GetPosts) {
  const client = useLemmyClient();

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const queryKey = ["getPosts", sort];

  if (form.community_name) {
    queryKey.push("community", form.community_name);
  }

  if (form.type_) {
    queryKey.push("type", form.type_);
  }

  const getPosts = useMemo(() => {
    const throttle = throttledQueue(1, 1000 * 8);
    return (form: GetPosts) =>
      throttle(() =>
        client.getPosts({
          ...form,
          show_read: true,
        }),
      );
  }, [client, queryKey]);

  const cachePosts = usePostsStore((s) => s.cachePosts);
  const patchPost = usePostsStore((s) => s.patchPost);

  const cacheImages = useSettingsStore((s) => s.cacheImages);

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await getPosts({
        ...form,
        page_cursor: pageParam === "init" ? undefined : pageParam,
      });

      const posts = res.posts.map(flattenPost);
      const cachedPosts = cachePosts(posts);

      let i = 0;
      for (const { post } of res.posts) {
        const thumbnail = post.thumbnail_url;
        if (thumbnail) {
          setTimeout(() => {
            if (!cachedPosts[post.id]?.data.imageDetails) {
              measureImage(thumbnail).then((data) => {
                patchPost(post.id, {
                  imageDetails: data,
                });
              });
            }
            ExpoImage.prefetch([thumbnail], {
              cachePolicy: cacheImages ? "disk" : "memory",
            });
          }, i);
          i += 50;
        }
      }

      return {
        posts: posts.map((p) => p.post.id),
        next_page: res.next_page,
      };
    },
    getNextPageParam: (lastPage) => lastPage.next_page,
    initialPageParam: "init",
    notifyOnChangeProps: "all",
    staleTime: 1000 * 60 * 5,
    // refetchOnWindowFocus: false,
    // refetchOnMount: true,
    // staleTime: Infinity,
  });
}

export function useListCommunities(form: ListCommunities) {
  const client = useLemmyClient();

  const queryKey = ["listCommunities"];

  if (form.sort) {
    queryKey.push("sort", form.sort);
  }

  if (form.limit) {
    queryKey.push("limit", String(form.limit));
  }

  if (form.type_) {
    queryKey.push("type", form.type_);
  }

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const limit = form.limit ?? 50;
      const { communities } = await client.listCommunities({
        ...form,
        page: pageParam,
      });
      return {
        communities,
        nextPage: communities.length < limit ? null : pageParam + 1,
      };
    },
    getNextPageParam: (data) => data.nextPage,
    initialPageParam: 1,
  });
}
export function useCommunity(form: { name?: string; instance?: string }) {
  const client = useLemmyClient();

  const queryKey = ["getCommunity", `getCommunity-${form.name}`];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await client.getCommunity({
        name: form.name,
      });
      return res;
    },
    enabled: !!form.name,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const client = useLemmyClient();

  const setJwt = useAuth((s) => s.setJwt);

  return useMutation({
    mutationFn: async (form: Login) => {
      const res = await client.login(form);
      if (res.jwt) {
        queryClient.clear();
        setJwt(res.jwt);
        if (res.jwt) {
          client.setHeaders({ Authorization: `Bearer ${res.jwt}` });
        }
        queryClient.invalidateQueries();
      }
      return res;
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const client = useLemmyClient();

  const setJwt = useAuth((s) => s.setJwt);

  return () => {
    client.logout();
    setJwt(undefined);
    queryClient.clear();
    queryClient.invalidateQueries();
  };
}

export function useLikePost(postId: number) {
  const client = useLemmyClient();

  const post = usePostsStore((s) => s.posts[postId]?.data);
  const cachePost = usePostsStore((s) => s.cachePost);

  return useMutation({
    mutationKey: ["likePost", postId],
    mutationFn: async (score: -1 | 0 | 1) => {
      const res = await client.likePost({
        post_id: postId,
        score,
      });
      return res;
    },
    onMutate: (myVote) => {
      cachePost({
        ...post,
        optimisticMyVote: myVote,
      });
    },
    onSuccess: (data) => {
      cachePost({
        ..._.omit(post, ["optimisticMyVote"]),
        ...flattenPost(data.post_view),
      });
    },
    onError: (err) => {
      cachePost({
        ...post,
        optimisticMyVote: undefined,
      });
    },
  });
}

interface CustumCreateCommentLike extends CreateCommentLike {
  post_id: number;
}

export function useLikeComment() {
  const queryClient = useQueryClient();
  const client = useLemmyClient();

  return useMutation({
    mutationFn: async ({ post_id, ...form }: CustumCreateCommentLike) => {
      return await client.likeComment(form);
    },
    onMutate: ({ post_id, comment_id, score }) => {
      const SORTS: CommentSortType[] = [
        "Hot",
        "Top",
        "New",
        "Old",
        "Controversial",
      ];

      for (const sort of SORTS) {
        const comments = queryClient.getQueryData<
          InfiniteData<
            {
              comments: CommentView[];
              nextPage: number | null;
            },
            unknown
          >
        >(["getComments", String(post_id), sort]);

        if (!comments) {
          continue;
        }

        for (const p of comments.pages) {
          for (const c of p.comments) {
            if (c.comment.id === comment_id) {
              const diff = score - (c.my_vote ?? 0);
              c.my_vote = score;
              c.counts.score += diff;
            }
          }
        }

        queryClient.setQueryData(
          ["getComments", String(post_id), sort],
          comments,
        );
      }
    },
    // onSuccess: (res) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [
    //       "getComments",
    //       String(res.comment_view.post.id),
    //       commentSort,
    //     ],
    //   });
    // },
  });
}
