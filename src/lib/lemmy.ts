import {
  CommentAggregates,
  CommentSortType,
  CommentView,
  Comment,
  Community,
  CreateComment,
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
import { z } from "zod";

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
  const instance = useAuth((s) => s.instance) ?? "http://lemmy.ml";

  return useMemo(() => {
    const client = new LemmyHttp(instance);

    if (jwt) {
      client.setHeaders({ Authorization: `Bearer ${jwt}` });
    }

    const queryKeyPrefix = ["instance", instance] as const;

    return { client, queryKeyPrefix };
  }, [jwt, instance]);
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

export type FlattenedComment = {
  optimisticMyVote?: number;
  myVote?: number;
  comment: Comment;
  creator: Pick<Person, "id" | "name" | "avatar">;
  counts: Pick<CommentAggregates, "score">;
};

export type FlattenedGetCommentsResponse = {
  posts: FlattenedComment[];
};

function flattenComment(commentView: CommentView): FlattenedComment {
  const comment = commentView.comment;
  return {
    myVote: commentView.my_vote,
    comment,
    creator: _.pick(commentView.creator, ["id", "name", "avatar"]),
    counts: _.pick(commentView.counts, ["score"]),
  };
}

export function usePost(form: { id?: string; communityName?: string }) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const postId = form.id ? +form.id : undefined;

  const queryKey = [...queryKeyPrefix, "getPost", form.id];

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
  const { client, queryKeyPrefix } = useLemmyClient();

  const queryKey = [
    ...queryKeyPrefix,
    "getComments",
    String(form.post_id),
    sort,
  ];

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
        comments: comments.map(flattenComment),
        nextPage: comments.length < limit ? null : pageParam + 1,
      };
    },
    enabled: !!form.post_id,
    getNextPageParam: (data) => data.nextPage,
    initialPageParam: 1,
    placeholderData: (prev) => {
      const firstComment = prev?.pages[0]?.comments?.[0];
      if (!firstComment || firstComment.comment.post_id !== form.post_id) {
        return undefined;
      }
      return prev;
    },
  });
}

export function usePosts(form: GetPosts) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const queryKey = [...queryKeyPrefix, "getPosts", sort];

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
  const { client, queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "listCommunities"];

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
  const { client, queryKeyPrefix } = useLemmyClient();

  const queryKey = [
    ...queryKeyPrefix,
    "getCommunity",
    `getCommunity-${form.name}`,
  ];

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
  const { client } = useLemmyClient();

  const setJwt = useAuth((s) => s.setJwt);
  const setSite = useAuth((s) => s.setSite);

  return useMutation({
    mutationFn: async (form: Login) => {
      const res = await client.login(form);
      if (res.jwt) {
        queryClient.clear();
        setJwt(res.jwt);
        if (res.jwt) {
          client.setHeaders({ Authorization: `Bearer ${res.jwt}` });
        }
        const site = await client.getSite();
        setSite(site);
        queryClient.invalidateQueries();
      }
      return res;
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { client } = useLemmyClient();
  const setJwt = useAuth((s) => s.setJwt);
  const setInstance = useAuth((s) => s.setInstance);

  return () => {
    client.logout();
    setJwt(undefined);
    setInstance(undefined);
    queryClient.clear();
    queryClient.invalidateQueries();
  };
}

export function useLikePost(postId: number) {
  const { client } = useLemmyClient();

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
  const { client, queryKeyPrefix } = useLemmyClient();

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
              comments: FlattenedComment[];
              nextPage: number | null;
            },
            unknown
          >
        >([...queryKeyPrefix, "getComments", String(post_id), sort]);

        if (!comments) {
          continue;
        }

        for (const p of comments.pages) {
          for (const c of p.comments) {
            if (c.comment.id === comment_id) {
              c.optimisticMyVote = score;
            }
          }
        }

        queryClient.setQueryData(
          [...queryKeyPrefix, "getComments", String(post_id), sort],
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

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { client, queryKeyPrefix } = useLemmyClient();

  return useMutation({
    mutationFn: async (form: CreateComment) => {
      return await client.createComment(form);
    },
    onMutate: ({ post_id, parent_id, content }) => {
      const date = new Date();
      const isoDate = date.toISOString();
      const postId = 1;
      const newComment: FlattenedComment = {
        comment: {
          id: -1,
          content,
          post_id: postId,
          creator_id: -1,
          removed: false,
          published: isoDate,
          deleted: false,
          local: false,
          path: `0.${postId}`,
          distinguished: false,
          ap_id: "",
          language_id: -1,
        },
        creator: {
          id: -1,
          name: "Jon Doe",
        },
        counts: {
          score: 0,
        },
      };

      const SORTS: CommentSortType[] = [
        "Hot",
        "Top",
        "New",
        "Old",
        "Controversial",
      ];

      for (const sort of SORTS) {
        let comments = queryClient.getQueryData<
          InfiniteData<
            {
              comments: FlattenedComment[];
              nextPage: number | null;
            },
            unknown
          >
        >([...queryKeyPrefix, "getComments", String(post_id), sort]);

        if (!comments) {
          continue;
        }

        comments = _.cloneDeep(comments);

        const firstPage = comments.pages[0];
        if (firstPage) {
          firstPage.comments.unshift(newComment);
        }

        for (const p of comments.pages) {
          const c = p.comments[0];
          // for (const c of p.comments) {
          //   if (c.comment.id === comment_id) {
          //     const diff = score - (c.my_vote ?? 0);
          //     c.my_vote = score;
          //     c.counts.score += diff;
          //   }
          // }
        }

        queryClient.setQueryData(
          [...queryKeyPrefix, "getComments", String(post_id), sort],
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

export function useInstances() {
  return useQuery({
    queryKey: ["getInstances"],
    queryFn: async () => {
      const res = await fetch(
        "https://data.lemmyverse.net/data/instance.full.json",
      );
      const data = await res.json();

      try {
        return z
          .array(
            z.object({
              name: z.string(),
              baseurl: z.string(),
              url: z.string(),
              score: z.number(),
              open: z.boolean().optional(),
              private: z.boolean().optional(),
              counts: z.object({
                users_active_month: z.number(),
                posts: z.number(),
              }),
              tags: z.array(z.string()),
              nsfw: z.boolean().optional(),
            }),
          )
          .parse(data);
      } catch (error) {
        return undefined;
      }
    },
  });
}
