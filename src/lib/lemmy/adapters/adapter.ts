import { SearchType, PostFeatureType, ListingType } from "lemmy-v4";
import z from "zod";

const communitySlug = z.string();

const personSchema = z.object({
  createdAt: z.string(),
  id: z.number(),
  apId: z.string(),
  avatar: z.string().nullable(),
  slug: z.string(),
  matrixUserId: z.string().nullable(),
  bio: z.string().nullable(),
  deleted: z.boolean(),
  isBot: z.boolean(),
  commentCount: z.number().nullable(),
  postCount: z.number().nullable(),
});
const siteSchema = z.object({
  instance: z.string(),
  me: personSchema.nullable(),
  admins: z.array(personSchema),
  version: z.string(),
});
const postSchema = z.object({
  createdAt: z.string(),
  id: z.number(),
  apId: z.string(),
  communitySlug,
  communityApId: z.string(),
  creatorId: z.number(),
  creatorApId: z.string(),
  creatorSlug: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  thumbnailAspectRatio: z.number().nullable(),
  downvotes: z.number(),
  upvotes: z.number(),
  commentsCount: z.number(),
  altText: z.string().optional(),
  url: z.string().nullable(),
  urlContentType: z.string().nullable(),
  removed: z.boolean(),
  optimisticRemoved: z.boolean().optional(),
  deleted: z.boolean(),
  optimisticDeleted: z.boolean().optional(),
  crossPosts: z
    .array(
      z.object({
        apId: z.string(),
        communitySlug,
      }),
    )
    .nullable(),
  myVote: z.number().optional(),
  optimisticMyVote: z.number().optional(),
  featuredCommunity: z.boolean(),
  optimisticFeaturedCommunity: z.boolean().optional(),
  featuredLocal: z.boolean(),
  optimisticFeaturedLocal: z.boolean().optional(),
  read: z.boolean(),
  optimisticRead: z.boolean().optional(),
  saved: z.boolean(),
  optimisticSaved: z.boolean().optional(),
});
const communitySchema = z.object({
  apId: z.string().nullable(),
  slug: communitySlug,
  icon: z.string().nullable(),
});

export namespace Schemas {
  export type Site = z.infer<typeof siteSchema>;
  export type Post = z.infer<typeof postSchema>;
  export type Community = z.infer<typeof communitySchema>;
  export type Person = z.infer<typeof personSchema>;
}

export namespace Forms {
  export type GetPersonContent = {
    apId: string;
    pageCursor?: string;
  };

  export type GetPosts = {
    showRead?: boolean;
    sort?: string;
    pageCursor?: string;
    type?: ListingType;
    communitySlug?: string;
    savedOnly?: boolean;
  };

  export type FeaturePost = {
    postId: number;
    featured: boolean;
    featureType: PostFeatureType;
  };

  export type SavePost = {
    postId: number;
    save: boolean;
  };

  export type DeletePost = {
    postId: number;
    deleted: boolean;
  };

  export type LikePost = {
    postId: number;
    score: 0 | 1 | -1;
  };

  export type Search = {
    q: string;
    communitySlug?: string;
    type: SearchType;
    sort?: string;
    pageCursor?: string;
  };
}

type Paginated<Data> = {
  data: Data;
  nextCursor: string | null;
};

export type RequestOptions = {
  signal?: AbortSignal;
};

export abstract class ApiAdapter<C> {
  abstract client: C;
  abstract limit: number;

  abstract setJwt(jwt: string): void;

  abstract getSite(options: RequestOptions): Promise<Schemas.Site>;

  abstract getPost(
    form: { apId: string },
    options: RequestOptions,
  ): Promise<{
    post: Schemas.Post;
    community?: Schemas.Community;
    creator?: Schemas.Person;
  }>;
  abstract getPosts(
    form: Forms.GetPosts,
    options: RequestOptions,
  ): Promise<
    Paginated<
      {
        post: Schemas.Post;
        community?: Schemas.Community;
        creator?: Schemas.Person;
      }[]
    >
  >;

  abstract savePost(form: {
    postId: number;
    save: boolean;
  }): Promise<Schemas.Post>;

  abstract likePost(form: Forms.LikePost): Promise<Schemas.Post>;

  abstract deletePost(form: Forms.DeletePost): Promise<Schemas.Post>;

  abstract featurePost(form: Forms.FeaturePost): Promise<Schemas.Post>;

  abstract getPersonContent(
    form: Forms.GetPersonContent,
    options: RequestOptions,
  ): Promise<{
    posts: Schemas.Post[];
    nextCursor: string | null;
  }>;

  abstract search(
    form: Forms.Search,
    options: RequestOptions,
  ): Promise<{
    posts: Schemas.Post[];
    nextCursor: string | null;
  }>;

  //abstract getCommunity(): Promise<Schemas.Community>;
  //
  //abstract getPerson(form: { apId: string }): Promise<Schemas.Person>;
}
