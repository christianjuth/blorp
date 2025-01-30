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
  FollowCommunity,
  CommunityId,
  MarkCommentReplyAsRead,
  CreatePost,
} from "lemmy-js-client";
import {
  useQuery,
  useInfiniteQuery,
  InfiniteData,
  useQueryClient,
  useMutation,
  UseInfiniteQueryOptions,
  DefaultError,
  QueryKey,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { GetComments } from "lemmy-js-client";
import { Image as RNImage } from "react-native";
import { useFiltersStore } from "~/src/stores/filters";
import { useAuth } from "../stores/auth";
import { useCallback, useEffect, useMemo } from "react";
import { Image as ExpoImage } from "expo-image";
import _ from "lodash";
import { usePostsStore } from "../stores/posts";
import { useSettingsStore } from "../stores/settings";
import { z } from "zod";
import { useCommentsStore } from "../stores/comments";
import { useThrottleQueue } from "./throttle-queue";
import { useIsFocused } from "@react-navigation/native";
import { useCommunitiesStore } from "../stores/communities";
import { createCommunitySlug } from "./community";
import { useRouter } from "one";

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
    if (src.endsWith(".gif")) {
      reject();
      return;
    }

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
  const jwt = useAuth((s) => s.getSelectedAccount().jwt);
  const myUserId = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person.id,
  );
  const instance =
    useAuth((s) => s.getSelectedAccount().instance) ?? "https://lemmy.ml";

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

export function flattenPost({
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

export function usePersonDetails({
  person_id,
}: {
  person_id?: string | number;
}) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "getPersonDetails", person_id];

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!person_id) {
        throw new Error("person_id undefined");
      }
      const { posts, comments, ...rest } = await client.getPersonDetails({
        person_id: +person_id,
        limit: 1,
      });
      return rest;
    },
    enabled: !!person_id,
  });
}

export function usePersonPosts({ person_id }: { person_id?: string | number }) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "getPersonPosts", person_id];

  const cachePosts = usePostsStore((s) => s.cachePosts);
  const patchPost = usePostsStore((s) => s.patchPost);

  const cacheImages = useSettingsStore((s) => s.cacheImages);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const limit = 50;

      if (!person_id) {
        throw new Error("person_id undefined");
      }
      const res = await client.getPersonDetails({
        person_id: +person_id,
        limit,
        page: pageParam,
      });

      const posts = res.posts.map((post_view) => flattenPost({ post_view }));
      const cachedPosts = cachePosts(posts);

      let i = 0;
      for (const { post } of res.posts) {
        const thumbnail = post.thumbnail_url;
        if (thumbnail) {
          setTimeout(() => {
            if (!cachedPosts[post.ap_id]?.data.imageDetails) {
              measureImage(thumbnail).then((data) => {
                patchPost(post.ap_id, {
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
        ...res,
        posts: res.posts.map((p) => p.post.ap_id),
        next_page: res.posts.length < limit ? null : pageParam + 1,
      };
    },
    enabled: !!person_id,
    initialPageParam: 1,
    getNextPageParam: (d) => 1,
  });
}

export function usePost({
  ap_id,
  enabled,
}: {
  ap_id?: string;
  enabled?: boolean;
}) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "getPost", ap_id];

  const initialData = usePostsStore((s) =>
    ap_id ? s.posts[ap_id]?.data : undefined,
  );

  const cachePost = usePostsStore((s) => s.cachePost);
  const patchPost = usePostsStore((s) => s.patchPost);

  const cacheImages = useSettingsStore((s) => s.cacheImages);

  return useQuery<FlattenedPost>({
    queryKey,
    queryFn: async () => {
      if (!ap_id) {
        throw new Error("ap_id undefined");
      }
      const { post: resPost } = await client.resolveObject({
        q: ap_id,
      });
      if (!resPost) {
        throw new Error("fetchd object is not type post");
      }

      const res2 = await client.getPost({
        id: resPost.post.id,
      });

      const post = flattenPost({
        post_view: resPost,
        cross_posts: res2.cross_posts,
      });
      const cachedPost = cachePost(post);
      const thumbnail = post.post.thumbnail_url;

      if (thumbnail) {
        if (!cachedPost.imageDetails) {
          measureImage(thumbnail).then((data) => {
            if (data) {
              patchPost(ap_id, {
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
    enabled: !!ap_id && enabled,
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

  return useThrottledInfiniteQuery({
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

const warmedFeeds = new Map<string, boolean>();

interface UsePostsConfig extends GetPosts {
  enabled?: boolean;
}

export function usePosts({ enabled, ...form }: UsePostsConfig) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { client, queryKeyPrefix } = useLemmyClient();

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const queryKey = [...queryKeyPrefix, "getPosts", sort];

  form = {
    limit: 25,
    ...form,
  };

  if (form.community_name) {
    queryKey.push("community", form.community_name);
  }

  if (form.type_) {
    queryKey.push("type", form.type_);
  }

  if (form.limit) {
    queryKey.push("limit", String(form.limit));
  }

  const cachePosts = usePostsStore((s) => s.cachePosts);
  const patchPost = usePostsStore((s) => s.patchPost);

  const cacheImages = useSettingsStore((s) => s.cacheImages);

  const queryFn = async ({ pageParam }: { pageParam: string }) => {
    const res = await client.getPosts({
      ...form,
      show_read: true,
      page_cursor: pageParam === "init" ? undefined : pageParam,
    });

    const posts = res.posts.map((post_view) => flattenPost({ post_view }));
    const cachedPosts = cachePosts(posts);

    let i = 0;
    for (const { post } of res.posts) {
      const thumbnail = post.thumbnail_url;
      if (thumbnail) {
        setTimeout(() => {
          if (!cachedPosts[post.ap_id]?.data.imageDetails) {
            measureImage(thumbnail).then((data) => {
              patchPost(post.ap_id, {
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
      posts: posts.map((p) => p.post.ap_id),
      next_page: res.next_page,
    };
  };

  const query = useThrottledInfiniteQuery({
    queryKey,
    queryFn,
    getNextPageParam: (lastPage) => lastPage.next_page,
    initialPageParam: "init",
    notifyOnChangeProps: "all",
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    // refetchOnMount: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    enabled: enabled && (form.type_ === "Subscribed" ? isLoggedIn : true),
  });

  const queryKeyStr = queryKey.join("-");
  useEffect(() => {
    const isWarmed = warmedFeeds.get(queryKeyStr) ?? false;
    if (!isWarmed && enabled) {
      warmedFeeds.set(queryKeyStr, true);
      query.refetch();
    }
  }, [queryKeyStr, query.refetch, enabled]);

  const queryClient = useQueryClient();
  const prefetch = () =>
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn,
      initialPageParam: "init",
      getNextPageParam: (lastPage) => lastPage.next_page,
      pages: 1,
    });

  return {
    ...query,
    prefetch,
  };
}

function useThrottledInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
): UseInfiniteQueryResult<TData, TError> {
  const throttleQueue = useThrottleQueue(options.queryKey);
  const queryFn = options.queryFn;

  const focused = useIsFocused();

  useEffect(() => {
    if (focused) {
      throttleQueue.play();
    } else {
      throttleQueue.pause();
    }
  }, [throttleQueue, focused]);

  const query = useInfiniteQuery({
    ...options,
    ...(_.isFunction(queryFn)
      ? {
          queryFn: (ctx: any) => {
            return throttleQueue.enqueue<TQueryFnData>(
              async () => await queryFn(ctx),
            );
          },
        }
      : {}),
  });
  return {
    ...query,
    fetchNextPage: () => {
      if (focused) {
        const p = query.fetchNextPage();
        throttleQueue.flush();
        return p;
      }
      return undefined as any;
    },
  };
}

export function useListCommunities(form: ListCommunities) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
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

  const cacheCommunity = useCommunitiesStore((s) => s.cacheCommunity);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const limit = form.limit ?? 50;
      const { communities } = await client.listCommunities({
        ...form,
        page: pageParam,
      });
      for (const communityView of communities) {
        cacheCommunity({
          communityView,
        });
      }
      return {
        communities,
        nextPage: communities.length < limit ? null : pageParam + 1,
      };
    },
    getNextPageParam: (data) => data.nextPage,
    initialPageParam: 1,
    enabled: form.type_ === "Subscribed" ? isLoggedIn : true,
  });
}
export function useCommunity(form: { name?: string; instance?: string }) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const cacheCommunity = useCommunitiesStore((s) => s.cacheCommunity);

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
      cacheCommunity({
        communityView: res.community_view,
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

  const updateAccount = useAuth((s) => s.updateAccount);

  return useMutation({
    mutationFn: async (form: Login) => {
      const res = await client.login(form);
      if (res.jwt) {
        client.setHeaders({ Authorization: `Bearer ${res.jwt}` });
        const site = await client.getSite();
        updateAccount({
          site,
          jwt: res.jwt,
        });
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
  const listingType = useFiltersStore((s) => s.listingType);
  const setListingType = useFiltersStore((s) => s.setListingType);
  const communitiesListingType = useFiltersStore(
    (s) => s.communitiesListingType,
  );
  const setCommunitiesListingType = useFiltersStore(
    (s) => s.setCommunitiesListingType,
  );
  const updateAccount = useAuth((s) => s.updateAccount);

  const resetFilters = () => {
    if (listingType === "Subscribed") {
      setListingType("All");
    }
    if (communitiesListingType === "Subscribed") {
      setCommunitiesListingType("All");
    }
  };

  return () => {
    client.logout();
    updateAccount({
      jwt: undefined,
      site: undefined,
    });
    resetFilters();
    queryClient.clear();
    queryClient.invalidateQueries();
  };
}

export function useLikePost(apId: string) {
  const { client } = useLemmyClient();

  const post = usePostsStore((s) => s.posts[apId]?.data);
  const cachePost = usePostsStore((s) => s.cachePost);

  return useMutation({
    mutationKey: ["likePost", apId],
    mutationFn: async (score: -1 | 0 | 1) => {
      if (!post) {
        throw new Error("post not found");
      }
      const res = await client.likePost({
        post_id: post.post.id,
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
  const myProfile = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person,
  );
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

      queryClient.invalidateQueries({
        queryKey: [...queryKeyPrefix, "getComments", String(form.post_id)],
      });
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
  const queryKey = [...queryKeyPrefix, "getReplies"];

  if (form.limit) {
    queryKey.push("limit", String(form.limit));
  }

  if (form.sort) {
    queryKey.push("limit", form.sort);
  }

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const limit = form.limit ?? 50;
      const { replies } = await client.getReplies({
        ...form,
        limit,
      });
      return {
        replies,
        nextPage: replies.length < limit ? null : pageParam + 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (prev) => prev.nextPage,
  });
}

export function useNotificationCount() {
  const replies = useReplies({});
  const data = replies.data?.pages.flatMap((p) => p.replies) ?? [];
  const count = data.reduce((acc, r) => {
    if (!r.comment_reply.read) {
      return acc + 1;
    }
    return acc;
  }, 0);
  return count;
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

  if (form.limit) {
    queryKey.push("limit", String(form.limit));
  }

  const limit = form.limit ?? 50;

  const cachePosts = usePostsStore((s) => s.cachePosts);
  const patchPost = usePostsStore((s) => s.patchPost);

  const cacheImages = useSettingsStore((s) => s.cacheImages);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client.search({
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
            if (!cachedPosts[post.ap_id]?.data.imageDetails) {
              measureImage(thumbnail).then((data) => {
                patchPost(post.ap_id, {
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

      const { communities, comments, users } = res;
      return {
        communities,
        posts: posts.map((p) => p.post.ap_id),
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

export function useFollowCommunity() {
  const { client, queryKeyPrefix } = useLemmyClient();

  const patchCommunity = useCommunitiesStore((s) => s.patchCommunity);
  const cacheCommunity = useCommunitiesStore((s) => s.cacheCommunity);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (form: { community: Community; follow: boolean }) => {
      return client.followCommunity({
        community_id: form.community.id,
        follow: form.follow,
      });
    },
    onMutate: (form) => {
      const slug = createCommunitySlug(form.community);
      patchCommunity(slug, {
        optimisticSubscribed: "Pending",
      });
    },
    onSuccess: (data) => {
      cacheCommunity({
        communityView: data.community_view,
        optimisticSubscribed: undefined,
      });
    },
    onError: (err, form) => {
      const slug = createCommunitySlug(form.community);
      patchCommunity(slug, {
        optimisticSubscribed: undefined,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeyPrefix, "listCommunities"],
      });
    },
  });
}

export function useMarkReplyRead() {
  const { client, queryKeyPrefix } = useLemmyClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (form: MarkCommentReplyAsRead) => {
      return client.markCommentReplyAsRead(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeyPrefix, "getReplies"],
      });
    },
  });
}

export function useCreatePost() {
  const router = useRouter();
  const { client } = useLemmyClient();
  return useMutation({
    mutationFn: (form: CreatePost) => client.createPost(form),
    onSuccess: (res) => {
      const apId = res.post_view.post.ap_id;
      const slug = createCommunitySlug(res.post_view.community);
      router.push(`/c/${slug}/posts/${encodeURIComponent(apId)}`);
    },
  });
}
