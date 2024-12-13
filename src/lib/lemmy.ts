import {
  Community,
  CreatePostLike,
  GetCommunity,
  GetPosts,
  LemmyHttp,
  ListCommunities,
  Login,
} from "lemmy-js-client";
import {
  useQuery,
  useInfiniteQuery,
  InfiniteData,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import {
  GetComments,
  GetPost,
  GetPostResponse,
  GetPostsResponse,
} from "lemmy-js-client";
import { Image as Image } from "react-native";
import { useSorts } from "~/src/stores/sorts";
import { useAuth } from "../stores/auth";
import { useMemo } from "react";

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

  p.catch(() => {
    imageAspectRatioCache.delete(src);
  });
}

// Build the client

class Lemmy {
  hosts: Map<string, LemmyHttp> = new Map();

  getClient(baseUrl = "https://lemmy.world") {
    if (!this.hosts.has(baseUrl)) {
      this.hosts.set(baseUrl, new LemmyHttp(baseUrl));
    }
    return this.hosts.get(baseUrl)!;
  }
}
const lemmy = new Lemmy();

function useLemmyClient() {
  const jwt = useAuth((s) => s.jwt);
  const instance = useAuth((s) => s.instance);

  return useMemo(() => {
    const client = new LemmyHttp(instance);

    if (jwt) {
      client.setHeaders({ Authorization: `Bearer ${jwt}` });
    }

    return client;
  }, []);
}

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

export function usePost(form: { id?: string; communityName?: string }) {
  const client = useLemmyClient();

  const postId = form.id ? +form.id : undefined;

  const queryClient = useQueryClient();

  const postSort = useSorts((s) => s.postSort);

  const cachedPosts = queryClient.getQueryData<
    InfiniteData<GetPostsResponse, unknown>
  >([`getPosts--${postSort}`]);

  const cachedPosts2 = queryClient.getQueryData<
    InfiniteData<GetPostsResponse, unknown>
  >([`getPosts-${form.communityName}-${postSort}`]);

  const queryKey = ["getPost", form.id];

  const prevData = queryClient.getQueryData<GetPostResponse>(queryKey);
  const fromCache = {
    post_view:
      getPostFromCache(cachedPosts, postId) ??
      getPostFromCache(cachedPosts2, postId),
  };

  const initialData = useMemo(
    () => ({
      ...prevData,
      post_view: prevData?.post_view ?? fromCache.post_view,
    }),
    [prevData, fromCache],
  );

  return useQuery<Partial<GetPostResponse>>({
    queryKey,
    queryFn: async () => {
      const res = await client.getPost({
        id: postId,
      });
      if (res.post_view.post.thumbnail_url) {
        measureImage(res.post_view.post.thumbnail_url);
      }
      return res;
    },
    enabled: !!form.id,
    initialData,
  });
}

export function usePostComments(form: GetComments) {
  const commentSort = useSorts((s) => s.commentSort);
  const sort = form.sort ?? commentSort;

  const queryKey = ["getComments", `getComments-${sort}-${form.post_id}`];

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const limit = form.limit ?? 50;
      const { comments } = await lemmy.getClient().getComments({
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

  const queryKey = [`getPosts-${form.community_name ?? ""}-${form.sort}`];

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await client.getPosts({
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

export function useListCommunities(form: ListCommunities) {
  const queryKey = [
    "listCommunities",
    `useListCommunities-${form.sort}-${form.limit}`,
  ];

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const limit = form.limit ?? 50;
      const { communities } = await lemmy.getClient().listCommunities({
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
  const instance = form.instance ?? useAuth().instance;

  const queryKey = ["getCommunity", `getCommunity-${instance}-${form.name}`];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await lemmy.getClient(instance).getCommunity({
        // id: +form.id!,
        name: form.name,
      });
      return res;
    },
    enabled: !!form.name,
  });
}

export function useLogin() {
  const client = useLemmyClient();

  const setJwt = useAuth((s) => s.setJwt);

  return useMutation({
    mutationFn: async (form: Login) => {
      const res = await client.login(form);
      if (res.jwt) {
        setJwt(res.jwt);
        if (res.jwt) {
          client.setHeaders({ Authorization: `Bearer ${res.jwt}` });
        }
      }
      return res;
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  const client = useLemmyClient();

  return useMutation({
    mutationFn: async (form: CreatePostLike) => {
      const res = await client.likePost(form);
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["getPost", String(data.post_view.post.id)],
      });
    },
  });
}
