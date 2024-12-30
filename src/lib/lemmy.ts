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
  GetReplies,
  DeleteComment,
  Search,
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
import { useCommentsStore } from "../stores/comments";

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
  const myUserId = useAuth((s) => s.site?.my_user?.local_user_view.person.id);
  const instance = useAuth((s) => s.instance) ?? "http://lemmy.ml";

  return useMemo(() => {
    const client = new LemmyHttp(instance);

    if (jwt) {
      client.setHeaders({ Authorization: `Bearer ${jwt}` });
    }

    const queryKeyPrefix = ["instance", instance];
    if (myUserId) {
      queryKeyPrefix.push("user", String(myUserId));
    }

    return { client, queryKeyPrefix };
  }, [jwt, instance, myUserId]);
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
  crossPosts?: Array<Omit<FlattenedPost, "crossPosts">>;
};
export type FlattenedGetPostResponse = {
  posts: FlattenedPost[];
};

function flattenPost({
  post_view: postView,
  cross_posts: crossPosts,
}: {
  post_view: PostView;
  cross_posts?: Array<PostView>;
}): FlattenedPost {
  const community = postView.community;
  const creator = postView.creator;
  const post = postView.post;
  return {
    myVote: postView.my_vote,
    post,
    crossPosts: crossPosts?.map((post_view) =>
      flattenPost({
        post_view,
      }),
    ),
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
      const post = flattenPost(res);
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

  const cacheComments = useCommentsStore((s) => s.cacheComments);

  const queryKey = [
    ...queryKeyPrefix,
    "getComments",
    String(form.post_id),
    sort,
  ];

  if (form.parent_id) {
    queryKey.push("parent", String(form.parent_id));
  }

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

      cacheComments(comments.map(flattenComment));

      return {
        comments: comments.map((c) => ({
          path: c.comment.path,
          postId: c.comment.post_id,
          creatorId: c.creator.id,
        })),
        nextPage: comments.length < limit ? null : pageParam + 1,
      };
    },
    enabled: !!form.post_id,
    getNextPageParam: (data) => data.nextPage,
    initialPageParam: 1,
    placeholderData: (prev) => {
      const firstComment = prev?.pages[0]?.comments?.[0];
      if (!firstComment || firstComment.postId !== form.post_id) {
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

      const posts = res.posts.map((post_view) => flattenPost({ post_view }));
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
        client.setHeaders({ Authorization: `Bearer ${res.jwt}` });
        const site = await client.getSite();
        setSite(site);
        setJwt(res.jwt);
        queryClient.invalidateQueries();
      }
      return res;
    },
    onError: (err) => {
      console.log("Err", err);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { client } = useLemmyClient();
  const setJwt = useAuth((s) => s.setJwt);
  const setSite = useAuth((s) => s.setSite);
  const setInstance = useAuth((s) => s.setInstance);

  return () => {
    client.logout();
    setJwt(undefined);
    setInstance(undefined);
    setSite(undefined);
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
        ...flattenPost(data),
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
  path: string;
}

export function useLikeComment() {
  const { client } = useLemmyClient();
  const patchComment = useCommentsStore((s) => s.patchComment);
  const cacheComment = useCommentsStore((s) => s.cacheComment);

  return useMutation({
    mutationFn: async ({ post_id, path, ...form }: CustumCreateCommentLike) => {
      return await client.likeComment(form);
    },
    onMutate: ({ score, path }) => {
      patchComment(path, () => ({
        optimisticMyVote: score,
      }));
    },
    onSuccess: (data) => {
      cacheComment(flattenComment(data.comment_view));
    },
    onError: (err, { path }) => {
      patchComment(path, () => ({
        optimisticMyVote: undefined,
      }));
    },
  });
}

interface CreateCommentWithPath extends CreateComment {
  parentPath: string;
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { client, queryKeyPrefix } = useLemmyClient();
  const myProfile = useAuth((s) => s.site?.my_user?.local_user_view.person);
  const commentSort = useFiltersStore((s) => s.commentSort);
  const cacheComment = useCommentsStore((s) => s.cacheComment);
  const removeComment = useCommentsStore((s) => s.removeComment);

  return useMutation({
    mutationFn: async ({ parentPath, ...form }: CreateCommentWithPath) => {
      return await client.createComment(form);
    },
    onMutate: ({ post_id, parentPath, parent_id, content }) => {
      const date = new Date();
      const isoDate = date.toISOString();
      const commentId = _.random(1, 1000000) * -1;
      const newComment: FlattenedComment = {
        comment: {
          id: commentId,
          content,
          post_id,
          creator_id: myProfile?.id ?? -1,
          removed: false,
          published: isoDate,
          deleted: false,
          local: false,
          path: `${parentPath}.${commentId}`,
          distinguished: false,
          ap_id: "",
          language_id: -1,
        },
        creator: {
          id: myProfile?.id ?? -1,
          name: myProfile?.name ?? "",
          avatar: myProfile?.avatar,
        },
        counts: {
          score: 1,
        },
        myVote: 1,
      };

      cacheComment(newComment);

      const SORTS = new Set<CommentSortType>([
        commentSort,
        "Hot",
        "Top",
        "New",
        "Old",
        "Controversial",
      ]);

      for (const sort of Array.from(SORTS)) {
        let comments = queryClient.getQueryData<
          InfiniteData<
            {
              comments: {
                path: string;
                postId: number;
                creatorId: number;
              }[];
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
          firstPage.comments.unshift({
            path: newComment.comment.path,
            creatorId: newComment.creator.id,
            postId: newComment.comment.post_id,
          });
        }

        queryClient.setQueryData(
          [...queryKeyPrefix, "getComments", String(post_id), sort],
          comments,
        );
      }

      return newComment;
    },
    onSuccess: (res, form, ctx) => {
      const settledCommentPath = res.comment_view.comment.path;

      const SORTS: CommentSortType[] = [
        "Hot",
        "Top",
        "New",
        "Old",
        "Controversial",
      ];

      cacheComment(res.comment_view);
      removeComment(ctx.comment.path);

      for (const sort of SORTS) {
        let comments = queryClient.getQueryData<
          InfiniteData<
            {
              comments: {
                path: string;
                postId: number;
                creatorId: number;
              }[];
              nextPage: number | null;
            },
            unknown
          >
        >([...queryKeyPrefix, "getComments", String(form.post_id), sort]);

        if (!comments) {
          continue;
        }

        outer: for (const p of comments.pages) {
          for (const c of p.comments) {
            if (c.path === ctx.comment.path) {
              c.path = settledCommentPath;
              break outer;
            }
          }
        }

        queryClient.setQueryData(
          [...queryKeyPrefix, "getComments", String(form.post_id), sort],
          comments,
        );
      }
    },
  });
}

export function useEditComment() {
  const { client } = useLemmyClient();
  const cacheComment = useCommentsStore((s) => s.cacheComment);
  const patchComment = useCommentsStore((s) => s.patchComment);

  return useMutation({
    mutationFn: async ({
      path,
      ...form
    }: {
      comment_id: number;
      content: string;
      path: string;
    }) => {
      return await client.editComment(form);
    },
    onMutate: ({ path, content }) => {
      patchComment(path, (prev) => ({
        comment: {
          ...prev.comment,
          content,
        },
      }));
    },
    onSuccess: ({ comment_view }) => {
      cacheComment(comment_view);
    },
  });
}

export function useDeleteComment() {
  const { client } = useLemmyClient();
  const patchComment = useCommentsStore((s) => s.patchComment);
  const cacheComment = useCommentsStore((s) => s.cacheComment);
  return useMutation({
    mutationFn: async ({
      path,
      ...form
    }: {
      comment_id: number;
      path: string;
      deleted: boolean;
    }) => {
      return await client.deleteComment(form);
    },
    onMutate: ({ path, deleted }) => {
      patchComment(path, (prev) => ({
        ...prev,
        comment: {
          ...prev.comment,
          deleted,
        },
      }));
    },
    onSuccess: ({ comment_view }) => {
      cacheComment(comment_view);
    },
  });
}

export function useReplies(form: GetReplies) {
  const { client, queryKeyPrefix } = useLemmyClient();
  return useInfiniteQuery({
    queryKey: [...queryKeyPrefix, "getReplies"],
    queryFn: async ({ pageParam }) => {
      const limit = form.limit ?? 50;
      const { replies } = await client.getReplies(form);
      return {
        replies,
        nextPage: replies.length < limit ? null : pageParam + 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (prev) => prev.nextPage,
  });
}

export function useSearch(form: Search) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const queryKey = [...queryKeyPrefix, "search", form.q, sort];

  if (form.community_name) {
    queryKey.push("community", form.community_name);
  }

  if (form.type_) {
    queryKey.push("type", form.type_);
  }

  const limit = form.limit ?? 50;

  const search = useMemo(() => {
    const throttle = throttledQueue(1, 1000 * 8);
    return (form: Search) => throttle(() => client.search(form));
  }, [client, queryKey]);

  const cachePosts = usePostsStore((s) => s.cachePosts);
  const patchPost = usePostsStore((s) => s.patchPost);

  const cacheImages = useSettingsStore((s) => s.cacheImages);

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await search({
        ...form,
        page: pageParam,
        limit,
      });

      const posts = res.posts.map((post_view) => flattenPost({ post_view }));
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
        next_page: posts.length < limit ? null : pageParam + 1,
      };
    },
    getNextPageParam: (lastPage) => lastPage.next_page,
    initialPageParam: 1,
    notifyOnChangeProps: "all",
    staleTime: 1000 * 60 * 5,
    // refetchOnWindowFocus: false,
    // refetchOnMount: true,
    // staleTime: Infinity,
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
