import {
  CommentAggregates,
  CommentSortType,
  CommentView,
  Comment,
  Community,
  CreateComment,
  CreateCommentLike,
  GetPosts,
  LemmyHttp,
  ListCommunities,
  Login,
  Person,
  GetReplies,
  Search,
  MarkCommentReplyAsRead,
  CreatePost,
  CreatePostReport,
  CreateCommentReport,
  BlockPerson,
  SavePost,
  DeletePost,
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
import { useFiltersStore } from "~/src/stores/filters";
import { useAuth } from "../../stores/auth";
import { useEffect, useMemo } from "react";
import { prefetch as prefetchImage } from "~/src/components/image";
import _ from "lodash";
import { usePostsStore } from "../../stores/posts";
import { useSettingsStore } from "../../stores/settings";
import { z } from "zod";
import { useCommentsStore } from "../../stores/comments";
import { useThrottleQueue } from "../throttle-queue";
import { useIsFocused } from "@react-navigation/native";
import { useCommunitiesStore } from "../../stores/communities";
import { useRouter } from "one";
import { createCommunitySlug, FlattenedPost, flattenPost } from "./utils";
import { measureImage } from "../image";
import { getPostEmbed } from "../post";
import { useToastController } from "@tamagui/toast";
import { useProfilesStore } from "~/src/stores/profiles";

function useLemmyClient(config?: { instance?: string }) {
  let jwt = useAuth((s) => s.getSelectedAccount().jwt);
  const myUserId = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person.id,
  );
  let instance =
    useAuth((s) => s.getSelectedAccount().instance) ?? "https://lemmy.ml";
  if (config?.instance) {
    instance = config.instance;
    jwt = undefined;
  }

  return useMemo(() => {
    const client = new LemmyHttp(instance, {
      headers: {
        // lemmy.ml will reject requests if
        // User-Agent header is not present
        "User-Agent": "blorp",
      },
    });

    const setJwt = (jwt: string) => {
      client.setHeaders({
        "User-Agent": "blorp",
        Authorization: `Bearer ${jwt}`,
      });
    };

    if (jwt) {
      setJwt(jwt);
    }

    const queryKeyPrefix = [`instance-${instance}`];
    if (myUserId) {
      queryKeyPrefix.push(`user-${myUserId}`);
    }

    return { client, queryKeyPrefix, setJwt };
  }, [jwt, instance, myUserId]);
}

export type FlattenedComment = {
  optimisticMyVote?: number;
  myVote?: number;
  comment: Comment;
  creator: Pick<Person, "id" | "name" | "avatar" | "actor_id">;
  counts: Pick<CommentAggregates, "score">;
  community: {
    name: string;
    title: string;
    icon?: string;
    slug: string;
  };
  post: {
    ap_id: string;
  };
};

export type FlattenedGetCommentsResponse = {
  posts: FlattenedComment[];
};

function flattenComment(commentView: CommentView): FlattenedComment {
  const comment = commentView.comment;
  const community = commentView.community;
  return {
    myVote: commentView.my_vote,
    comment,
    creator: _.pick(commentView.creator, ["id", "name", "avatar", "actor_id"]),
    counts: _.pick(commentView.counts, ["score"]),
    community: {
      name: community.name,
      title: community.title,
      icon: community.icon,
      slug: createCommunitySlug(community),
    },
    post: {
      ap_id: commentView.post.ap_id,
    },
  };
}

export function usePersonDetails({ actorId }: { actorId?: string }) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "getPersonDetails", actorId];

  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!actorId) {
        throw new Error("person_id undefined");
      }

      const { person } = await client.resolveObject({
        q: actorId,
      });

      if (!person) {
        throw new Error("person not found");
      }

      cacheProfiles([_.omit(person, "is_admin")]);

      const { posts, comments, ...rest } = await client.getPersonDetails(
        {
          person_id: person?.person.id,
          limit: 1,
        },
        {
          signal,
        },
      );
      return rest;
    },
    enabled: !!actorId,
  });
}

export function usePersonFeed({ actorId }: { actorId?: string }) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "getPersonFeed", actorId];

  const cacheComments = useCommentsStore((s) => s.cacheComments);

  const cachePosts = usePostsStore((s) => s.cachePosts);
  const patchPost = usePostsStore((s) => s.patchPost);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);

  const cacheImages = useSettingsStore((s) => s.cacheImages);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const limit = 50;

      if (!actorId) {
        throw new Error("person_id undefined");
      }

      const { person } = await client.resolveObject({
        q: actorId,
      });

      if (!person) {
        throw new Error("person not found");
      }

      cacheProfiles([person]);

      const res = await client.getPersonDetails(
        {
          person_id: person.person.id,
          limit,
          page: pageParam,
        },
        {
          signal,
        },
      );

      const posts = res.posts.map((post_view) => flattenPost({ post_view }));
      const cachedPosts = cachePosts(posts);

      prefetchImage(
        res.posts
          .map(({ post }) => getPostEmbed(post).thumbnail)
          .filter(Boolean) as string[],
      );

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
          }, i);
          i += 50;
        }
      }

      const comments = res.comments.map(flattenComment);
      cacheComments(comments);

      return {
        ...res,
        posts: res.posts.map((p) => p.post.ap_id),
        next_page: res.posts.length < limit ? null : pageParam + 1,
      };
    },
    enabled: !!actorId,
    initialPageParam: 1,
    getNextPageParam: (data) => data.next_page,
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

  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);

  return useQuery<FlattenedPost>({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!ap_id) {
        throw new Error("ap_id undefined");
      }
      const { post: resPost } = await client.resolveObject(
        {
          q: ap_id,
        },
        {
          signal,
        },
      );
      if (!resPost) {
        throw new Error("fetchd object is not type post");
      }

      const res2 = await client.getPost(
        {
          id: resPost.post.id,
        },
        {
          signal,
        },
      );

      const post = flattenPost({
        post_view: resPost,
        cross_posts: res2.cross_posts,
      });

      const cachedPost = cachePost({
        ...post,
        // Fetching an individual post marks it
        // as read, but not until the next request
        // is made. We mark it as read here knowing
        // that on Lemmy's end it is now read.
        read: true,
      });

      cacheCommunities([
        {
          communityView: { community: resPost.community },
        },
      ]);

      cacheProfiles([{ person: resPost.creator }]);

      const { thumbnail, type: embedType } = getPostEmbed(post.post);
      if (thumbnail) {
        if (!cachedPost.imageDetails && embedType === "image") {
          measureImage(thumbnail).then((data) => {
            if (data) {
              patchPost(ap_id, {
                imageDetails: data,
              });
            }
          });
        }
        prefetchImage([thumbnail]);
      }

      return post;
    },
    enabled: !!ap_id && enabled,
    initialData,
  });
}

function useCommentsKey() {
  const { queryKeyPrefix } = useLemmyClient();

  const commentSort = useFiltersStore((s) => s.commentSort);

  return (form: GetComments) => {
    const queryKey = [...queryKeyPrefix, "getComments"];

    if (form.saved_only) {
      queryKey.push("savedOnly");
    }

    if (form.post_id) {
      queryKey.push(`postId-${form.post_id}`);
    }

    if (form.parent_id) {
      queryKey.push(`parent-${form.post_id}`);
    }

    if (form.type_) {
      queryKey.push(`type-${form.type_}`);
    }

    const sort = form.sort ?? commentSort;
    if (sort) {
      queryKey.push(`sort-${form.sort}`);
    }

    return queryKey;
  };
}

const DEFAULT_COMMENT_FORM: GetComments = {
  type_: "All",
  limit: 50,
  max_depth: 6,
  saved_only: false,
};

export function useComments(form: GetComments) {
  const commentSort = useFiltersStore((s) => s.commentSort);
  const sort = form.sort ?? commentSort;
  const { client } = useLemmyClient();

  form = {
    ...DEFAULT_COMMENT_FORM,
    ...form,
    sort,
  };

  const queryKey = useCommentsKey()(form);

  const cacheComments = useCommentsStore((s) => s.cacheComments);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const limit = form.limit ?? 50;
      const { comments } = await client.getComments(
        {
          ...form,
          limit,
          page: pageParam,
          sort,
        },
        {
          signal,
        },
      );

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
    enabled: _.isNumber(form.post_id) || form.saved_only,
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

function usePostsKey(form: GetPosts) {
  const { queryKeyPrefix } = useLemmyClient();

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;
  const showNsfw = useSettingsStore((s) => s.showNsfw) || form.show_nsfw;

  const queryKey = [...queryKeyPrefix, "getPosts"];

  if (form.saved_only) {
    queryKey.push("savedOnly");
  }

  if (form.show_read) {
    queryKey.push("showRead");
  }

  if (form.community_name) {
    queryKey.push("community", form.community_name);
  }

  if (form.type_) {
    queryKey.push("type", form.type_);
  }

  if (sort) {
    queryKey.push(`sort-${sort}`);
  }

  if (form.limit) {
    queryKey.push("limit", String(form.limit));
  }

  if (showNsfw) {
    queryKey.push(`nsfw-${showNsfw ? "t" : "f"}`);
  }

  return queryKey;
}

export function useMostRecentPost({ enabled, ...form }: UsePostsConfig) {
  const { client } = useLemmyClient();

  const showNsfw = useSettingsStore((s) => s.showNsfw) || form.show_nsfw;

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const hideRead = useSettingsStore((s) => s.hideRead);

  form = {
    show_read: !hideRead,
    limit: 1,
    sort,
    show_nsfw: showNsfw,
    ...form,
  };

  const queryKey = usePostsKey(form);

  const query = useQuery({
    queryKey: ["mostRecentPost", ...queryKey],
    queryFn: () => client.getPosts(form),
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    data: query.data?.posts?.[0],
  };
}

export function usePosts({ enabled = true, ...form }: UsePostsConfig) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { client } = useLemmyClient();

  const showNsfw = useSettingsStore((s) => s.showNsfw) || form.show_nsfw;

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const hideRead = useSettingsStore((s) => s.hideRead);

  form = {
    show_read: !hideRead,
    limit: 50,
    sort,
    show_nsfw: showNsfw,
    ...form,
  };

  const queryKey = usePostsKey(form);
  const queryKeyStr = queryKey.join("-");

  const cachePosts = usePostsStore((s) => s.cachePosts);
  const patchPost = usePostsStore((s) => s.patchPost);

  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);

  const queryFn = async ({
    pageParam,
    signal,
  }: {
    pageParam: string;
    signal: AbortSignal;
  }) => {
    warmedFeeds.set(queryKeyStr, true);

    const res = await client.getPosts(
      {
        ...form,
        page_cursor: pageParam === "init" ? undefined : pageParam,
      },
      {
        signal,
      },
    );

    const posts = res.posts.map((post_view) => flattenPost({ post_view }));
    const cachedPosts = cachePosts(posts);

    cacheCommunities(
      res.posts.map((p) => ({ communityView: { community: p.community } })),
    );

    cacheProfiles(res.posts.map((p) => ({ person: p.creator })));

    prefetchImage(
      res.posts
        .map(({ post }) => getPostEmbed(post).thumbnail)
        .filter(Boolean) as string[],
    );

    let i = 0;
    for (const { post } of res.posts) {
      const { thumbnail, type: embedType } = getPostEmbed(post);

      if (thumbnail) {
        setTimeout(() => {
          if (
            !cachedPosts[post.ap_id]?.data.imageDetails &&
            embedType === "image"
          ) {
            measureImage(thumbnail).then((data) => {
              patchPost(post.ap_id, {
                imageDetails: data,
              });
            });
          }
        }, i);
        i += 50;
      }
    }

    return {
      posts: posts.map((p) => p.post.ap_id),
      next_page: res.next_page,
    };
  };

  const isWarmed = warmedFeeds.get(queryKeyStr) ?? false;

  const query = useThrottledInfiniteQuery({
    queryKey,
    queryFn,
    getNextPageParam: (lastPage) => lastPage.next_page,
    initialPageParam: "init",
    notifyOnChangeProps: "all",
    staleTime: form.saved_only ? 0 : Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: isWarmed ? false : "always",
    enabled: enabled && (form.type_ === "Subscribed" ? isLoggedIn : true),
  });

  useEffect(() => {
    if (!isWarmed) {
      query.truncatePages();
    }
  }, []);

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

function isInfiniteQueryData(data: any): data is InfiniteData<any> {
  return (
    data &&
    typeof data === "object" &&
    Array.isArray(data.pages) &&
    Array.isArray(data.pageParams)
  );
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
) {
  const queryClient = useQueryClient();
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
  const extendedQuery: UseInfiniteQueryResult<TData, TError> = {
    ...query,
    fetchNextPage: () => {
      if (focused) {
        const p = query.fetchNextPage();
        throttleQueue.flush();
        return p;
      }
      return undefined as any;
    },
    refetch: (refetchOptions) => {
      throttleQueue.clear();
      queryClient.setQueryData<InfiniteData<any>>(options.queryKey, (data) => {
        if (isInfiniteQueryData(data)) {
          return {
            pages: data.pages.slice(0, 1),
            pageParams: data.pageParams.slice(0, 1),
          };
        }
        return data;
      });
      return query.refetch(refetchOptions);
    },
  };

  return {
    ...extendedQuery,
    truncatePages: () => {
      queryClient.setQueryData<InfiniteData<any>>(options.queryKey, (data) => {
        if (isInfiniteQueryData(data)) {
          return {
            pages: data.pages.slice(0, 1),
            pageParams: data.pageParams.slice(0, 1),
          };
        }
        return data;
      });
    },
  };
}

export function useListCommunities(form: ListCommunities) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { client, queryKeyPrefix } = useLemmyClient();

  const showNsfw = useSettingsStore((s) => s.showNsfw);

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

  if (showNsfw) {
    queryKey.push(`nsfw-${showNsfw ? "t" : "f"}`);
  }

  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const limit = form.limit ?? 50;
      const { communities } = await client.listCommunities(
        {
          ...form,
          show_nsfw: showNsfw,
          page: pageParam,
        },
        {
          signal,
        },
      );
      cacheCommunities(communities.map((c) => ({ communityView: c })));
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

  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);

  const queryKey = [
    ...queryKeyPrefix,
    "getCommunity",
    `getCommunity-${form.name}`,
  ];

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const res = await client.getCommunity(
        {
          name: form.name,
        },
        {
          signal,
        },
      );
      cacheCommunities([
        {
          communityView: res.community_view,
        },
      ]);
      return res;
    },
    enabled: !!form.name,
    staleTime: 1000 * 60 * 5,
  });
}

function is2faError(err?: Error | null) {
  return err && err.message.includes("missing_totp_token");
}

export function useLogin(config?: { addAccount?: boolean; instance?: string }) {
  const { client, setJwt } = useLemmyClient(config);

  const updateAccount = useAuth((s) => s.updateAccount);
  const addAccount = useAuth((s) => s.addAccount);

  const toast = useToastController();

  const mutation = useMutation({
    mutationFn: async (form: Login) => {
      const res = await client.login(form);
      if (res.jwt) {
        setJwt(res.jwt);
        const site = await client.getSite();
        const payload = {
          site,
          jwt: res.jwt,
        };
        if (config?.addAccount && config.instance) {
          addAccount({
            ...payload,
            instance: config.instance,
          });
        } else {
          updateAccount(payload);
        }
      }
      return res;
    },
    onMutate: () => {
      toast.hide();
    },
    onError: (err) => {
      if (!is2faError(err)) {
        let errorMsg = "Unkown error";
        if (err.message) {
          errorMsg = _.capitalize(err?.message?.replaceAll("_", " "));
        }
        toast.show(errorMsg, {
          preset: "error",
        });
        console.error(errorMsg);
      }
    },
  });

  return {
    ...mutation,
    needs2FA: is2faError(mutation.error),
  };
}

export function useRefreshAuth() {
  const { client } = useLemmyClient();
  const updateAccount = useAuth((s) => s.updateAccount);

  return useMutation({
    mutationFn: async () => {
      const site = await client.getSite();
      updateAccount({
        site,
      });
    },
    onError: (err) => {
      console.log("Err", err);
    },
  });
}

export function useLogout() {
  const listingType = useFiltersStore((s) => s.listingType);
  const setListingType = useFiltersStore((s) => s.setListingType);
  const communitiesListingType = useFiltersStore(
    (s) => s.communitiesListingType,
  );
  const setCommunitiesListingType = useFiltersStore(
    (s) => s.setCommunitiesListingType,
  );
  const logout = useAuth((s) => s.logout);

  const resetFilters = () => {
    if (listingType === "Subscribed") {
      setListingType("All");
    }
    if (communitiesListingType === "Subscribed") {
      setCommunitiesListingType("All");
    }
  };

  return (index?: number) => {
    logout(index);
    resetFilters();
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

export function useCreateComment({
  queryKeyParentId,
}: {
  queryKeyParentId?: number;
}) {
  const queryClient = useQueryClient();
  const { client } = useLemmyClient();
  const myProfile = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person,
  );
  const commentSort = useFiltersStore((s) => s.commentSort);
  const cacheComment = useCommentsStore((s) => s.cacheComment);
  const removeComment = useCommentsStore((s) => s.removeComment);

  const getCommentsKey = useCommentsKey();

  return useMutation({
    mutationFn: async ({ parentPath, ...form }: CreateCommentWithPath) => {
      return await client.createComment(form);
    },
    onMutate: ({ post_id, parentPath, content }) => {
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
          actor_id: myProfile?.actor_id ?? "",
        },
        counts: {
          score: 1,
        },
        myVote: 1,
        community: {
          name: "",
          title: "",
          slug: "",
        },
        post: {
          ap_id: "",
        },
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
        const form: GetComments = {
          ...DEFAULT_COMMENT_FORM,
          post_id,
          parent_id: queryKeyParentId,
          sort,
        };

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
        >(getCommentsKey(form));

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

        queryClient.setQueryData(getCommentsKey(form), comments);
      }

      return newComment;
    },
    onSuccess: (res, { post_id }, ctx) => {
      const settledCommentPath = res.comment_view.comment.path;

      const SORTS: CommentSortType[] = [
        "Hot",
        "Top",
        "New",
        "Old",
        "Controversial",
      ];

      cacheComment(flattenComment(res.comment_view));
      removeComment(ctx.comment.path);

      for (const sort of SORTS) {
        const form: GetComments = {
          ...DEFAULT_COMMENT_FORM,
          post_id: post_id,
          parent_id: queryKeyParentId,
          sort,
        };

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
        >(getCommentsKey(form));

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

        queryClient.setQueryData(getCommentsKey(form), comments);
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
      cacheComment(flattenComment(comment_view));
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
      cacheComment(flattenComment(comment_view));
    },
  });
}

export function useReplies(form: GetReplies) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
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
    enabled: isLoggedIn,
    refetchOnWindowFocus: "always",
  });
}

function useNotificationCountQueryKey() {
  const { queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "notificationCount"];

  return queryKey;
}

export function useNotificationCount() {
  const { client } = useLemmyClient();
  const isLoggedIn = useAuth((a) => a.isLoggedIn());

  const queryKey = useNotificationCountQueryKey();

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { replies } = await client.getReplies({
        unread_only: true,
        limit: 50,
      });
      return replies.length;
    },
    enabled: isLoggedIn,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: "always",
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

  if (form.sort) {
    queryKey.push("sort", form.sort);
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
            // ExpoImage.prefetch([thumbnail], {
            //   cachePolicy: cacheImages ? "disk" : "memory",
            // });
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
  const toast = useToastController();

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
      toast.show("Couldn't follow community", {
        preset: "error",
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
  const toast = useToastController();

  const notificationCountQueryKey = useNotificationCountQueryKey();

  return useMutation({
    mutationFn: (form: MarkCommentReplyAsRead) => {
      return client.markCommentReplyAsRead(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationCountQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeyPrefix, "getReplies"],
      });
    },
    onError: (_, { read }) => {
      toast.show(`Couldn't mark post ${read ? "read" : "unread"}`, {
        preset: "error",
      });
    },
  });
}

export function useCreatePost() {
  const router = useRouter();
  const { client } = useLemmyClient();
  const toast = useToastController();
  return useMutation({
    mutationFn: (form: CreatePost) => client.createPost(form),
    onSuccess: (res) => {
      const apId = res.post_view.post.ap_id;
      const slug = createCommunitySlug(res.post_view.community);
      router.push(`/c/${slug}/posts/${encodeURIComponent(apId)}`);
    },
    onError: () => {
      toast.show("Couldn't create post", {
        preset: "error",
      });
    },
  });
}

export function useCreatePostReport() {
  const { client } = useLemmyClient();
  const toast = useToastController();
  return useMutation({
    mutationFn: (form: CreatePostReport) => client.createPostReport(form),
    onError: () => {
      toast.show("Couldn't create post report", {
        preset: "error",
      });
    },
  });
}

export function useCreateCommentReport() {
  const { client } = useLemmyClient();
  const toast = useToastController();
  return useMutation({
    mutationFn: (form: CreateCommentReport) => client.createCommentReport(form),
    onError: () => {
      toast.show("Couldn't block person", {
        preset: "error",
      });
    },
  });
}

export function useBlockPerson() {
  const { client } = useLemmyClient();

  const toast = useToastController();
  return useMutation({
    mutationFn: (form: BlockPerson) => client.blockPerson(form),
    onError: () => {
      toast.show("Couldn't block person", {
        preset: "error",
      });
    },
  });
}

export function useSavePost(apId: string) {
  const queryClient = useQueryClient();
  const { client } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);

  const postsQueryKey = usePostsKey({
    saved_only: true,
  });

  const toast = useToastController();

  return useMutation({
    mutationFn: (form: SavePost) => client.savePost(form),
    onMutate: ({ save }) => {
      patchPost(apId, {
        optimisticSaved: save,
      });
    },
    onSuccess: ({ post_view }) => {
      patchPost(apId, {
        ...flattenPost({ post_view }),
        optimisticSaved: undefined,
      });
      queryClient.invalidateQueries({
        queryKey: postsQueryKey,
      });
    },
    onError: (_, { save }) => {
      patchPost(apId, {
        optimisticSaved: undefined,
      });
      toast.show(`Couldn't ${save ? "save" : "unsave"} post`, {
        preset: "error",
      });
    },
  });
}

export function useDeletePost(apId: string) {
  const { client } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);

  const toast = useToastController();

  return useMutation({
    mutationFn: (form: DeletePost) => client.deletePost(form),
    onMutate: ({ deleted }) => {
      patchPost(apId, {
        optimisticDeleted: deleted,
      });
    },
    onSuccess: ({ post_view }) => {
      patchPost(apId, {
        ...flattenPost({ post_view }),
        optimisticDeleted: undefined,
      });
    },
    onError: (_, { deleted }) => {
      patchPost(apId, {
        optimisticDeleted: undefined,
      });
      toast.show(`Couldn't ${deleted ? "delete" : "restore"} post`, {
        preset: "error",
      });
    },
  });
}

function useMarkPostRead() {
  const { client } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);

  return useMutation({
    mutationFn: (form: { post_id: number; read: boolean; apId: string }) => {
      return client.markPostAsRead(form);
    },
    onMutate: ({ read, apId }) => {
      patchPost(apId, {
        optimisticRead: read,
      });
    },
    onSuccess: (_, { read, apId }) => {
      patchPost(apId, {
        optimisticRead: undefined,
        read,
      });
    },
    onError: (_, { apId }) => {
      patchPost(apId, {
        optimisticRead: undefined,
      });
    },
  });
}
