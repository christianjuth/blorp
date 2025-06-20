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
  CreatePostReport,
  CreateCommentReport,
  BlockPerson,
  SavePost,
  DeletePost,
  FeaturePost,
  UploadImage,
  MarkPostAsRead,
  GetPersonMentions,
  Register,
  MarkPersonMentionAsRead,
  BlockCommunity,
  GetSiteResponse,
  CreatePrivateMessage,
  PrivateMessageView,
  MarkPrivateMessageAsRead,
} from "lemmy-js-client";
import {
  useQuery,
  InfiniteData,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { GetComments } from "lemmy-js-client";
import { useFiltersStore } from "@/src/stores/filters";
import {
  Account,
  getCachePrefixer,
  parseAccountInfo,
  useAuth,
} from "../../stores/auth";
import { useMemo, useRef } from "react";
import _ from "lodash";
import { usePostsStore } from "../../stores/posts";
import { useSettingsStore } from "../../stores/settings";
import { z } from "zod";
import { useCommentsStore } from "../../stores/comments";
import { useCommunitiesStore } from "../../stores/communities";
import {
  createSlug,
  FlattenedPost,
  flattenPost,
  lemmyTimestamp,
} from "./utils";
import { useProfilesStore } from "@/src/stores/profiles";
import { useIonRouter } from "@ionic/react";
import { toast } from "sonner";
import {
  Draft,
  draftToCreatePostData,
  draftToEditPostData,
} from "@/src/stores/create-post";
import { env } from "@/src/env";
import {
  isInfiniteQueryData,
  useThrottledInfiniteQuery,
} from "./infinite-query";
import { produce } from "immer";

enum Errors {
  OBJECT_NOT_FOUND = "couldnt_find_object",
}

const DEFAULT_HEADERS = {
  // lemmy.ml will reject requests if
  // User-Agent header is not present
  "User-Agent": env.REACT_APP_NAME.toLowerCase(),
};

function useLemmyClient(account?: Partial<Account>) {
  let jwt = useAuth((s) => s.getSelectedAccount().jwt);
  const myUserId = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person.id,
  );
  let instance =
    useAuth((s) => s.getSelectedAccount().instance) ?? "https://lemmy.ml";
  if (account?.instance) {
    instance = account.instance;
    jwt = account.jwt;
  }

  return useMemo(() => {
    const client = new LemmyHttp(instance.replace(/\/$/, ""), {
      headers: DEFAULT_HEADERS,
    });

    const setJwt = (jwt: string) => {
      client.setHeaders({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${jwt}`,
      });
    };

    if (jwt) {
      setJwt(jwt);
    }

    const queryKeyPrefix: unknown[] = [`instance-${instance}`];
    if (myUserId) {
      queryKeyPrefix.push(`user-${myUserId}`);
    }

    return { client, queryKeyPrefix, setJwt, instance };
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
    name?: string;
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
      slug: createSlug(community, true)?.slug,
    },
    post: {
      ap_id: commentView.post.ap_id,
      name: commentView.post.name,
    },
  };
}

export function usePersonDetails({
  actorId,
  enabled = true,
}: {
  actorId?: string;
  enabled?: boolean;
}) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "getPersonDetails", actorId];

  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!actorId) {
        throw new Error("person_id undefined");
      }

      const { person } = await client.resolveObject(
        {
          q: actorId,
        },
        { signal },
      );

      if (!person) {
        throw new Error("person not found");
      }

      const res = await client.getPersonDetails(
        {
          person_id: person?.person.id,
          limit: 1,
        },
        {
          signal,
        },
      );
      cacheProfiles(getCachePrefixer(), [_.omit(res.person_view, "is_admin")]);

      return _.omit(res, ["posts", "comments"]);
    },
    enabled: !!actorId && enabled,
  });
}

export function usePersonFeed({ actorId }: { actorId?: string }) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const postSort = useFiltersStore((s) => s.postSort);

  const queryKey = [
    ...queryKeyPrefix,
    "getPersonFeed",
    actorId,
    `sort-${postSort}`,
  ];

  const cacheComments = useCommentsStore((s) => s.cacheComments);

  const cachePosts = usePostsStore((s) => s.cachePosts);
  // const patchPost = usePostsStore((s) => s.patchPost);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

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

      const res = await client.getPersonDetails(
        {
          person_id: person.person.id,
          limit,
          page: pageParam,
          sort: postSort,
        },
        {
          signal,
        },
      );
      cacheProfiles(getCachePrefixer(), [_.omit(res.person_view, "is_admin")]);

      const posts = res.posts.map((post_view) => flattenPost({ post_view }));
      cachePosts(getCachePrefixer(), posts);

      const comments = res.comments.map(flattenComment);
      cacheComments(getCachePrefixer(), comments);

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

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  const initialData = usePostsStore((s) =>
    ap_id ? s.posts[getCachePrefixer()(ap_id)]?.data : undefined,
  );

  const cachePost = usePostsStore((s) => s.cachePost);
  // const patchPost = usePostsStore((s) => s.patchPost);

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

      cachePost(getCachePrefixer(), {
        ...post,
        // Fetching an individual post marks it
        // as read, but not until the next request
        // is made. We mark it as read here knowing
        // that on Lemmy's end it is now read.
        read: true,
      });

      cacheCommunities(getCachePrefixer(), [
        {
          communityView: { community: resPost.community },
        },
      ]);

      cacheProfiles(getCachePrefixer(), [{ person: resPost.creator }]);

      return post;
    },
    retry: (count, err) => {
      const notFound = err.message === Errors.OBJECT_NOT_FOUND;
      if (notFound) {
        return false;
      }
      return count <= 3;
    },
    enabled: !!ap_id && enabled,
    initialData,
    refetchOnMount: "always",
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
      queryKey.push(`parent-${form.parent_id}`);
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

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheComments = useCommentsStore((s) => s.cacheComments);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const cachePosts = usePostsStore((s) => s.cachePosts);

  const prevPageParam = useRef(-1);
  const prevPage = useRef("");

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

      const page =
        queryKey.join() + comments.map((c) => c.comment.ap_id).join();

      if (page === prevPage.current && pageParam !== prevPageParam.current) {
        return {
          comments: [],
          nextPage: null,
        };
      }

      prevPage.current = page;
      prevPageParam.current = pageParam;

      cacheComments(getCachePrefixer(), comments.map(flattenComment));
      cacheProfiles(
        getCachePrefixer(),
        comments.map((c) => ({ person: c.creator })),
      );

      return {
        comments: comments.map((c) => ({
          path: c.comment.path,
          postId: c.comment.post_id,
          creatorId: c.creator.id,
          published: c.comment.published,
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
    refetchOnMount: "always",
  });
}

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

export function useMostRecentPost(
  featuredContext: "local" | "community",
  { enabled, ...form }: UsePostsConfig,
) {
  const { client } = useLemmyClient();

  const showNsfw = useSettingsStore((s) => s.showNsfw) || form.show_nsfw;

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const hideRead = useSettingsStore((s) => s.hideRead);

  form = {
    show_read: !hideRead,
    sort,
    show_nsfw: showNsfw,
    ...form,
    limit: 10,
  } satisfies GetPosts;

  const queryKey = usePostsKey(form);

  const query = useQuery({
    queryKey: ["mostRecentPost", ...queryKey],
    queryFn: ({ signal }) => client.getPosts(form, { signal }),
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    enabled,
  });

  return {
    ...query,
    data: query.data?.posts?.find(({ post }) => {
      switch (featuredContext) {
        case "local":
          return !post.featured_local;
        case "community":
          return !post.featured_community;
      }
    }),
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

  const cachePosts = usePostsStore((s) => s.cachePosts);
  // const patchPost = usePostsStore((s) => s.patchPost);

  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  const queryFn = async ({
    pageParam,
    signal,
  }: {
    pageParam: string;
    signal: AbortSignal;
  }) => {
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
    cachePosts(getCachePrefixer(), posts);

    cacheCommunities(
      getCachePrefixer(),
      res.posts.map((p) => ({ communityView: { community: p.community } })),
    );

    cacheProfiles(
      getCachePrefixer(),
      res.posts.map((p) => ({ person: p.creator })),
    );

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
    enabled: enabled && (form.type_ === "Subscribed" ? isLoggedIn : true),
    reduceAutomaticRefetch: true,
  });

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

export function useListCommunities(form: ListCommunities) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { client, queryKeyPrefix } = useLemmyClient();

  const showNsfw = useSettingsStore((s) => s.showNsfw);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

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
      cacheCommunities(
        getCachePrefixer(),
        communities.map((c) => ({ communityView: c })),
      );
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
export function useCommunity({
  enabled = true,
  ...form
}: {
  enabled?: boolean;
  name?: string;
  instance?: string;
}) {
  const { client, queryKeyPrefix } = useLemmyClient();

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);

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
      cacheCommunities(getCachePrefixer(), [
        {
          communityView: res.community_view,
          mods: res.moderators,
        },
      ]);
      cacheProfiles(
        getCachePrefixer(),
        res.moderators.map((m) => ({ person: m.moderator })),
      );
      return res;
    },
    enabled: !!form.name && enabled,
    staleTime: 1000 * 60 * 5,
  });
}

function is2faError(err?: Error | null) {
  return err && err.message.includes("missing_totp_token");
}

export function useSite({ instance }: { instance: string }) {
  return useQuery({
    queryKey: ["getSite", instance],
    queryFn: () => {
      const client = new LemmyHttp(instance);
      return client.getSite();
    },
  });
}

export function useRegister(config?: {
  addAccount?: boolean;
  instance?: string;
}) {
  const { client, setJwt } = useLemmyClient({ instance: config?.instance });

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const updateSelectedAccount = useAuth((s) => s.updateSelectedAccount);
  const addAccount = useAuth((s) => s.addAccount);

  const mutation = useMutation({
    mutationFn: async (form: Register) => {
      const res = await client.register(form);
      if (res.jwt) {
        setJwt(res.jwt);
        const site = await client.getSite();
        const person = site.my_user?.local_user_view.person;
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
          updateSelectedAccount(payload);
        }
        if (person) {
          cacheProfiles(getCachePrefixer(), [{ person }]);
        }
      }
      return res;
    },
    onSuccess: (res) => {
      if (!res.jwt) {
        toast.success(
          [
            res.verify_email_sent &&
              "Check your email to confirm registration.",
            res.registration_created &&
              "Your account will be approved soon then you can login.",
          ]
            .filter(Boolean)
            .join(" "),
          {
            duration: 20 * 1000,
          },
        );
      }
    },
    onError: (err) => {
      if (!is2faError(err)) {
        let errorMsg = "Unkown error";
        if (err.message) {
          errorMsg = _.capitalize(err?.message?.replaceAll("_", " "));
        }
        toast.error(errorMsg);
        console.error(errorMsg);
      }
    },
  });

  return {
    ...mutation,
    needs2FA: is2faError(mutation.error),
  };
}

export function useLogin(config?: { addAccount?: boolean; instance?: string }) {
  const { client, setJwt } = useLemmyClient(config);

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const updateSelectedAccount = useAuth((s) => s.updateSelectedAccount);
  const addAccount = useAuth((s) => s.addAccount);

  const mutation = useMutation({
    mutationFn: async (form: Login) => {
      const res = await client.login(form);
      if (res.jwt) {
        setJwt(res.jwt);
        const site = await client.getSite();
        const person = site.my_user?.local_user_view.person;
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
          updateSelectedAccount(payload);
        }
        if (person) {
          cacheProfiles(getCachePrefixer(), [{ person }]);
        }
      }
      return res;
    },
    onMutate: () => {},
    onError: (err) => {
      if (!is2faError(err)) {
        let errorMsg = "Unkown error";
        if (err.message) {
          errorMsg = _.capitalize(err?.message?.replaceAll("_", " "));
        }
        toast.error(errorMsg);
        console.error(errorMsg);
      }
    },
  });

  return {
    ...mutation,
    needs2FA: is2faError(mutation.error),
  };
}

function useRefreshAuthKey() {
  const accounts = useAuth((s) => s.accounts);
  return ["refreshAuth", ...accounts.map((a) => Boolean(a.jwt))];
}

export function useRefreshAuth() {
  const updateAccount = useAuth((s) => s.updateAccount);
  const logoutMultiple = useAuth((s) => s.logoutMultiple);

  const accounts = useAuth((s) => s.accounts);

  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);

  const queryKey = useRefreshAuthKey();

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const logoutIndicies: number[] = [];
      const sites: (GetSiteResponse | null)[] =
        Array.from<GetSiteResponse | null>({
          length: accounts.length,
        }).fill(null);

      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        if (!account) {
          continue;
        }

        const client = new LemmyHttp(account.instance);
        if (account.jwt) {
          client.setHeaders({
            ...DEFAULT_HEADERS,
            Authorization: `Bearer ${account.jwt}`,
          });
        } else {
          client.setHeaders(DEFAULT_HEADERS);
        }

        const site = await client.getSite({ signal });
        sites[i] = site;
        if (account.jwt && !site.my_user) {
          logoutIndicies.push(i);
          continue;
        }
        if (site.my_user) {
          cacheProfiles(getCachePrefixer(account), [
            _.pick(site.my_user.local_user_view, ["person", "counts"]),
          ]);
          cacheCommunities(
            getCachePrefixer(account),
            [...site.my_user.follows, ...site.my_user.moderates].map(
              ({ community }) => ({
                communityView: { community },
              }),
            ),
          );
        }
        cacheProfiles(
          getCachePrefixer(account),
          site.admins.map((p) => _.pick(p, ["person", "counts"])),
        );
        updateAccount(i, {
          site,
        });
      }

      if (logoutIndicies.length > 0) {
        logoutMultiple(logoutIndicies);
      }

      return {};
    },
    //onError: (err: any) => {
    //  console.log("Err", err);
    //},
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
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

  const mut = useMutation({
    mutationFn: async (account: Account) => {
      const client = new LemmyHttp(account.instance);
      client.setHeaders({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${account.jwt}`,
      });
      return await client.logout();
    },
    onSuccess: ({ success }, account) => {
      if (success) {
        logout(account);
        resetFilters();
      }
    },
  });

  const logout = useAuth((s) => s.logout);

  const resetFilters = () => {
    if (listingType === "Subscribed") {
      setListingType("All");
    }
    if (communitiesListingType === "Subscribed") {
      setCommunitiesListingType("All");
    }
  };

  return mut;
}

export function useLikePost(apId: string) {
  const { client } = useLemmyClient();

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = usePostsStore((s) => s.posts[getCachePrefixer()(apId)]?.data);
  const patchPost = usePostsStore((s) => s.patchPost);

  return useMutation({
    mutationKey: ["likePost", apId],
    mutationFn: (score: -1 | 0 | 1) => {
      if (!post) {
        throw new Error("post not found");
      }
      return client.likePost({
        post_id: post.post.id,
        score,
      });
    },
    onMutate: (myVote) =>
      patchPost(apId, getCachePrefixer(), {
        optimisticMyVote: myVote,
      }),
    onSuccess: (data) =>
      patchPost(apId, getCachePrefixer(), {
        optimisticMyVote: undefined,
        ...flattenPost(data),
      }),
    onError: (err, vote) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticMyVote: undefined,
      });
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        let verb = "";
        switch (vote) {
          case 0:
            verb = "upvote";
          case 1:
            verb = "unvote";
          case -1:
            verb = "downvote";
        }
        toast.error(`Couldn't ${verb} post`);
      }
    },
  });
}

interface CustumCreateCommentLike extends CreateCommentLike {
  post_id: number;
  path: string;
}

export function useLikeComment() {
  const { client } = useLemmyClient();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const patchComment = useCommentsStore((s) => s.patchComment);
  const cacheComment = useCommentsStore((s) => s.cacheComment);

  return useMutation({
    mutationFn: (form: CustumCreateCommentLike) =>
      client.likeComment(_.omit(form, ["path", "post_id"])),
    onMutate: ({ score, path }) => {
      patchComment(path, getCachePrefixer(), () => ({
        optimisticMyVote: score,
      }));
    },
    onSuccess: (data) => {
      cacheComment(getCachePrefixer(), flattenComment(data.comment_view));
    },
    onError: (err, { path, score }) => {
      patchComment(path, getCachePrefixer(), () => ({
        optimisticMyVote: undefined,
      }));
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        let verb = "";
        switch (score) {
          case 0:
            verb = "upvote";
          case 1:
            verb = "unvote";
          case -1:
            verb = "downvote";
        }
        toast.error(`Couldn't ${verb} post`);
      }
    },
  });
}

interface CreateCommentWithPath extends CreateComment {
  parentPath?: string;
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { client } = useLemmyClient();
  const myProfile = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person,
  );
  const commentSort = useFiltersStore((s) => s.commentSort);
  const cacheComment = useCommentsStore((s) => s.cacheComment);
  const markCommentForRemoval = useCommentsStore(
    (s) => s.markCommentForRemoval,
  );

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  const getCommentsKey = useCommentsKey();

  return useMutation({
    mutationFn: (form: CreateCommentWithPath & { queryKeyParentId?: number }) =>
      client.createComment(_.omit(form, ["parentPath", "queryKeyParentId"])),
    onMutate: ({ post_id, parentPath, content, queryKeyParentId }) => {
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
          path: `${parentPath ?? 0}.${commentId}`,
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

      cacheComment(getCachePrefixer(), newComment);

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
                published: string;
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
            published: newComment.comment.published,
          });
        }

        queryClient.setQueryData(getCommentsKey(form), comments);
      }

      return newComment;
    },
    onSuccess: (res, { post_id, queryKeyParentId }, ctx) => {
      const settledComment = {
        path: res.comment_view.comment.path,
        creatorId: res.comment_view.creator.id,
        postId: res.comment_view.comment.post_id,
        published: res.comment_view.comment.published,
      };

      const SORTS: CommentSortType[] = [
        "Hot",
        "Top",
        "New",
        "Old",
        "Controversial",
      ];

      markCommentForRemoval(ctx.comment.path, getCachePrefixer());
      cacheComment(getCachePrefixer(), flattenComment(res.comment_view));

      sort: for (const sort of SORTS) {
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
                published: string;
              }[];
              nextPage: number | null;
            },
            unknown
          >
        >(getCommentsKey(form));

        if (!comments) {
          // TODO: I think we have to trigger an API fetch here
          continue;
        }

        comments = _.cloneDeep(comments);

        // Technically we can skip this if we are removing
        // the comment from the cache
        for (const p of comments.pages) {
          const index = p.comments.findIndex(
            (c) => c.path === ctx.comment.path,
          );
          if (index >= 0) {
            p.comments[index] = settledComment;
            queryClient.setQueryData(getCommentsKey(form), comments);
            continue sort;
          }
        }

        // If we're here then we didn't find the optimistic comment
        const firstPage = comments.pages[0];
        if (!firstPage) {
          // TODO: I think we have to trigger an API fetch here
          continue;
        }
        if (firstPage) {
          firstPage.comments.unshift(settledComment);
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
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: (form: { comment_id: number; content: string; path: string }) =>
      client.editComment(_.omit(form, "path")),
    onMutate: ({ path, content }) => {
      patchComment(path, getCachePrefixer(), (prev) => ({
        comment: {
          ...prev.comment,
          content,
        },
      }));
    },
    onSuccess: ({ comment_view }) => {
      cacheComment(getCachePrefixer(), flattenComment(comment_view));
    },
  });
}

export function useDeleteComment() {
  const { client } = useLemmyClient();
  const patchComment = useCommentsStore((s) => s.patchComment);
  const cacheComment = useCommentsStore((s) => s.cacheComment);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: (form: {
      comment_id: number;
      path: string;
      deleted: boolean;
    }) => client.deleteComment(_.omit(form, "path")),
    onMutate: ({ path, deleted }) => {
      patchComment(path, getCachePrefixer(), (prev) => ({
        ...prev,
        comment: {
          ...prev.comment,
          deleted,
        },
      }));
    },
    onSuccess: ({ comment_view }) => {
      cacheComment(getCachePrefixer(), flattenComment(comment_view));
    },
  });
}

function usePrivateMessagesKey() {
  const { queryKeyPrefix } = useLemmyClient();
  return [...queryKeyPrefix, "getPrivateMessages"];
}

export function usePrivateMessages(form: {}) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { client } = useLemmyClient();
  const queryKey = usePrivateMessagesKey();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const limit = 50;
      const { private_messages } = await client.getPrivateMessages(
        {
          ...form,
          page: pageParam,
          limit,
        },
        {
          signal,
        },
      );
      const profiles = _.uniqBy(
        [
          ...private_messages.map((pm) => pm.creator),
          ...private_messages.map((pm) => pm.recipient),
        ],
        "actor_id",
      );
      cacheProfiles(
        getCachePrefixer(),
        profiles.map((person) => ({ person })),
      );
      return {
        private_messages,
        nextPage: private_messages.length < limit ? null : pageParam + 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (prev) => prev.nextPage,
    enabled: isLoggedIn,
    refetchOnWindowFocus: "always",
    refetchIntervalInBackground: true,
    refetchInterval: 1000 * 60,
    refetchOnMount: "always",
  });
}

export function useCreatePrivateMessage(recipient: Person) {
  const account = useAuth((s) => s.getSelectedAccount());
  const { person: me } = parseAccountInfo(account);
  const { client } = useLemmyClient();
  const privateMessagesKey = usePrivateMessagesKey();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: CreatePrivateMessage) =>
      client.createPrivateMessage(form),
    onMutate: (ctx) => {
      if (me) {
        const pm: PrivateMessageView = {
          creator: {
            ...me,
          },
          recipient,
          private_message: {
            id: -1 * _.random(),
            creator_id: me?.id,
            deleted: false,
            read: false,
            published: lemmyTimestamp(),
            local: false,
            ap_id: "",
            ...ctx,
          },
        };
        queryClient.setQueryData<
          InfiniteData<
            { private_messages: PrivateMessageView[]; nextPage: number },
            number
          >
        >(privateMessagesKey, (data) => {
          if (isInfiniteQueryData(data)) {
            const pages = [...data.pages];
            if (_.isArray(pages[0]?.private_messages)) {
              pages[0] = _.cloneDeep(pages[0]);
              pages[0].private_messages.unshift(pm);
            }
            return {
              ...data,
              pages,
            };
          }
          return data;
        });
      }
    },
  });
}

function usePrivateMessageCountQueryKey() {
  const queryKey = ["privateMessageCount"];
  return queryKey;
}

export function usePrivateMessagesCount() {
  const isLoggedIn = useAuth((a) => a.isLoggedIn());

  const queryKey = usePrivateMessageCountQueryKey();
  const accounts = useAuth((s) => s.accounts);

  const { data } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const counts: number[] = [];

      for (const account of accounts) {
        if (!account.jwt) {
          counts.push(0);
          continue;
        }
        const { person: me } = parseAccountInfo(account);
        const client = new LemmyHttp(account.instance, {
          headers: {
            ...DEFAULT_HEADERS,
            Authorization: `Bearer ${account.jwt}`,
          },
        });
        const { private_messages } = await client.getPrivateMessages(
          {
            unread_only: true,
            limit: 50,
          },
          { signal },
        );
        counts.push(
          private_messages.filter((pm) => pm.creator.id !== me?.id).length,
        );
      }

      return counts;
    },
    enabled: isLoggedIn,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: "always",
  });

  return data ?? EMPTY_ARR;
}

export function useMarkPriavteMessageRead() {
  const { client } = useLemmyClient();
  const queryClient = useQueryClient();
  const accountIndex = useAuth((s) => s.accountIndex);

  const privateMessagesKey = usePrivateMessagesKey();
  const privateMessageCountQueryKey = usePrivateMessageCountQueryKey();

  return useMutation({
    mutationFn: (form: MarkPrivateMessageAsRead) =>
      client.markPrivateMessageAsRead(form),
    onMutate: (form) => {
      queryClient.setQueryData<number[]>(
        privateMessageCountQueryKey,
        (data) => {
          if (_.isNumber(data?.[accountIndex])) {
            const clone = [...data];
            const prev = clone[accountIndex];
            if (_.isNumber(prev)) {
              clone[accountIndex] = Math.max(prev + (form.read ? -1 : 1), 0);
            }
            return clone;
          }
          return data;
        },
      );
      queryClient.setQueryData<
        InfiniteData<
          { private_messages: PrivateMessageView[]; nextPage: number },
          number
        >
      >(privateMessagesKey, (data) => {
        if (isInfiniteQueryData(data)) {
          return produce(data, (draftState) => {
            for (const page of draftState.pages) {
              const messageIndex = page.private_messages.findIndex(
                (pm) => pm.private_message.id === form.private_message_id,
              );
              if (messageIndex >= 0 && page.private_messages[messageIndex]) {
                page.private_messages[messageIndex].private_message.read =
                  form.read;
              }
            }
          });
        }
        return data;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: privateMessageCountQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: privateMessagesKey,
      });
    },
    onError: (err, { read }) => {
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error(`Couldn't mark message ${read ? "read" : "unread"}`);
      }
    },
  });
}

export function useReplies(form: GetReplies) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { client, queryKeyPrefix } = useLemmyClient();
  const queryKey = [...queryKeyPrefix, "getReplies", form];
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const limit = form.limit ?? 50;
      const { replies } = await client.getReplies(
        {
          ...form,
          limit,
        },
        {
          signal,
        },
      );
      const profiles = _.uniqBy(
        replies.map((pm) => pm.creator),
        "actor_id",
      );
      cacheProfiles(
        getCachePrefixer(),
        profiles.map((person) => ({ person })),
      );
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

export function usePersonMentions(form: GetPersonMentions) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { client, queryKeyPrefix } = useLemmyClient();
  const queryKey = [...queryKeyPrefix, "getPersonMentions", form];
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const limit = form.limit ?? 50;
      const { mentions } = await client.getPersonMentions(
        {
          ...form,
          limit,
        },
        {
          signal,
        },
      );
      const profiles = _.uniqBy(
        mentions.map((pm) => pm.creator),
        "actor_id",
      );
      cacheProfiles(
        getCachePrefixer(),
        profiles.map((person) => ({ person })),
      );
      return {
        mentions,
        nextPage: mentions.length < limit ? null : pageParam + 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (prev) => prev.nextPage,
    enabled: isLoggedIn,
    refetchOnWindowFocus: "always",
  });
}

function useNotificationCountQueryKey() {
  const queryKey = ["notificationCount"];
  return queryKey;
}

export function useNotificationCount() {
  const isLoggedIn = useAuth((a) => a.isLoggedIn());

  const queryKey = useNotificationCountQueryKey();
  const accounts = useAuth((s) => s.accounts);

  const { data } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const counts: number[] = [];

      for (const account of accounts) {
        if (!account.jwt) {
          counts.push(0);
          continue;
        }

        const client = new LemmyHttp(account.instance, {
          headers: {
            ...DEFAULT_HEADERS,
            Authorization: `Bearer ${account.jwt}`,
          },
        });

        const [{ mentions }, { replies }] = await Promise.all([
          client.getPersonMentions(
            {
              unread_only: true,
              limit: 50,
            },
            { signal },
          ),
          client.getReplies(
            {
              unread_only: true,
              limit: 50,
            },
            { signal },
          ),
        ]);
        counts.push(mentions.length + replies.length);
      }

      return counts;
    },
    enabled: isLoggedIn,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: "always",
  });

  return data ?? EMPTY_ARR;
}
const EMPTY_ARR: never[] = [];

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

  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const cachePosts = usePostsStore((s) => s.cachePosts);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const res = await client.search(
        {
          ...form,
          page: pageParam,
          limit,
        },
        {
          signal,
        },
      );

      const posts = res.posts.map((post_view) => flattenPost({ post_view }));
      cacheProfiles(getCachePrefixer(), res.users);
      cachePosts(getCachePrefixer(), posts);

      const {
        communities,
        users,
        // comments, users
      } = res;
      return {
        communities,
        posts: posts.map((p) => p.post.ap_id),
        users: users.map((u) => u.person.actor_id),
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
    queryFn: async ({ signal }) => {
      const res = await fetch(
        "https://data.lemmyverse.net/data/instance.full.json",
        { signal },
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
      } catch {
        return undefined;
      }
    },
  });
}

export function useFollowCommunity() {
  const { client, queryKeyPrefix } = useLemmyClient();

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
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
      const slug = createSlug(form.community)?.slug;
      if (slug) {
        patchCommunity(slug, getCachePrefixer(), {
          optimisticSubscribed: "Pending",
        });
      }
    },
    onSuccess: (data) => {
      cacheCommunity(getCachePrefixer(), {
        communityView: data.community_view,
        optimisticSubscribed: undefined,
      });
    },
    onError: (err, form) => {
      const slug = createSlug(form.community)?.slug;
      if (slug) {
        patchCommunity(slug, getCachePrefixer(), {
          optimisticSubscribed: undefined,
        });
      }
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error("Couldn't follow community");
      }
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

  const notificationCountQueryKey = useNotificationCountQueryKey();

  return useMutation({
    mutationFn: (form: MarkCommentReplyAsRead) =>
      client.markCommentReplyAsRead(form),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationCountQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeyPrefix, "getReplies"],
      });
    },
    onError: (err, { read }) => {
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error(`Couldn't mark post ${read ? "read" : "unread"}`);
      }
    },
  });
}

export function useMarkPersonMentionRead() {
  const { client, queryKeyPrefix } = useLemmyClient();
  const queryClient = useQueryClient();

  const notificationCountQueryKey = useNotificationCountQueryKey();

  return useMutation({
    mutationFn: (form: MarkPersonMentionAsRead) =>
      client.markPersonMentionAsRead(form),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationCountQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeyPrefix, "getPersonMentions"],
      });
    },
    onError: (err, { read }) => {
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error(`Couldn't mark mention ${read ? "read" : "unread"}`);
      }
    },
  });
}

export function useCreatePost() {
  const router = useIonRouter();
  const { client } = useLemmyClient();
  return useMutation({
    mutationFn: async (draft: Draft) => {
      if (!draft.community?.actor_id) {
        throw new Error("could not find community to create post under");
      }

      const { community } = await client.resolveObject({
        q: draft.community?.actor_id,
      });

      if (!community) {
        throw new Error("could not find community to create post under");
      }

      return await client.createPost(
        draftToCreatePostData(draft, community.community.id),
      );
    },
    onSuccess: (res) => {
      const apId = res.post_view.post.ap_id;
      const slug = createSlug(res.post_view.community)?.slug;
      if (slug) {
        router.push(`/home/c/${slug}/posts/${encodeURIComponent(apId)}`);
      }
    },
    onError: (err) => {
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error("Couldn't create post");
      }
    },
  });
}

export function useEditPost(apId: string) {
  const router = useIonRouter();
  const { client } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  return useMutation({
    mutationFn: async (draft: Draft) => {
      const { post } = await client.resolveObject({
        q: apId,
      });

      if (!post) {
        throw new Error("Could not find post to update");
      }

      return await client.editPost(draftToEditPostData(draft, post.post.id));
    },
    onSuccess: ({ post_view }) => {
      patchPost(apId, getCachePrefixer(), flattenPost({ post_view }));
      const slug = createSlug(post_view.community)?.slug;
      if (slug) {
        router.push(`/home/c/${slug}/posts/${encodeURIComponent(apId)}`);
      }
    },
    onError: (err) => {
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error("Couldn't update post");
      }
    },
  });
}

export function useCreatePostReport() {
  const { client } = useLemmyClient();
  return useMutation({
    mutationFn: (form: CreatePostReport) => client.createPostReport(form),
    onError: (err) => {
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error("Couldn't create post report");
      }
    },
  });
}

export function useCreateCommentReport() {
  const { client } = useLemmyClient();
  return useMutation({
    mutationFn: (form: CreateCommentReport) => client.createCommentReport(form),
    onError: (err) => {
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error("Couldn't create comment report");
      }
    },
  });
}

export function useBlockPerson(account?: Account) {
  const queryClient = useQueryClient();
  const { client } = useLemmyClient(account);
  const accountsQueryKey = useRefreshAuthKey();
  return useMutation({
    mutationFn: (form: BlockPerson) => client.blockPerson(form),
    onError: (err, { block }) => {
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error(`Couldn't ${block ? "block" : "unblock"} person`);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: accountsQueryKey,
      }),
  });
}

export function useBlockCommunity(account?: Account) {
  const queryClient = useQueryClient();
  const { client } = useLemmyClient(account);
  const accountsQueryKey = useRefreshAuthKey();
  return useMutation({
    mutationFn: (form: BlockCommunity) => client.blockCommunity(form),
    onError: (err, { block }) => {
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error(`Couldn't ${block ? "block" : "unblock"} community`);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: accountsQueryKey,
      }),
  });
}

export function useSavePost(apId: string) {
  const queryClient = useQueryClient();
  const { client } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  const postsQueryKey = usePostsKey({
    saved_only: true,
  });

  return useMutation({
    mutationFn: (form: SavePost) => client.savePost(form),
    onMutate: ({ save }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticSaved: save,
      });
    },
    onSuccess: ({ post_view }) => {
      patchPost(apId, getCachePrefixer(), {
        ...flattenPost({ post_view }),
        optimisticSaved: undefined,
      });
      queryClient.invalidateQueries({
        queryKey: postsQueryKey,
      });
    },
    onError: (err, { save }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticSaved: undefined,
      });
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error(`Couldn't ${save ? "save" : "unsave"} post`);
      }
    },
  });
}

export function useDeletePost(apId: string) {
  const { client } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: (form: DeletePost) => client.deletePost(form),
    onMutate: ({ deleted }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticDeleted: deleted,
      });
    },
    onSuccess: ({ post_view }) => {
      patchPost(apId, getCachePrefixer(), {
        ...flattenPost({ post_view }),
        optimisticDeleted: undefined,
      });
    },
    onError: (err, { deleted }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticDeleted: undefined,
      });
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error(`Couldn't ${deleted ? "delete" : "restore"} post`);
      }
    },
  });
}

export function useMarkPostRead(apId: string) {
  const { client } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: (form: MarkPostAsRead) => {
      return client.markPostAsRead(form);
    },
    onMutate: ({ read }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticRead: read,
      });
    },
    onSuccess: (_, { read }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticRead: undefined,
        read,
      });
    },
    onError: (err, { read }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticRead: undefined,
      });
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error(`Couldn't mark post ${read ? "read" : "unread"}`);
      }
    },
  });
}

export function useFeaturePost(apId: string) {
  const { client } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: (form: FeaturePost) => client.featurePost(form),
    onMutate: ({ featured }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticFeaturedCommunity: featured,
      });
    },
    onSuccess: (post) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticFeaturedCommunity: undefined,
        ...flattenPost(post),
      });
    },
    onError: (err, { featured }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticFeaturedCommunity: undefined,
      });
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error(`Couldn't ${featured ? "pin" : "unpin"} post`);
      }
    },
  });
}

export function useUploadImage() {
  const { client, instance } = useLemmyClient();
  return useMutation({
    mutationFn: async (form: UploadImage) => {
      const res = await client.uploadImage(form);
      const fileId = res.files?.[0]?.file;
      if (!res.url && fileId) {
        res.url = `${instance}/pictrs/image/${fileId}`;
      }
      return res;
    },
    onError: (err) => {
      // TOOD: find a way to determin if the request
      // failed because the image was too large
      if (err instanceof Error) {
        toast.error(_.capitalize(err.message.replaceAll("_", " ")));
      } else {
        toast.error("Failed to upload image");
      }
    },
  });
}

export function useCaptcha({
  instance,
  enabled,
}: {
  instance: string;
  enabled?: boolean;
}) {
  const { client } = useLemmyClient({ instance });
  return useQuery({
    queryKey: ["captcha"],
    queryFn: ({ signal }) => client.getCaptcha({ signal }),
    staleTime: 5 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3 * 1000),
    enabled,
  });
}

export function useSubscribedCommunities() {
  const subscribedCommunities = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.follows,
  );
  return useMemo(
    () => _.sortBy(subscribedCommunities ?? [], (c) => c.community.name),
    [subscribedCommunities],
  );
}

export function useModeratingCommunities() {
  const subscribedCommunities = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.moderates,
  );
  return useMemo(
    () => _.sortBy(subscribedCommunities ?? [], (c) => c.community.name),
    [subscribedCommunities],
  );
}
