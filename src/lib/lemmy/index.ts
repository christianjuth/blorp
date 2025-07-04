import { CommentSortType, LemmyHttp } from "lemmy-v3";
import {
  useQuery,
  InfiniteData,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useFiltersStore } from "@/src/stores/filters";
import {
  Account,
  getAccountSite,
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
import { lemmyTimestamp } from "./utils";
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
import {
  Errors,
  Forms,
  INIT_PAGE_TOKEN,
  Schemas,
} from "./adapters/api-blueprint";
import { apiClient } from "./adapters/client";
import pTimeout from "p-timeout";
import { SetOptional } from "type-fest";
import { INSTANCES } from "./adapters/instances-data";

enum Errors2 {
  OBJECT_NOT_FOUND = "couldnt_find_object",
}

const DEFAULT_HEADERS = {
  // lemmy.ml will reject requests if
  // User-Agent header is not present
  "User-Agent": env.REACT_APP_NAME.toLowerCase(),
};

export function useApiClients() {
  const accountIndex = useAuth((s) => s.accountIndex);
  const accounts = useAuth((s) => s.accounts);

  const apis = accounts.map((a) => {
    const site = getAccountSite(a);
    const myUserId = site?.me?.id;
    const { instance, jwt } = a;
    const api = apiClient({ instance, jwt });

    const queryKeyPrefix: unknown[] = [`instance-${instance}`];
    if (myUserId) {
      queryKeyPrefix.push(`user-${myUserId}`);
    }

    return {
      api,
      queryKeyPrefix,
    };
  });

  return {
    apis,
    ...apis[accountIndex],
  };
}

function useLemmyClient(account?: Partial<Account>) {
  let jwt = useAuth((s) => s.getSelectedAccount().jwt);
  const myUserId = useAuth(
    (s) => getAccountSite(s.getSelectedAccount())?.me?.id,
  );
  let instance =
    useAuth((s) => s.getSelectedAccount().instance) ?? "https://lemmy.ml";
  if (account?.instance) {
    instance = account.instance;
    jwt = account.jwt;
  }

  const api = useMemo(() => {
    return apiClient({ instance, jwt });
  }, [instance, jwt]);

  return useMemo(() => {
    const queryKeyPrefix: unknown[] = [`instance-${instance}`];
    if (myUserId) {
      queryKeyPrefix.push(`user-${myUserId}`);
    }

    return {
      api,
      //client: new LemmyV3Api({ instance, jwt }).client,
      queryKeyPrefix,
      instance,
    };
  }, [jwt, instance, myUserId, api]);
}

export function usePersonDetails({
  actorId,
  enabled = true,
}: {
  actorId?: string;
  enabled?: boolean;
}) {
  const { api, queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "getPersonDetails", actorId];

  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!actorId) {
        throw new Error("person_id undefined");
      }
      const person = await (
        await api
      ).getPerson(
        {
          apId: actorId,
        },
        { signal },
      );
      cacheProfiles(getCachePrefixer(), [person]);
      return {};
    },
    enabled: !!actorId && enabled,
  });
}

export function usePersonFeed({
  apId,
  type,
  sort,
}: SetOptional<Forms.GetPersonContent, "apId">) {
  const { api, queryKeyPrefix } = useLemmyClient();

  const postSort = useFiltersStore((s) => s.postSort);

  sort ??= postSort;

  const queryKey = [...queryKeyPrefix, "getPersonFeed", { apId, type, sort }];

  const cacheComments = useCommentsStore((s) => s.cacheComments);

  const cachePosts = usePostsStore((s) => s.cachePosts);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      if (!apId) {
        throw new Error("person_id undefined");
      }

      const { posts, comments, nextCursor } = await (
        await api
      ).getPersonContent(
        {
          apId,
          pageCursor: pageParam,
          type,
          sort,
        },
        { signal },
      );

      cachePosts(getCachePrefixer(), posts);
      cacheComments(getCachePrefixer(), comments);

      return {
        posts: posts.map((p) => p.apId),
        comments: comments.map((c) => c.path),
        next_page: nextCursor,
      };
    },
    enabled: !!apId,
    initialPageParam: INIT_PAGE_TOKEN,
    getNextPageParam: (data) => data.next_page,
  });
}

export function usePost({
  ap_id: apId,
  enabled,
}: {
  ap_id?: string;
  enabled?: boolean;
}) {
  const { api, queryKeyPrefix } = useLemmyClient();

  const queryKey = [...queryKeyPrefix, "getPost", apId];

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  const initialData = usePostsStore((s) =>
    apId ? s.posts[getCachePrefixer()(apId)]?.data : undefined,
  );

  const cachePosts = usePostsStore((s) => s.cachePosts);
  // const patchPost = usePostsStore((s) => s.patchPost);

  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!apId) {
        throw new Error("ap_id undefined");
      }

      const { post, creator } = await (await api).getPost({ apId }, { signal });

      cachePosts(getCachePrefixer(), [
        {
          ...post,
          // Fetching an individual post marks it
          // as read, but not until the next request
          // is made. We mark it as read here knowing
          // that on Lemmy's end it is now read.
          read: true,
        },
      ]);

      /* cacheCommunities(getCachePrefixer(), [ */
      /*   { */
      /*     communityView: { community: post.community }, */
      /*   }, */
      /* ]); */
      /**/
      /* cacheProfiles(getCachePrefixer(), [{ person: resPost.creator }]); */

      return post;
    },
    retry: (count, err) => {
      const notFound = err.message === Errors2.OBJECT_NOT_FOUND;
      if (notFound) {
        return false;
      }
      return count <= 3;
    },
    enabled: !!apId && enabled,
    initialData,
    refetchOnMount: "always",
  });
}

function useCommentsKey() {
  const { queryKeyPrefix } = useLemmyClient();

  const commentSort = useFiltersStore((s) => s.commentSort);

  return (form: Forms.GetComments) => {
    const queryKey = [...queryKeyPrefix, "getComments"];

    if (form.postApId) {
      queryKey.push(`postApId-${form.postApId}`);
    }

    if (_.isNumber(form.parentId)) {
      queryKey.push(`parent-${form.parentId}`);
    }

    const sort = form.sort ?? commentSort;
    if (sort) {
      queryKey.push(`sort-${form.sort}`);
    }

    return queryKey;
  };
}

export function useComments(form: Forms.GetComments) {
  const commentSort = useFiltersStore((s) => s.commentSort);
  const sort = form.sort ?? commentSort;
  const { api } = useLemmyClient();

  form = {
    ...form,
    sort,
  };

  const queryKey = useCommentsKey()(form);

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheComments = useCommentsStore((s) => s.cacheComments);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const cachePosts = usePostsStore((s) => s.cachePosts);

  const prevPageParam = useRef("");
  const prevPage = useRef("");

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const { comments, creators, nextCursor } = await (
        await api
      ).getComments(
        {
          ...form,
          pageCursor: pageParam ?? undefined,
          sort,
        },
        {
          signal,
        },
      );

      const page = queryKey.join() + comments.map((c) => c.apId).join();

      if (page === prevPage.current && pageParam !== prevPageParam.current) {
        return {
          comments: [],
          nextPage: null,
        };
      }

      prevPage.current = page;
      prevPageParam.current = pageParam;

      cacheComments(getCachePrefixer(), comments);
      cacheProfiles(getCachePrefixer(), creators);

      return {
        comments,
        nextCursor,
      };
    },
    enabled: !_.isNil(form.postApId),
    getNextPageParam: (data) => data.nextPage,
    initialPageParam: INIT_PAGE_TOKEN,
    refetchOnMount: "always",
  });
}

function usePostsKey(form: Forms.GetPosts) {
  const { queryKeyPrefix } = useLemmyClient();

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;
  const showNsfw = useSettingsStore((s) => s.showNsfw) || form.showNsfw;

  const queryKey = [...queryKeyPrefix, "getPosts"];

  if (form.savedOnly) {
    queryKey.push("savedOnly");
  }

  if (form.showRead) {
    queryKey.push("showRead");
  }

  if (form.communitySlug) {
    queryKey.push("community", form.communitySlug);
  }

  if (form.type) {
    queryKey.push("type", form.type);
  }

  if (sort) {
    queryKey.push(`sort-${sort}`);
  }

  if (showNsfw) {
    queryKey.push(`nsfw-${showNsfw ? "t" : "f"}`);
  }

  return queryKey;
}

export function useMostRecentPost(
  featuredContext: "local" | "community",
  form: Forms.GetPosts,
) {
  const { api } = useLemmyClient();

  const showNsfw = useSettingsStore((s) => s.showNsfw);

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const hideRead = useSettingsStore((s) => s.hideRead);

  form = {
    showRead: !hideRead,
    sort,
    ...form,
  } satisfies Forms.GetPosts;

  const query = useQuery({
    queryKey: ["mostRecentPost", form],
    queryFn: async ({ signal }) =>
      (await api).getPosts(
        {
          ...form,
          sort: form.sort as any,
          type: form.type,
        },
        { signal },
      ),
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    data: query.data?.posts?.find(({ post }) => {
      switch (featuredContext) {
        case "local":
          return !post.featuredLocal;
        case "community":
          return !post.featuredCommunity;
      }
    }),
  };
}

export function usePosts(form: Forms.GetPosts) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { api, queryKeyPrefix } = useLemmyClient();

  const showNsfw = useSettingsStore((s) => s.showNsfw);

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const hideRead = useSettingsStore((s) => s.hideRead);

  form = {
    showRead: !hideRead,
    sort,
    /* pageCursor: pageParam === "init" ? undefined : pageParam, */
    /* sort, */
    /* communitySlug: form.community_name, */
    ...form,
  };

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
    const { posts, nextCursor } = await (
      await api
    ).getPosts(
      {
        ...form,
        pageCursor: pageParam,
      },
      { signal },
    );

    cachePosts(
      getCachePrefixer(),
      posts.map((p) => p.post),
    );

    //cacheCommunities(
    //  getCachePrefixer(),
    //  res.posts.map((p) => ({ communityView: { community: p.community } })),
    //);

    /* cacheProfiles( */
    /*   getCachePrefixer(), */
    /*   res.posts.map((p) => ({ person: p.creator })), */
    /* ); */

    return {
      posts: posts.map((p) => p.post.apId),
      nextCursor,
    };
  };

  const queryKey = [...queryKeyPrefix, "getPosts", form];

  const query = useThrottledInfiniteQuery({
    queryKey,
    queryFn,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: INIT_PAGE_TOKEN,
    enabled: form.type === "Subscribed" ? isLoggedIn : true,
    reduceAutomaticRefetch: true,
  });

  const queryClient = useQueryClient();
  const prefetch = () =>
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn,
      initialPageParam: "init",
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      pages: 1,
    });

  return {
    ...query,
    prefetch,
  };
}

export function useListCommunities(form: Forms.GetCommunities) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { api, queryKeyPrefix } = useLemmyClient();

  const showNsfw = useSettingsStore((s) => s.showNsfw);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  const queryKey = [...queryKeyPrefix, "listCommunities"];

  if (form.sort) {
    queryKey.push("sort", form.sort);
  }

  if (form.type) {
    queryKey.push("type", form.type);
  }

  if (showNsfw) {
    queryKey.push(`nsfw-${showNsfw ? "t" : "f"}`);
  }

  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const { communities, nextCursor } = await (
        await api
      ).getCommunities(
        {
          ...form,
          //show_nsfw: showNsfw,
          pageCursor: pageParam,
        },
        {
          signal,
        },
      );
      cacheCommunities(
        getCachePrefixer(),
        communities.map((communityView) => ({ communityView })),
      );
      return {
        communities,
        nextPage: nextCursor,
      };
    },
    getNextPageParam: (data) => data.nextPage,
    initialPageParam: INIT_PAGE_TOKEN,
    enabled: form.type === "Subscribed" ? isLoggedIn : true,
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
  const { api, queryKeyPrefix } = useLemmyClient();

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
      const res = await (
        await api
      ).getCommunity(
        {
          slug: form.name,
        },
        {
          signal,
        },
      );
      cacheCommunities(getCachePrefixer(), [
        {
          communityView: res.community,
          mods: res.mods,
        },
      ]);
      cacheProfiles(getCachePrefixer(), res.mods);
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
    queryFn: async ({ signal }) => {
      const api = await apiClient({ instance });
      return await api.getSite({ signal });
    },
  });
}

export function useRegister(config?: {
  addAccount?: boolean;
  instance?: string;
}) {
  const { api } = useLemmyClient({ instance: config?.instance });

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const updateSelectedAccount = useAuth((s) => s.updateSelectedAccount);
  const addAccount = useAuth((s) => s.addAccount);

  const mutation = useMutation({
    mutationFn: async (form: Forms.Register) => {
      const res = await (await api).register(form);
      if (res.jwt) {
        (await api).setJwt(res.jwt);
        const site = await (await api).getSite();
        const person = site.me;
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
          cacheProfiles(getCachePrefixer(), [person]);
        }
      }
      return res;
    },
    onSuccess: ({ jwt, registrationCreated, verifyEmailSent }) => {
      if (!jwt) {
        toast.success(
          [
            verifyEmailSent && "Check your email to confirm registration.",
            registrationCreated &&
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
      if (err !== Errors.MFA_REQUIRED) {
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
  const { api } = useLemmyClient(config);

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const updateSelectedAccount = useAuth((s) => s.updateSelectedAccount);
  const addAccount = useAuth((s) => s.addAccount);

  const mutation = useMutation({
    mutationFn: async (form: Forms.Login) => {
      const res = await (await api).login(form);
      if (res.jwt) {
        const site = await (await api).getSite();
        const person = site.me;
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
          cacheProfiles(getCachePrefixer(), [person]);
        }
      }
      return res;
    },
    onMutate: () => {},
    onError: (err) => {
      if (err !== Errors.MFA_REQUIRED) {
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
    needsMfa: mutation.error === Errors.MFA_REQUIRED,
  };
}

function useRefreshAuthKey() {
  const accounts = useAuth((s) => s.accounts);
  return ["refreshAuth", ...accounts.map((a) => Boolean(a.jwt))];
}

export function useRefreshAuth() {
  const { apis } = useApiClients();

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

      const sites = await Promise.allSettled(
        apis
          .map(async ({ api }) => (await api).getSite({ signal }))
          .map((p) => pTimeout(p, { milliseconds: 10 * 1000 })),
      );

      for (let i = 0; i < sites.length; i++) {
        const account = accounts[i];
        const p = sites[i];

        if (p?.status === "fulfilled") {
          const site = p.value;
          if (account?.jwt && site && !site.me) {
            logoutIndicies.push(i);
            continue;
          }

          const me = account ? getAccountSite(account)?.me : null;

          if (me) {
            cacheProfiles(getCachePrefixer(account), [me]);
            cacheCommunities(
              getCachePrefixer(account),
              [...(site?.follows ?? []), ...(site?.moderates ?? [])].map(
                (community) => ({
                  communityView: community,
                }),
              ),
            );
          }

          if (site) {
            cacheProfiles(getCachePrefixer(account), site.admins);
            updateAccount(i, {
              site,
            });
          }
        } else if (
          _.isString(p?.reason) &&
          p.reason.toLowerCase().indexOf("aborterror") === -1
        ) {
          logoutIndicies.push(i);
        }
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
      const api = await apiClient(account);
      await api.logout();
    },
    onSuccess: (_res, account) => {
      logout(account);
      resetFilters();
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
  const { api } = useLemmyClient();

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = usePostsStore((s) => s.posts[getCachePrefixer()(apId)]?.data);
  const patchPost = usePostsStore((s) => s.patchPost);

  return useMutation({
    mutationKey: ["likePost", apId],
    mutationFn: async (score: -1 | 0 | 1) => {
      if (!post) {
        throw new Error("post not found");
      }
      return (await api).likePost({
        postId: post.id,
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
        ...data,
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

interface CustumCreateCommentLike extends Forms.LikeComment {
  path: string;
}

export function useLikeComment() {
  const { api } = useLemmyClient();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const patchComment = useCommentsStore((s) => s.patchComment);
  const cacheComments = useCommentsStore((s) => s.cacheComments);

  return useMutation({
    mutationFn: async (form: CustumCreateCommentLike) =>
      await (await api).likeComment(_.omit(form, ["path"])),
    onMutate: ({ score, path }) => {
      patchComment(path, getCachePrefixer(), () => ({
        optimisticMyVote: score,
      }));
    },
    onSuccess: (data) => {
      cacheComments(getCachePrefixer(), [
        {
          ...data,
          optimisticMyVote: undefined,
        },
      ]);
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

interface CreateComment extends Forms.CreateComment {
  parentPath?: string;
  queryKeyParentId?: number;
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { api } = useLemmyClient();
  const myProfile = useAuth((s) => getAccountSite(s.getSelectedAccount())?.me);
  const commentSort = useFiltersStore((s) => s.commentSort);
  const cacheComments = useCommentsStore((s) => s.cacheComments);
  const markCommentForRemoval = useCommentsStore(
    (s) => s.markCommentForRemoval,
  );

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  const getCommentsKey = useCommentsKey();

  return useMutation({
    mutationFn: async ({
      parentPath,
      queryKeyParentId,
      ...form
    }: CreateComment) => {
      const newComment = await (await api).createComment(form);
      return {
        newComment,
        sorts: (await api).getCommentSorts(),
      };
    },
    onMutate: ({ postApId, parentPath, body, queryKeyParentId }) => {
      const date = new Date();
      const isoDate = date.toISOString();
      const commentId = _.random(1, 1000000) * -1;
      const newComment: Schemas.Comment = {
        apId: "",
        id: commentId,
        createdAt: isoDate,
        path: `${parentPath ?? 0}.${commentId}`,
        upvotes: 1,
        downvotes: 0,
        deleted: false,
        removed: false,
        body,
        creatorId: myProfile?.id ?? -1,
        creatorApId: myProfile?.apId ?? "",
        creatorSlug: myProfile ? (myProfile.slug ?? "") : "",
        postId: -1,
        postApId,
        communitySlug: "",
        communityApId: "",
        postTitle: "",
        myVote: 1,
      };

      cacheComments(getCachePrefixer(), [newComment]);

      const form: Forms.GetComments = {
        postApId,
        parentId: queryKeyParentId,
        sort: commentSort,
      };

      let comments = queryClient.getQueryData<
        InfiniteData<
          {
            comments: {
              path: string;
              postId: number;
              creatorId: number;
              createdAt: string;
            }[];
            nextPage: number | null;
          },
          unknown
        >
      >(getCommentsKey(form));

      if (!comments) {
        return;
      }

      comments = _.cloneDeep(comments);

      const firstPage = comments.pages[0];
      if (firstPage) {
        firstPage.comments.unshift({
          path: newComment.path,
          creatorId: newComment.creatorId,
          postId: newComment.postId,
          createdAt: newComment.createdAt,
        });
      }

      queryClient.setQueryData(getCommentsKey(form), comments);

      return newComment;
    },
    onSuccess: ({ newComment, sorts }, { postApId, queryKeyParentId }, ctx) => {
      const settledComment = {
        path: newComment.path,
        creatorId: newComment.creatorId,
        postId: newComment.postId,
        createdAt: newComment.createdAt,
      };

      markCommentForRemoval(ctx.path, getCachePrefixer());
      cacheComments(getCachePrefixer(), [newComment]);

      sort: for (const sort of sorts) {
        const form: Forms.GetComments = {
          postApId,
          parentId: queryKeyParentId,
          sort,
        };

        let comments = queryClient.getQueryData<
          InfiniteData<
            {
              comments: {
                path: string;
                postId: number;
                creatorId: number;
                createdAt: string;
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
          const index = p.comments.findIndex((c) => c.path === ctx.path);
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
  const { api } = useLemmyClient();
  const cacheComments = useCommentsStore((s) => s.cacheComments);
  const patchComment = useCommentsStore((s) => s.patchComment);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: async (form: { id: number; body: string; path: string }) =>
      await (await api).editComment(_.omit(form, "path")),
    onMutate: ({ path, body }) => {
      patchComment(path, getCachePrefixer(), (prev) => ({
        ...prev,
        body,
      }));
    },
    onSuccess: (commentView) => {
      cacheComments(getCachePrefixer(), [commentView]);
    },
  });
}

export function useDeleteComment() {
  const { api } = useLemmyClient();
  const patchComment = useCommentsStore((s) => s.patchComment);
  const cacheComments = useCommentsStore((s) => s.cacheComments);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: async (form: { id: number; path: string; deleted: boolean }) =>
      await (await api).deleteComment(_.omit(form, "path")),
    onMutate: ({ path, deleted }) => {
      patchComment(path, getCachePrefixer(), (prev) => ({
        ...prev,
        comment: {
          ...prev,
          deleted,
        },
      }));
    },
    onSuccess: (commentView) => {
      cacheComments(getCachePrefixer(), [commentView]);
    },
  });
}

function usePrivateMessagesKey() {
  const { queryKeyPrefix } = useLemmyClient();
  return [...queryKeyPrefix, "getPrivateMessages"];
}

export function usePrivateMessages(form: {}) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { api } = useLemmyClient();
  const queryKey = usePrivateMessagesKey();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const { privateMessages, profiles, nextCursor } = await (
        await api
      ).getPrivateMessages(
        {
          ...form,
          pageCursor: pageParam,
        },
        {
          signal,
        },
      );
      cacheProfiles(getCachePrefixer(), profiles);
      return {
        privateMessages,
        nextCursor,
      };
    },
    initialPageParam: INIT_PAGE_TOKEN,
    getNextPageParam: (prev) => prev.nextCursor,
    enabled: isLoggedIn,
    refetchOnWindowFocus: "always",
    refetchIntervalInBackground: true,
    refetchInterval: 1000 * 60,
    refetchOnMount: "always",
  });
}

export function useCreatePrivateMessage(
  recipient: Pick<Schemas.Person, "apId" | "id" | "slug">,
) {
  const account = useAuth((s) => s.getSelectedAccount());
  const { person: me } = parseAccountInfo(account);
  const { api } = useLemmyClient();
  const privateMessagesKey = usePrivateMessagesKey();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: Forms.CreatePrivateMessage) =>
      await (await api).createPrivateMessage(form),
    onMutate: (ctx) => {
      if (me && recipient.id === ctx.recipientId) {
        const pm: Schemas.PrivateMessage = {
          creatorId: me.id,
          creatorSlug: me.slug,
          creatorApId: me.apId,
          recipientSlug: recipient.slug,
          recipientApId: recipient.apId,
          recipientId: recipient.id,
          id: -1 * _.random(),
          read: false,
          createdAt: lemmyTimestamp(),
          body: ctx.body,
        };
        queryClient.setQueryData<
          InfiniteData<
            { privateMessages: Schemas.PrivateMessage[]; nextCursor: string },
            number
          >
        >(privateMessagesKey, (data) => {
          if (isInfiniteQueryData(data)) {
            const pages = [...data.pages];
            if (_.isArray(pages[0]?.privateMessages)) {
              pages[0] = _.cloneDeep(pages[0]);
              pages[0].privateMessages.unshift(pm);
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
  const { api } = useLemmyClient();
  const queryClient = useQueryClient();
  const accountIndex = useAuth((s) => s.accountIndex);

  const privateMessagesKey = usePrivateMessagesKey();
  const privateMessageCountQueryKey = usePrivateMessageCountQueryKey();

  return useMutation({
    mutationFn: async (form: Forms.MarkPrivateMessageRead) =>
      await (await api).markPrivateMessageRead(form),
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
          { privateMessages: Schemas.PrivateMessage[]; nextCursor: string },
          number
        >
      >(privateMessagesKey, (data) => {
        if (isInfiniteQueryData(data)) {
          return produce(data, (draftState) => {
            for (const page of draftState.pages) {
              const messageIndex = page.privateMessages.findIndex(
                (pm) => pm.id === form.id,
              );
              if (messageIndex >= 0 && page.privateMessages[messageIndex]) {
                page.privateMessages[messageIndex].read = form.read;
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

export function useReplies(form: Forms.GetReplies) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { api, queryKeyPrefix } = useLemmyClient();
  const queryKey = [...queryKeyPrefix, "getReplies", form];
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const { replies, profiles, nextCursor } = await (
        await api
      ).getReplies(
        {
          ...form,
          pageCursor: pageParam,
        },
        {
          signal,
        },
      );
      cacheProfiles(getCachePrefixer(), profiles);
      return {
        replies,
        nextCursor,
      };
    },
    initialPageParam: INIT_PAGE_TOKEN,
    getNextPageParam: (prev) => prev.nextCursor,
    enabled: isLoggedIn,
    refetchOnWindowFocus: "always",
  });
}

export function usePersonMentions(form: Forms.GetMentions) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const { api, queryKeyPrefix } = useLemmyClient();
  const queryKey = [...queryKeyPrefix, "getPersonMentions", form];
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const { mentions, profiles, nextCursor } = await (
        await api
      ).getMentions(
        {
          ...form,
          pageCursor: pageParam,
        },
        {
          signal,
        },
      );
      cacheProfiles(getCachePrefixer(), profiles);
      return {
        mentions,
        nextCursor,
      };
    },
    initialPageParam: INIT_PAGE_TOKEN,
    getNextPageParam: (prev) => prev.nextCursor,
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

export function useSearch(form: Forms.Search) {
  const { api, queryKeyPrefix } = useLemmyClient();

  const postSort = useFiltersStore((s) => s.postSort);
  const sort = form.sort ?? postSort;

  const queryKey = [...queryKeyPrefix, "search", form];

  const cacheProfiles = useProfilesStore((s) => s.cacheProfiles);
  const cacheCommunities = useCommunitiesStore((s) => s.cacheCommunities);
  const cachePosts = usePostsStore((s) => s.cachePosts);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useThrottledInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const { posts, communities, users, nextCursor } = await (
        await api
      ).search(
        {
          sort,
          ...form,
          pageCursor: pageParam,
        },
        { signal },
      );

      cacheCommunities(
        getCachePrefixer(),
        communities.map((communityView) => ({ communityView })),
      );
      cacheProfiles(getCachePrefixer(), users);
      cachePosts(getCachePrefixer(), posts);

      return {
        communities: communities.map((c) => c.slug),
        posts: posts.map((p) => p.apId),
        users: users.map((u) => u.apId),
        next_page: nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.next_page,
    initialPageParam: INIT_PAGE_TOKEN,
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
      const json = await res.json();

      try {
        const lemmy = z
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
          .parse(json);

        return _.uniqBy(
          [
            ...lemmy.map((item) => ({
              baseUrl: item.baseurl,
              url: item.url,
              score: item.score,
              software: "lemmy",
            })),
            ...INSTANCES,
          ],
          ({ url }) => url,
        );
      } catch {
        return undefined;
      }
    },
  });
}

export function useFollowCommunity() {
  const { api, queryKeyPrefix } = useLemmyClient();

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const patchCommunity = useCommunitiesStore((s) => s.patchCommunity);
  const cacheCommunity = useCommunitiesStore((s) => s.cacheCommunity);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: {
      community: Schemas.Community;
      follow: boolean;
    }) => {
      return (await api).followCommunity({
        communityId: form.community.id,
        follow: form.follow,
      });
    },
    onMutate: (form) => {
      const slug = form.community.slug;
      if (slug) {
        patchCommunity(slug, getCachePrefixer(), {
          communityView: {
            optimisticSubscribed: "Pending",
          },
        });
      }
    },
    onSuccess: (data) => {
      cacheCommunity(getCachePrefixer(), {
        communityView: {
          ...data,
          optimisticSubscribed: undefined,
        },
      });
    },
    onError: (err, form) => {
      const slug = form.community.slug;
      if (slug) {
        patchCommunity(slug, getCachePrefixer(), {
          communityView: {
            optimisticSubscribed: undefined,
          },
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
  const { api, queryKeyPrefix } = useLemmyClient();
  const queryClient = useQueryClient();

  const notificationCountQueryKey = useNotificationCountQueryKey();

  return useMutation({
    mutationFn: async (form: Forms.MarkReplyRead) =>
      (await api).markReplyRead(form),
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
  const { api, queryKeyPrefix } = useLemmyClient();
  const queryClient = useQueryClient();

  const notificationCountQueryKey = useNotificationCountQueryKey();

  return useMutation({
    mutationFn: async (form: Forms.MarkMentionRead) =>
      await (await api).markMentionRead(form),
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
  const { api } = useLemmyClient();
  return useMutation({
    mutationFn: async (draft: Draft) => {
      if (!draft.communitySlug) {
        throw new Error("could not find community to create post under");
      }

      const { community } = await (
        await api
      ).getCommunity(
        {
          slug: draft.communitySlug,
        },
        {},
      );

      if (!community) {
        throw new Error("could not find community to create post under");
      }

      return await (await api).createPost(draftToCreatePostData(draft));
    },
    onSuccess: ({ apId, communitySlug }) => {
      if (communitySlug) {
        router.push(
          `/home/c/${communitySlug}/posts/${encodeURIComponent(apId)}`,
        );
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
  const { api } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  return useMutation({
    mutationFn: async (draft: Draft) => {
      return await (await api).editPost(draftToEditPostData(draft));
    },
    onSuccess: (postView) => {
      patchPost(apId, getCachePrefixer(), postView);
      const slug = postView.communitySlug;
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
  const { api } = useLemmyClient();
  return useMutation({
    mutationFn: async (form: Forms.CreatePostReport) =>
      (await api).createPostReport(form),
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
  const { api } = useLemmyClient();
  return useMutation({
    mutationFn: async (form: Forms.CreateCommentReport) =>
      (await api).createCommentReport(form),
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
  const { api } = useLemmyClient(account);
  const accountsQueryKey = useRefreshAuthKey();
  return useMutation({
    mutationFn: async (form: Forms.BlockPerson) =>
      (await api).blockPerson(form),
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
  const { api } = useLemmyClient(account);
  const accountsQueryKey = useRefreshAuthKey();
  return useMutation({
    mutationFn: async (form: Forms.BlockCommunity) =>
      (await api).blockCommunity(form),
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
  const { api } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  const postsQueryKey = usePostsKey({
    savedOnly: true,
  });

  return useMutation({
    mutationFn: async (form: { postId: number; save: boolean }) =>
      (await api).savePost(form),
    onMutate: ({ save }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticSaved: save,
      });
    },
    onSuccess: (post) => {
      patchPost(apId, getCachePrefixer(), {
        ...post,
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
  const { api } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: async (form: Forms.DeletePost) => (await api).deletePost(form),
    onMutate: ({ deleted }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticDeleted: deleted,
      });
    },
    onSuccess: (data) => {
      patchPost(apId, getCachePrefixer(), {
        ...data,
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
  const { api } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: async (form: Forms.MarkPostRead) => {
      return (await api).markPostRead(form);
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
  const { api } = useLemmyClient();
  const patchPost = usePostsStore((s) => s.patchPost);
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);

  return useMutation({
    mutationFn: async (form: Forms.FeaturePost) =>
      (await api).featurePost(form),
    onMutate: ({ featured }) => {
      patchPost(apId, getCachePrefixer(), {
        optimisticFeaturedCommunity: featured,
      });
    },
    onSuccess: (post) => {
      patchPost(apId, getCachePrefixer(), {
        ...post,
        optimisticFeaturedCommunity: undefined,
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
  const { api, instance } = useLemmyClient();
  return useMutation({
    mutationFn: async (form: Forms.UploadImage) => {
      const res = await (await api).uploadImage(form);
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
  const { api } = useLemmyClient({ instance });
  return useQuery({
    queryKey: ["captcha"],
    queryFn: async ({ signal }) => (await api).getCaptcha({ signal }),
    staleTime: 5 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3 * 1000),
    enabled,
  });
}

export function useSubscribedCommunities() {
  const subscribedCommunities = useAuth(
    (s) => getAccountSite(s.getSelectedAccount())?.follows,
  );
  return useMemo(
    () => _.sortBy(subscribedCommunities ?? [], (c) => c.slug),
    [subscribedCommunities],
  );
}

export function useModeratingCommunities() {
  const subscribedCommunities = useAuth(
    (s) => getAccountSite(s.getSelectedAccount())?.moderates,
  );
  return useMemo(
    () => _.sortBy(subscribedCommunities ?? [], (c) => c.slug),
    [subscribedCommunities],
  );
}

export function useAvailableSorts() {
  const { api, queryKeyPrefix } = useLemmyClient();
  return useQuery({
    queryKey: [queryKeyPrefix, "availableSorts"],
    queryFn: async () => {
      return {
        commentSorts: (await api).getCommentSorts(),
        postSorts: (await api).getPostSorts(),
        communitySorts: (await api).getCommentSorts(),
      };
    },
  });
}
