import _ from "lodash";
import {
  ApiBlueprint,
  Errors,
  Forms,
  INIT_PAGE_TOKEN,
  RequestOptions,
  Schemas,
} from "./api-blueprint";
import z from "zod";
import { createSlug } from "../utils";

const DEFAULT_HEADERS = {};

const POST_SORTS = [
  "Active",
  "Hot",
  "New",
  "TopAll",
  "TopHour",
  "TopSixHour",
  "TopTwelveHour",
  "TopDay",
  "TopWeek",
  "TopMonth",
  "TopThreeMonths",
  "TopSixMonths",
  "TopNineMonths",
  "TopYear",
  "Scaled",
] as const;

const paginationSchema = z.object({
  count: z.number(),
  currentPage: z.number(),
  maxPage: z.number(),
  perPage: z.number(),
});

/** Helper: ISO datetime validator that works across Zod versions */
const isoDateTime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: "Invalid ISO datetime",
});

/** ActivityPub-ish image object (used by person.icon) */
export const apImageSchema = z
  .object({
    type: z.literal("Image").optional(),
    url: z.string().url(),
  })
  .passthrough();

/** Public key block */
export const apPublicKeySchema = z
  .object({
    owner: z.string().url(),
    id: z.string().url(),
    publicKeyPem: z.string(),
  })
  .passthrough();

/** Endpoints block */
export const apEndpointsSchema = z
  .object({
    sharedInbox: z.string().url().optional(),
  })
  .passthrough();

/** ActivityPub Person (admins/moderators entries) */
export const mbinPersonSchema = z.object({
  id: z.string().url(),
  type: z.literal("Person"),
  name: z.string(),
  preferredUsername: z.string(),
  inbox: z.string().url(),
  outbox: z.string().url(),
  url: z.string().url(),
  manuallyApprovesFollowers: z.boolean().optional(),
  published: isoDateTime,
  following: z.string().url().optional(),
  followers: z.string().url().optional(),
  publicKey: apPublicKeySchema.optional(),
  endpoints: apEndpointsSchema.optional(),
  summary: z.string().optional(),
  icon: apImageSchema.optional(),
});

/** Full mbin instance info (your sample payload) */
export const mbinInfoSchema = z.object({
  softwareName: z.string(),
  softwareVersion: z.string(),
  softwareRepository: z.string().url(),
  websiteDomain: z.string(),
  websiteContactEmail: z.string().email(),
  websiteTitle: z.string(),
  websiteOpenRegistrations: z.boolean(),
  websiteFederationEnabled: z.boolean(),
  websiteDefaultLang: z.string(),
  instanceModerators: z.array(mbinPersonSchema),
  instanceAdmins: z.array(mbinPersonSchema),
});

export const mbinInstanceDocsSchema = z.object({
  about: z.string(), // Markdown string
  contact: z.string(), // Markdown string
  faq: z.string().nullable(), // Markdown or null
  privacyPolicy: z.string().nullable(), // Markdown or null
  terms: z.string(), // Markdown string
});

export const mbinStoredImageSchema = z
  .object({
    filePath: z.string().nullable(),
    sourceUrl: z.string().url().nullable(),
    storageUrl: z.string().url(),
    altText: z.string().nullable(),
    width: z.number().int().nonnegative(),
    height: z.number().int().nonnegative(),
    blurHash: z.string().nullable(),
  })
  .passthrough();

/** Avatar images in moderators can be incomplete */
export const mbinAvatarImageSchema = mbinStoredImageSchema;

/** Single moderator entry attached to a magazine */
export const mbinMagazineModeratorSchema = z.object({
  magazineId: z.number().int().nonnegative(),
  userId: z.number().int().nonnegative(),
  username: z.string(),
  apId: z.string().nullable(),
  avatar: mbinAvatarImageSchema.nullable(),
});

/** Magazine object */
export const mbinMagazineSchema = z.object({
  magazineId: z.number().int().nonnegative(),
  owner: z.unknown().nullable().optional(), // shown as null in your sample; keep flexible
  icon: mbinStoredImageSchema.nullable(),
  name: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  rules: z.string().nullable(),
  subscriptionsCount: z.number().int(),
  entryCount: z.number().int(),
  entryCommentCount: z.number().int(),
  postCount: z.number().int(),
  postCommentCount: z.number().int(),
  isAdult: z.boolean(),
  isUserSubscribed: z.boolean().nullable(),
  isBlockedByUser: z.boolean().nullable(),
  tags: z.array(z.string()).nullable().optional(),
  badges: z.array(z.unknown()), // structure not specified in sample
  moderators: z.array(mbinMagazineModeratorSchema),
  apId: z.string(),
  apProfileId: z.string().url(),
  serverSoftware: z.string().nullable(),
  serverSoftwareVersion: z.string().nullable(),
  isPostingRestrictedToMods: z.boolean(),
  localSubscribers: z.number().int().nonnegative(),
  notificationStatus: z.unknown().nullable().optional(),
});

/** List/collection response for magazines */
// Helpful types
export type ApImage = z.infer<typeof apImageSchema>;
export type ApPublicKey = z.infer<typeof apPublicKeySchema>;
export type ApEndpoints = z.infer<typeof apEndpointsSchema>;
export type ApPerson = z.infer<typeof mbinPersonSchema>;
export type MbinInfo = z.infer<typeof mbinInfoSchema>;

// Usage:
// const parsed = mbinInfoSchema.parse(rawResponse);

function convertPost(
  postView: z.infer<typeof pieFedPostViewSchema>,
  crossPosts?: z.infer<typeof pieFedCrosspostSchema>[],
): Schemas.Post {
  const { post, counts, community, creator } = postView;
  return {
    creatorSlug: createSlug({ apId: creator.actor_id, name: creator.user_name })
      .slug,
    url: post.url ?? null,
    // TODO: see if this exists
    urlContentType: null,
    creatorId: creator.id,
    createdAt: post.published,
    id: post.id,
    apId: post.ap_id,
    title: post.title,
    body: post.body ?? null,
    thumbnailUrl: post.thumbnail_url ?? null,
    // TODO: add this
    embedVideoUrl: null,
    upvotes: counts.upvotes,
    downvotes: counts.downvotes,
    myVote: postView.my_vote,
    commentsCount: counts.comments,
    deleted: post.deleted,
    removed: post.removed,
    thumbnailAspectRatio: null,
    communitySlug: createSlug({
      apId: community.actor_id,
      name: community.name,
    }).slug,
    communityApId: community.actor_id,
    creatorApId: creator.actor_id,
    crossPosts:
      crossPosts?.map((cp) => ({
        apId: cp.community.actor_id,
        communitySlug: createSlug({
          apId: cp.community.actor_id,
          name: cp.community.name,
        }).slug,
      })) ?? null,
    // TODO: see if this exists
    featuredCommunity: false,
    // TODO: see if this exists
    featuredLocal: false,
    read: postView.read,
    saved: postView.saved,
    nsfw: post.nsfw || community.nsfw,
  };
}

function convertCommunity({
  magazine,
}: {
  magazine: z.infer<typeof mbinMagazineSchema>;
}): Schemas.Community {
  const c: Schemas.Community = {
    createdAt: "",
    id: magazine.magazineId,
    apId: magazine.apProfileId,
    slug: magazine.name,
    icon: magazine.icon?.storageUrl ?? null,
    banner: null,
    postCount: magazine.postCount ?? undefined,
    commentCount: magazine.postCommentCount ?? undefined,
    subscriberCount: magazine.subscriptionsCount ?? undefined,
    subscribersLocalCount: magazine.localSubscribers ?? undefined,
    usersActiveHalfYearCount: undefined,
    usersActiveDayCount: undefined,
    usersActiveMonthCount: undefined,
    usersActiveWeekCount: undefined,
    description: magazine.description,
  };
  return c;
}

function convertPerson({
  person,
}: {
  person: z.infer<typeof mbinPersonSchema>;
}): Schemas.Person {
  const p: Schemas.Person = {
    apId: person.id,
    id: person.id,
    avatar: person.icon?.url ?? null,
    matrixUserId: null,
    slug: createSlug({ apId: person.id, name: person.name }).slug,
    deleted: false,
    createdAt: person.published,
    isBot: false,
  };

  return p;
}

function convertComment(
  commentView: z.infer<typeof pieFedCommentViewSchema>,
): Schemas.Comment {
  const { post, counts, creator, comment, community } = commentView;
  return {
    createdAt: comment.published,
    id: comment.id,
    apId: comment.ap_id,
    body: comment.body,
    creatorId: creator.id,
    creatorApId: creator.actor_id,
    creatorSlug: createSlug({ apId: creator.actor_id, name: creator.user_name })
      .slug,
    path: comment.path,
    downvotes: counts.downvotes,
    upvotes: counts.upvotes,
    postId: post.id,
    postApId: post.ap_id,
    removed: comment.removed,
    deleted: comment.deleted,
    communitySlug: createSlug({
      apId: community.actor_id,
      name: community.name,
    }).slug,
    communityApId: community.actor_id,
    postTitle: post.title,
    myVote: commentView.my_vote ?? null,
    childCount: counts.child_count,
  };
}

function convertReply(
  replyView: z.infer<typeof pieFedReplyViewSchema>,
): Schemas.Reply {
  const { creator, community } = replyView;
  return {
    createdAt: replyView.comment_reply.published,
    id: replyView.comment_reply.id,
    commentId: replyView.comment.id,
    communityApId: community.actor_id,
    communitySlug: createSlug({
      apId: community.actor_id,
      name: community.name,
    }).slug,
    body: replyView.comment.body,
    path: replyView.comment.path,
    creatorId: replyView.creator.id,
    creatorApId: replyView.creator.actor_id,
    creatorSlug: createSlug({ apId: creator.actor_id, name: creator.user_name })
      .slug,
    read: replyView.comment_reply.read,
    postId: replyView.post.id,
    postApId: replyView.post.ap_id,
    postName: replyView.post.title,
  };
}

function convertPrivateMessage(
  pmView: z.infer<typeof pieFedPrivateMessageViewSchema>,
): Schemas.PrivateMessage {
  const { creator, recipient } = pmView;
  return {
    createdAt: pmView.private_message.published,
    id: pmView.private_message.id,
    creatorApId: creator.actor_id,
    creatorId: creator.id,
    creatorSlug: createSlug({
      apId: recipient.actor_id,
      name: recipient.user_name,
    }).slug,
    recipientApId: recipient.actor_id,
    recipientId: recipient.id,
    recipientSlug: createSlug({
      apId: recipient.actor_id,
      name: recipient.user_name,
    }).slug,
    body: pmView.private_message.content,
    read: pmView.private_message.read,
  };
}

function convertMention(
  replyView: z.infer<typeof pieFedReplyViewSchema>,
): Schemas.Reply {
  const { creator, community } = replyView;
  return {
    createdAt: replyView.comment_reply.published,
    id: replyView.comment_reply.id,
    commentId: replyView.comment.id,
    communityApId: community.actor_id,
    communitySlug: createSlug({
      apId: community.actor_id,
      name: community.name,
    }).slug,
    body: replyView.comment.body,
    path: replyView.comment.path,
    creatorId: replyView.creator.id,
    creatorApId: replyView.creator.actor_id,
    creatorSlug: createSlug({ apId: creator.actor_id, name: creator.user_name })
      .slug,
    read: replyView.comment_reply.read,
    postId: replyView.post.id,
    postApId: replyView.post.ap_id,
    postName: replyView.post.title,
  };
}

const errorResponseSchema = z.object({
  error: z.string(),
});

export function flattenCommentViews(
  comments: z.infer<typeof pieFedCommentViewSchema>[],
): z.infer<typeof pieFedCommentViewSchema>[] {
  const result: z.infer<typeof pieFedCommentViewSchema>[] = [];

  function recurse(nodes: z.infer<typeof pieFedCommentViewSchema>[]) {
    for (const node of nodes) {
      const { community, post } = node;
      result.push(node);
      if (node.replies?.length) {
        recurse(
          node.replies.map((reply) => ({
            ...reply,
            community,
            post,
          })),
        );
      }
    }
  }

  recurse(comments);
  return result;
}

export class MBinApi implements ApiBlueprint<null, "mbin"> {
  software = "mbin" as const;

  client = null;
  instance: string;
  limit = 50;

  jwt?: string;

  private async parseResponse(res: Response) {
    const json = await res.json();
    if (res.status < 200 || res.status >= 300) {
      const { data } = errorResponseSchema.safeParse(json);
      throw new Error(
        data?.error ?? `unexpected error, status code ${res.status}`,
      );
    } else {
      return json;
    }
  }

  private async get(
    endpoint: string,
    query: Record<string, any>,
    options?: RequestOptions,
  ) {
    query = { ...query };
    for (const key in query) {
      if (_.isNil(query[key])) {
        delete query[key];
      }
    }
    const params = new URLSearchParams(query);

    const res = await fetch(
      `${this.instance}/api${endpoint}?${params.toString()}`,
      {
        headers: {
          ...DEFAULT_HEADERS,
          ...(this.jwt
            ? {
                authorization: `Bearer ${this.jwt}`,
              }
            : {}),
        },
        cache: "no-store",
        ...options,
      },
    );
    return await this.parseResponse(res);
  }

  private async post(endpoint: string, body: Record<string, any>) {
    body = { ...body };
    for (const key in body) {
      if (_.isNil(body[key])) {
        delete body[key];
      }
    }

    const res = await fetch(`${this.instance}/api/alpha${endpoint}`, {
      headers: {
        ...DEFAULT_HEADERS,
        ...(this.jwt
          ? {
              authorization: `Bearer ${this.jwt}`,
            }
          : {}),
      },
      body: JSON.stringify(body),
      method: "POST",
      cache: "no-store",
    });
    return await this.parseResponse(res);
  }

  private async put(endpoint: string, body: Record<string, any>) {
    body = { ...body };
    for (const key in body) {
      if (_.isNil(body[key])) {
        delete body[key];
      }
    }

    const res = await fetch(`${this.instance}/api/alpha${endpoint}`, {
      headers: {
        ...DEFAULT_HEADERS,
        ...(this.jwt
          ? {
              authorization: `Bearer ${this.jwt}`,
            }
          : {}),
      },
      body: JSON.stringify(body),
      method: "PUT",
      cache: "no-store",
    });
    return await this.parseResponse(res);
  }

  constructor({ instance, jwt }: { instance: string; jwt?: string }) {
    this.instance = instance;
    this.jwt = jwt;
  }

  async getSite(options: RequestOptions) {
    const [json1, json2] = await Promise.all([
      this.get("/info", {}, options),
      this.get("/instance", {}, options),
    ]);

    const data1 = mbinInfoSchema.parse(json1);
    const data2 = mbinInstanceDocsSchema.parse(json2);

    return {
      privateInstance: false,
      instance: this.instance,
      description: data2.about,
      me: null,
      myEmail: null,
      admins: data1.instanceAdmins.map((person) => convertPerson({ person })),
      moderates: [],
      follows: [],
      personBlocks: [],
      communityBlocks: [],
      version: data1.softwareVersion,
      sidebar: "",
      userCount: 0,
      usersActiveDayCount: 0,
      usersActiveWeekCount: 0,
      usersActiveMonthCount: 0,
      usersActiveHalfYearCount: 0,
      postCount: 0,
      commentCount: 0,
      icon: null,
      title: data1.websiteTitle,
      applicationQuestion: null,
      registrationMode: data1.websiteOpenRegistrations ? "Open" : "Closed",
      showNsfw: false,
      blurNsfw: false,
      enablePostDownvotes: true,
      enableCommentDownvotes: true,
    } satisfies Schemas.Site;
  }

  async getPosts(form: Forms.GetPosts, options: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async getCommunities(form: Forms.GetCommunities, options: RequestOptions) {
    const json = await this.get("/magazines", {
      p: form.pageCursor === INIT_PAGE_TOKEN ? 1 : form.pageCursor,
      perPage: this.limit,
    });

    try {
      const { items, pagination } = z
        .object({
          items: z.array(mbinMagazineSchema),
          pagination: paginationSchema,
        })
        .parse(json);

      const hasMore =
        pagination.count > pagination.currentPage * pagination.perPage;

      return {
        communities: items.map((magazine) => convertCommunity({ magazine })),
        nextCursor: hasMore ? String(pagination.currentPage + 1) : null,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getCommunity(form: Forms.GetCommunity, options?: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async getPerson(form: Forms.GetPerson, options: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async getPost(form: { apId: string }, options: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async login(form: Forms.Login): Promise<{ jwt: string }> {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async likePost(form: Forms.LikePost) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async savePost(form: {
    postId: number;
    save: boolean;
  }): Promise<Schemas.Post> {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async logout(): Promise<void> {
    // TODO implement
  }

  async getComments(
    form: Forms.GetComments,
    options: RequestOptions,
  ): Promise<{
    comments: Schemas.Comment[];
    creators: Schemas.Person[];
    nextCursor: string | null;
  }> {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async likeComment(form: Forms.LikeComment) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async followCommunity(
    form: Forms.FollowCommunity,
  ): Promise<Schemas.Community> {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async search(form: Forms.Search, options: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async deletePost(form: Forms.DeletePost): Promise<Schemas.Post> {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async createComment(form: Forms.CreateComment): Promise<Schemas.Comment> {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async deleteComment(form: Forms.DeleteComment): Promise<Schemas.Comment> {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async editComment(form: Forms.EditComment): Promise<Schemas.Comment> {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async getPersonContent(
    form: Forms.GetPersonContent,
    options: RequestOptions,
  ) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async editPost(form: Forms.EditPost) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async createPost(form: Forms.CreatePost) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async markPostRead(form: Forms.MarkPostRead) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async getPrivateMessages(
    form: Forms.GetPrivateMessages,
    options: RequestOptions,
  ) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async createPrivateMessage(form: Forms.CreatePrivateMessage) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async markPrivateMessageRead(form: Forms.MarkPrivateMessageRead) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async featurePost(form: Forms.FeaturePost) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async getReplies(form: Forms.GetReplies, option: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async getMentions(form: Forms.GetMentions, options: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async markReplyRead(form: Forms.MarkReplyRead) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async markMentionRead(form: Forms.MarkMentionRead) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async createPostReport(form: Forms.CreatePostReport) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async createCommentReport(form: Forms.CreateCommentReport) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async blockPerson(form: Forms.BlockPerson) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async blockCommunity(form: Forms.BlockCommunity) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async uploadImage(form: Forms.UploadImage) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async saveUserSettings(form: Forms.SaveUserSettings) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async removeUserAvatar() {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async getCaptcha() {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async register(form: Forms.Register) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async resolveObject(form: Forms.ResolveObject, options: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  getPostSorts() {
    return POST_SORTS;
  }

  getCommentSorts() {
    return COMMENT_SORTS;
  }

  getCommunitySorts() {
    return COMMUNITY_SORTS;
  }
}
