import z from "zod";

const communitySlug = z.string();

const personSchema = z.object({
  createdAt: z.string(),
  apId: z.string().nullable(),
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
  optimisticRemoved: z.boolean().nullable(),
  deleted: z.boolean(),
  optimisticDeleted: z.boolean().nullable(),
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
  optimisticFeaturedCommunity: z.boolean().nullable(),
  featuredLocal: z.boolean(),
  optimisticFeaturedLocal: z.boolean().nullable(),
  read: z.boolean(),
  optimisticRead: z.boolean().nullable(),
  saved: z.boolean(),
  optimisticSaved: z.boolean().nullable(),
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
    form: {
      showRead: boolean;
      sort: string;
      pageCursor?: string;
    },
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

  //abstract getCommunity(): Promise<Schemas.Community>;
  //
  //abstract getPerson(form: { apId: string }): Promise<Schemas.Person>;
}
