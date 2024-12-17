import {
  CommentSortType,
  CommentView,
  Community,
  CommunityView,
  CreateCommentLike,
  CreatePostLike,
  GetCommunity,
  GetPosts,
  LemmyHttp,
  ListCommunities,
  Login,
  Person,
  Post,
  PostSortType,
  PostView,
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
import { Image as RNImage } from "react-native";
import { useSorts } from "~/src/stores/sorts";
import { useAuth } from "../stores/auth";
import { useMemo } from "react";
import FastImage from "../components/fast-image";
import _ from "lodash";
import throttledQueue from "throttled-queue";
import { usePostsStore } from "../stores/posts";

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
  }, []);
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

type CachedPost = {
  post_view?: Partial<GetPostResponse["post_view"]>;
  moderators?: GetPostResponse["moderators"];
  cross_posts?: GetPostResponse["cross_posts"];
  community_view?: GetPostResponse["community_view"];
};

export function cachedPostIsReady(
  post: CachedPost,
): post is Partial<GetPostResponse> {
  return !!post.post_view?.post;
}

export type FlattenedPost = {
  optimisticMyVote?: number;
  myVote?: number;
  score: number;
  post: Post;
  community: {
    name: string;
    title: string;
    icon?: string;
    slug: string;
  };
  creator: Pick<Person, "id" | "name" | "avatar">;
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
    score: postView.counts.score,
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
  };
}

export function usePost(
  form: { id?: string; communityName?: string },
  enabled = true,
) {
  const client = useLemmyClient();

  const postId = form.id ? +form.id : undefined;

  const queryKey = ["getPost", form.id];

  const initialData = usePostsStore((s) =>
    form.id ? s.posts[form.id]?.data : undefined,
  );

  const cachePost = usePostsStore((s) => s.cachePost);

  return useQuery<FlattenedPost>({
    queryKey,
    queryFn: async () => {
      const res = await client.getPost({
        id: postId,
      });
      const thumbnail = res.post_view.post.thumbnail_url;
      if (thumbnail) {
        measureImage(thumbnail);
        FastImage.preload([
          {
            uri: thumbnail,
          },
        ]);
      }
      const post = flattenPost(res.post_view);
      cachePost(post);
      return post;
    },
    enabled: !!form.id,
    initialData,
  });
}

export function usePostComments(form: GetComments) {
  const commentSort = useSorts((s) => s.commentSort);
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

  const queryKey = form.community_name
    ? ["getPosts", form.sort, form.community_name]
    : ["getPosts", form.sort];

  const getPosts = useMemo(() => {
    const throttle = throttledQueue(1, 1000 * 8);
    return (form: GetPosts) => throttle(() => client.getPosts(form));
  }, [client]);

  const cachePosts = usePostsStore((s) => s.cachePosts);

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await getPosts({
        ...form,
        page_cursor: pageParam === "init" ? undefined : pageParam,
      });

      const posts = res.posts.map(flattenPost);
      cachePosts(posts);

      let i = 0;
      for (const { post } of res.posts) {
        const thumbnail = post.thumbnail_url;
        if (thumbnail) {
          setTimeout(() => {
            measureImage(thumbnail);
            FastImage.preload([
              {
                uri: thumbnail,
              },
            ]);
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

  const queryKey = [
    "listCommunities",
    `useListCommunities-${form.sort}-${form.limit}`,
  ];

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
    onError: () => {
      cachePost(_.omit(post, ["optimisticMyVote"]));
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
    mutationFn: ({ post_id, ...form }: CustumCreateCommentLike) =>
      client.likeComment(form),
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
