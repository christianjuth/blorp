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
const postSortSchema = z.custom<(typeof POST_SORTS)[number]>((sort) => {
  return _.isString(sort) && POST_SORTS.includes(sort as any);
});

const COMMENT_SORTS = ["Hot", "Top", "New", "Old"] as const;

const commentSortSchema = z.custom<(typeof COMMENT_SORTS)[number]>((sort) => {
  return _.isString(sort) && COMMENT_SORTS.includes(sort as any);
});

const COMMUNITY_SORTS = ["Hot", "TopAll", "New"] as const;
const communitySortSchema = z.custom<(typeof COMMUNITY_SORTS)[number]>(
  (sort) => {
    return _.isString(sort) && COMMUNITY_SORTS.includes(sort as any);
  },
);

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const pieFedCommunitySchema = z.object({
  actor_id: z.string(),
  //ap_domain: z.string(),
  //banned: z.boolean(),
  //deleted: z.boolean(),
  //hidden: z.boolean(),
  icon: z.string().optional(),
  banner: z.string().optional(),
  id: z.number(),
  //instance_id: z.number(),
  //local: z.boolean(),
  name: z.string(),
  nsfw: z.boolean(),
  published: z.string(),
  //removed: z.boolean(),
  //restricted_to_mods: z.boolean(),
  //title: z.string(),
  description: z.string().optional(),
  //updated: z.string().optional(),
});

export const pieFedPostCountsSchema = z.object({
  comments: z.number(),
  downvotes: z.number(),
  //newest_comment_time: z.string(),
  //post_id: z.number(),
  //published: z.string(),
  //score: z.number(),
  upvotes: z.number(),
});

export const pieFedPersonSchema = z.object({
  about: z.string().optional().nullable(),
  actor_id: z.string(),
  avatar: z.string().nullable().optional(),
  //banner: z.string().nullable().optional(),
  //banned: z.boolean(),
  bot: z.boolean(),
  deleted: z.boolean(),
  id: z.number(),
  //instance_id: z.number(),
  //local: z.boolean(),
  published: z.string(),
  //title: z.string().nullable(),
  user_name: z.string(),
});

const pieFedPersonViewSchema = z.object({
  person: pieFedPersonSchema,
  counts: z.object({
    //person_id: z.number(),
    comment_count: z.number(),
    post_count: z.number(),
  }),
});

export const pieFedPostSchema = z.object({
  ap_id: z.string(),
  body: z.string().optional(),
  //community_id: z.number(),
  deleted: z.boolean(),
  //edited_at: z.string().optional(),
  id: z.number(),
  //language_id: z.number(),
  //local: z.boolean(),
  //locked: z.boolean(),
  nsfw: z.boolean(),
  published: z.string(),
  removed: z.boolean(),
  //small_thumbnail_url: z.string().optional(),
  //sticky: z.boolean(),
  thumbnail_url: z.string().optional(),
  title: z.string(),
  url: z.string().optional(),
  //user_id: z.number(),
});

export const pieFedPostViewSchema = z.object({
  //activity_alert: z.boolean(),
  //banned_from_community: z.boolean(),
  community: pieFedCommunitySchema,
  counts: pieFedPostCountsSchema,
  creator: pieFedPersonSchema,
  //creator_banned_from_community: z.boolean(),
  //creator_is_admin: z.boolean(),
  //creator_is_moderator: z.boolean(),
  //hidden: z.boolean(),
  my_vote: z.number(),
  post: pieFedPostSchema,
  read: z.boolean(),
  saved: z.boolean(),
  //subscribed: z.string(),
  //unread_comments: z.number(),
});

export const pieFedCommunityCountsSchema = z.object({
  //id: z.number(),
  //published: z.string(),
  post_count: z.number().nullable().optional(),
  post_reply_count: z.number().nullable().optional(),
  subscriptions_count: z.number().nullable().optional(),
  total_subscriptions_count: z.number().nullable().optional(),
  active_6monthly: z.number().nullable().optional(),
  active_daily: z.number().nullable().optional(),
  active_monthly: z.number().nullable().optional(),
  active_weekly: z.number().nullable().optional(),
});

export const pieFedCommunityViewSchema = z.object({
  //activity_alert: z.boolean(),
  //blocked: z.boolean(),
  community: pieFedCommunitySchema,
  counts: pieFedCommunityCountsSchema,
  subscribed: z.enum(["Subscribed", "NotSubscribed", "Pending"]),
});

//export const pieFedAdminCountsSchema = z.object({
//  comment_count: z.number(),
//  person_id: z.number(),
//  post_count: z.number(),
//});

export const pieFedAdminSchema = z.object({
  //activity_alert: z.boolean(),
  //counts: pieFedAdminCountsSchema,
  //is_admin: z.boolean(),
  person: pieFedPersonSchema,
});

//export const pieFedLanguageSchema = z.object({
//  code: z.string(),
//  id: z.number(),
//  name: z.string(),
//});

export const pieFedSiteDetailsSchema = z.object({
  //actor_id: z.string(),
  //all_languages: z.array(pieFedLanguageSchema),
  description: z.string().nullable().optional(),
  enable_downvotes: z.boolean(),
  icon: z.string().optional(),
  name: z.string(),
  registration_mode: z.enum(["Closed", "RequireApplication", "Open"]),
  sidebar: z.string().optional(),
  user_count: z.number(),
});

export const pieFedLocalUserSchema = z.object({
  //default_listing_type: z.string(),
  //default_sort_type: z.string(),
  //show_bot_accounts: z.boolean(),
  show_nsfw: z.boolean(),
  //show_read_posts: z.boolean(),
  //show_scores: z.boolean(),
});

export const pieFedLocalUserViewSchema = z.object({
  //counts: z.object({
  //  comment_count: z.number(),
  //  person_id: z.number(),
  //  post_count: z.number(),
  //}),
  local_user: pieFedLocalUserSchema,
  person: pieFedPersonSchema,
});

export const pieFedMyUserSchema = z.object({
  community_blocks: z
    .array(z.object({ community: pieFedCommunitySchema }))
    .optional()
    .nullable(),
  //discussion_languages: z.array(pieFedLanguageSchema).optional(),
  follows: z
    .array(z.object({ community: pieFedCommunitySchema }))
    .optional()
    .nullable(),
  //instance_blocks: z.array(z.any()).optional(),
  local_user_view: pieFedLocalUserViewSchema.optional().nullable(),
  moderates: z
    .array(z.object({ community: pieFedCommunitySchema }))
    .optional()
    .nullable(),
  person_blocks: z
    .array(z.object({ target: pieFedPersonSchema }))
    .optional()
    .nullable(),
});

export const pieFedSiteSchema = z.object({
  admins: z.array(pieFedAdminSchema),
  my_user: pieFedMyUserSchema.optional().nullable(),
  site: pieFedSiteDetailsSchema,
  version: z.string(),
});

export const pieFedCommentSchema = z.object({
  ap_id: z.string(),
  body: z.string(),
  deleted: z.boolean(),
  //distinguished: z.boolean(),
  //edited_at: z.string().optional(),
  id: z.number(),
  //language_id: z.number(),
  //local: z.boolean(),
  path: z.string(),
  //post_id: z.number(),
  published: z.string(),
  removed: z.boolean(),
  //user_id: z.number(),
});

export const pieFedCommentCountsSchema = z.object({
  child_count: z.number(),
  //comment_id: z.number(),
  downvotes: z.number(),
  //published: z.string(),
  //score: z.number(),
  upvotes: z.number(),
});

type PieFedCommentChildView = {
  comment: z.infer<typeof pieFedCommentSchema>;
  counts: z.infer<typeof pieFedCommentCountsSchema>;
  creator: z.infer<typeof pieFedPersonSchema>;
  my_vote: number;
  replies: PieFedCommentChildView[];
};

const pieFedCommentChildSchema: z.ZodType<PieFedCommentChildView> = z.lazy(() =>
  z.object({
    comment: pieFedCommentSchema,
    counts: pieFedCommentCountsSchema,
    creator: pieFedPersonSchema,
    my_vote: z.number(),
    replies: z.array(pieFedCommentChildSchema),
  }),
);

const pieFedCommentViewSchema = z.object({
  //activity_alert: z.boolean(),
  //banned_from_community: z.boolean(),
  //can_auth_user_moderate: z.boolean().optional(),
  comment: pieFedCommentSchema,
  community: pieFedCommunitySchema,
  counts: pieFedCommentCountsSchema,
  creator: pieFedPersonSchema,
  //creator_banned_from_community: z.boolean(),
  //creator_blocked: z.boolean(),
  //creator_is_admin: z.boolean(),
  //creator_is_moderator: z.boolean(),
  my_vote: z.number(),
  post: pieFedPostSchema,
  //saved: z.boolean(),
  //subscribed: z.enum(["Subscribed", "NotSubscribed", "Pending"]),
  replies: z.array(pieFedCommentChildSchema).optional(),
});

export const pieFedCommentReplySchema = z.object({
  id: z.number(),
  //recipient_id: z.number(),
  //comment_id: z.number(),
  read: z.boolean(),
  published: z.string(),
});

export const pieFedReplyViewSchema = z.object({
  comment_reply: pieFedCommentReplySchema,
  comment: pieFedCommentSchema,
  creator: pieFedPersonSchema,
  post: pieFedPostSchema,
  community: pieFedCommunitySchema,
  //recipient: pieFedPersonSchema,
  //counts: pieFedCommentCountsSchema,
  //creator_banned_from_community: z.boolean(),
  //creator_is_moderator: z.boolean(),
  //creator_is_admin: z.boolean(),
  //subscribed: z.enum(["Subscribed", "NotSubscribed", "Pending"]),
  //saved: z.boolean(),
  //creator_blocked: z.boolean(),
  //my_vote: z.number(),
});

export const pieFedPrivateMessageSchema = z.object({
  id: z.number(),
  //creator_id: z.number(),
  //recipient_id: z.number(),
  content: z.string(),
  //deleted: z.boolean(),
  read: z.boolean(),
  published: z.string(),
  //updated: z.string().optional(),
  //ap_id: z.string(),
  //local: z.boolean(),
});

export const pieFedPrivateMessageViewSchema = z.object({
  private_message: pieFedPrivateMessageSchema,
  creator: pieFedPersonSchema,
  recipient: pieFedPersonSchema,
});

export const pieFedCrosspostSchema = z.object({
  //activity_alert: z.boolean(),
  //banned_from_community: z.boolean(),
  community: pieFedCommunitySchema,
  //counts: pieFedPostCountsSchema,
  //creator: pieFedPersonSchema,
  //creator_banned_from_community: z.boolean(),
  //creator_is_admin: z.boolean(),
  //creator_is_moderator: z.boolean(),
  //hidden: z.boolean(),
  //my_vote: z.number(),
  //post: pieFedPostSchema,
  //read: z.boolean(),
  //saved: z.boolean(),
  //subscribed: z.enum(["Subscribed", "NotSubscribed", "Pending"]),
  //unread_comments: z.number(),
});

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

function convertCommunity(
  communityView:
    | z.infer<typeof pieFedCommunityViewSchema>
    | { community: z.infer<typeof pieFedCommunitySchema> },
  mode: "full" | "partial",
): Schemas.Community {
  const counts = "counts" in communityView ? communityView.counts : null;
  const subscribed =
    "subscribed" in communityView ? communityView.subscribed : null;
  const c: Schemas.Community = {
    createdAt: communityView.community.published,
    id: communityView.community.id,
    apId: communityView.community.actor_id,
    slug: createSlug({
      apId: communityView.community.actor_id,
      name: communityView.community.name,
    }).slug,
    icon: communityView.community.icon ?? null,
    ...(counts
      ? {
          postCount: counts.post_count ?? undefined,
          commentCount: counts.post_reply_count ?? undefined,
          subscriberCount: counts.total_subscriptions_count ?? undefined,
          subscribersLocalCount: counts.subscriptions_count ?? undefined,
          usersActiveHalfYearCount: counts.active_6monthly ?? undefined,
          usersActiveDayCount: counts.active_daily ?? undefined,
          usersActiveMonthCount: counts.active_monthly ?? undefined,
          usersActiveWeekCount: counts.active_weekly ?? undefined,
        }
      : {}),
    ...(subscribed
      ? {
          subscribed,
        }
      : {}),
  };

  if (mode === "full" || communityView.community.description) {
    c.description = communityView.community.description ?? null;
    c.banner = communityView.community.banner ?? null;
  }

  return c;
}

function convertPerson(
  {
    person,
    counts,
  }:
    | z.infer<typeof pieFedPersonViewSchema>
    | {
        person: z.infer<typeof pieFedPersonSchema>;
        counts?: undefined;
      },
  mode: "full" | "partial",
): Schemas.Person {
  const p: Schemas.Person = {
    apId: person.actor_id,
    id: person.id,
    avatar: person.avatar ?? null,
    matrixUserId: null,
    slug: createSlug({ apId: person.actor_id, name: person.user_name }).slug,
    deleted: person.deleted,
    createdAt: person.published,
    isBot: person.bot,
  };

  // PieFed excludes about from some endpoints.
  // Full means it's giving us the full person object
  // which includes about.
  if (mode === "full" || person.about) {
    p.bio = person.about ?? null;
  }
  if (mode === "full" || counts) {
    p.postCount = counts?.post_count ?? null;
    p.commentCount = counts?.comment_count ?? null;
  }

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

export class PieFedApi implements ApiBlueprint<null, "piefed"> {
  software = "piefed" as const;

  client = null;
  instance: string;
  limit = 25;

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
      `${this.instance}/api/alpha${endpoint}?${params.toString()}`,
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

  private resolveObjectId = _.memoize(
    async (apId: string) => {
      const json = await this.get("/resolve_object", {
        q: apId,
      });

      try {
        const { post, comment, community, person } = z
          .object({
            comment: z
              .object({
                comment: z.object({ id: z.number() }),
              })
              .optional(),
            post: z.object({ post: z.object({ id: z.number() }) }).optional(),
            community: z
              .object({
                community: z.object({ id: z.number() }),
              })
              .optional(),
            person: z
              .object({ person: z.object({ id: z.number() }) })
              .optional(),
          })
          .parse(json);

        return {
          post_id: post?.post.id,
          comment_id: comment?.comment.id,
          community_id: community?.community.id,
          person_id: person?.person.id,
        };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    (apId) => apId,
  );

  constructor({ instance, jwt }: { instance: string; jwt?: string }) {
    this.instance = instance;
    this.jwt = jwt;
  }

  async getSite(options: RequestOptions) {
    const json = await this.get("/site", {}, options);
    try {
      const site = pieFedSiteSchema.parse(json);
      const me = site.my_user?.local_user_view?.person;
      return {
        privateInstance: false,
        description: site.site.description ?? null,
        instance: this.instance,
        admins: site.admins.map((p) => convertPerson(p, "full")),
        me: me ? convertPerson({ person: me }, "partial") : null,
        myEmail: null,
        version: site.version,
        // TODO: get these counts
        usersActiveDayCount: null,
        usersActiveWeekCount: null,
        usersActiveMonthCount: null,
        usersActiveHalfYearCount: null,
        postCount: null,
        commentCount: null,
        userCount: site.site.user_count,
        sidebar: site.site.sidebar ?? null,
        icon: site.site.icon ?? null,
        title: site.site.name,
        moderates:
          site.my_user?.moderates?.map(({ community }) =>
            convertCommunity({ community }, "partial"),
          ) ?? null,
        follows:
          site.my_user?.follows?.map(({ community }) =>
            convertCommunity({ community }, "partial"),
          ) ?? null,
        personBlocks:
          site.my_user?.person_blocks?.map((block) =>
            convertPerson({ person: block.target }, "partial"),
          ) ?? null,
        communityBlocks:
          site.my_user?.community_blocks?.map(({ community }) =>
            convertCommunity({ community }, "partial"),
          ) ?? null,
        applicationQuestion: null,
        registrationMode: site.site.registration_mode,
        showNsfw: site.my_user?.local_user_view?.local_user.show_nsfw ?? false,
        blurNsfw: true,
        enablePostDownvotes: site.site.enable_downvotes,
        enableCommentDownvotes: site.site.enable_downvotes,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getPosts(form: Forms.GetPosts, options: RequestOptions) {
    const { data: sort } = postSortSchema.safeParse(form.sort);
    const json = await this.get(
      "/post/list",
      {
        limit: this.limit,
        page: form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        community_name: form.communitySlug,
        sort,
        type_: form.type,
        saved_only: form.savedOnly,
      },
      options,
    );
    try {
      const data = z
        .object({
          next_page: z.string().nullable().optional(),
          posts: z.array(pieFedPostViewSchema),
        })
        .parse(json);
      return {
        nextCursor: data.next_page ?? null,
        posts: data.posts.map((post) => ({
          post: convertPost(post),
          creator: convertPerson({ person: post.creator }, "partial"),
          community: convertCommunity({ community: post.community }, "partial"),
        })),
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getCommunities(form: Forms.GetCommunities, options: RequestOptions) {
    const { data: sort } = communitySortSchema.safeParse(form.sort);
    const json = await this.get(
      "/community/list",
      {
        limit: this.limit,
        page: form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        sort: sort === "TopAll" ? "Top" : sort,
        type_: form.type,
      },
      options,
    );
    try {
      const data = z
        .object({
          next_page: z.string().nullable().optional(),
          communities: z.array(pieFedCommunityViewSchema),
        })
        .parse(json);

      return {
        nextCursor: data.next_page ?? null,
        communities: data.communities.map((c) =>
          convertCommunity(c, "partial"),
        ),
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getCommunity(form: Forms.GetCommunity, options?: RequestOptions) {
    if (!form.slug) {
      throw new Error("community slug required");
    }

    const json = await this.get(
      "/community",
      {
        name: form.slug,
      },
      options,
    );

    try {
      const { community_view, moderators } = z
        .object({
          community_view: pieFedCommunityViewSchema,
          moderators: z.array(
            z.object({
              community: pieFedCommunitySchema,
              moderator: pieFedPersonSchema,
            }),
          ),
        })
        .parse(json);

      return {
        community: convertCommunity(community_view, "full"),
        mods: moderators.map((m) =>
          convertPerson({ person: m.moderator }, "partial"),
        ),
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getPerson(form: Forms.GetPerson, options: RequestOptions) {
    if (z.string().url().safeParse(form.apIdOrUsername).success) {
      const { person_id } = await this.resolveObjectId(form.apIdOrUsername);
      if (_.isNil(person_id)) {
        throw new Error("person not found for apId");
      }
      const json = await this.get(
        "/user",
        {
          person_id,
        },
        options,
      );
      try {
        const data = z
          .object({ person_view: pieFedPersonViewSchema })
          .parse(json);
        return convertPerson(data.person_view, "full");
      } catch (err) {
        console.log(err);
        throw err;
      }
    } else {
      const json = await this.get(
        "/user",
        {
          username: form.apIdOrUsername,
        },
        options,
      );
      try {
        const data = z
          .object({ person_view: pieFedPersonViewSchema })
          .parse(json);
        return convertPerson(data.person_view, "full");
      } catch (err) {
        console.log(err);
        throw err;
      }
    }
  }

  async getPost(form: { apId: string }, options: RequestOptions) {
    const { post_id } = await this.resolveObjectId(form.apId);
    if (_.isNil(post_id)) {
      throw new Error("post not found for apId");
    }
    const json = await this.get(
      "/post",
      {
        id: post_id,
      },
      options,
    );

    try {
      const { post_view, community_view, cross_posts } = z
        .object({
          post_view: pieFedPostViewSchema,
          cross_posts: z.array(pieFedCrosspostSchema),
          community_view: pieFedCommunityViewSchema,
        })
        .parse(json);

      return {
        post: convertPost(post_view, cross_posts),
        community_view: convertCommunity(community_view, "partial"),
        creator: convertPerson({ person: post_view.creator }, "partial"),
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async login(form: Forms.Login): Promise<{ jwt: string }> {
    const json = await this.post("/user/login", {
      username: form.username,
      password: form.password,
    });
    try {
      return z.object({ jwt: z.string() }).parse(json);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async likePost(form: Forms.LikePost) {
    const json = await this.post("/post/like", {
      post_id: form.postId,
      score: form.score,
    });
    try {
      const data = z.object({ post_view: pieFedPostViewSchema }).parse(json);
      return convertPost(data.post_view);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async savePost(form: {
    postId: number;
    save: boolean;
  }): Promise<Schemas.Post> {
    const json = await this.put("/post/save", {
      post_id: form.postId,
      save: form.save,
    });
    try {
      const data = z.object({ post_view: pieFedPostViewSchema }).parse(json);
      return convertPost(data.post_view);
    } catch (err) {
      console.log(err);
      throw err;
    }
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
    try {
      const { data: sort } = commentSortSchema.safeParse(form.sort);

      const post_id = form.postApId
        ? (await this.resolveObjectId(form.postApId)).post_id
        : undefined;

      if (form.savedOnly) {
        const json = await this.get(
          "/comment/list",
          {
            limit: this.limit,
            type_: "All",
            sort,
            page:
              form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
            parent_id: form.parentId,
            post_id,
            max_depth: form.maxDepth,
            saved_only: form.savedOnly,
          },
          options,
        );

        const data = z
          .object({
            comments: z.array(pieFedCommentViewSchema),
            next_page: z.string().nullable().optional(),
          })
          .parse(json);

        return {
          comments: data.comments.map(convertComment),
          creators: data.comments.map(({ creator }) =>
            convertPerson({ person: creator }, "partial"),
          ),
          nextCursor: data.next_page ?? null,
        };
      } else {
        const json = await this.get(
          "/post/replies",
          {
            limit: 100,
            type_: "All",
            sort,
            page:
              form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
            parent_id: form.parentId,
            post_id,
            max_depth: form.maxDepth,
          },
          options,
        );

        const data = z
          .object({
            comments: z.array(pieFedCommentViewSchema),
            next_page: z.string().nullable().optional(),
          })
          .parse(json);

        const flattenedComments = flattenCommentViews(data.comments);

        return {
          comments: flattenedComments.map(convertComment),
          creators: flattenedComments.map(({ creator }) =>
            convertPerson({ person: creator }, "partial"),
          ),
          nextCursor: data.next_page ?? null,
        };
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async likeComment(form: Forms.LikeComment) {
    await this.post("/comment/like", {
      post_id: form.postId,
      comment_id: form.id,
      score: form.score,
    });

    const json = await this.get("/comment", {
      id: form.id,
    });

    try {
      const data = z
        .object({ comment_view: pieFedCommentViewSchema })
        .parse(json);

      return convertComment(data.comment_view);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async followCommunity(
    form: Forms.FollowCommunity,
  ): Promise<Schemas.Community> {
    const json = await this.post("/community/follow", {
      community_id: form.communityId,
      follow: form.follow,
    });
    try {
      const data = z
        .object({
          community_view: pieFedCommunityViewSchema,
        })
        .parse(json);
      return convertCommunity(data.community_view, "partial");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async search(form: Forms.Search, options: RequestOptions) {
    const topSort = form.type === "Communities" || form.type === "Users";
    const json = await this.get(
      "/search",
      {
        q: form.q,
        community_name: form.communitySlug,
        page:
          _.isUndefined(form.pageCursor) || form.pageCursor === INIT_PAGE_TOKEN
            ? 1
            : _.parseInt(form.pageCursor) + 1,
        type_: form.type === "All" ? "Posts" : form.type,
        limit: form.limit ?? this.limit,
        sort: topSort ? "TopAll" : "Active",
      },
      options,
    );

    try {
      const { posts, communities, users } = z
        .object({
          posts: z.array(pieFedPostViewSchema),
          communities: z.array(pieFedCommunityViewSchema),
          users: z.array(pieFedPersonViewSchema),
        })
        .parse(json);

      const nextCursor =
        _.isUndefined(form.pageCursor) || form.pageCursor === INIT_PAGE_TOKEN
          ? 1
          : _.parseInt(form.pageCursor) + 1;

      const hasMorePosts = posts.length > this.limit;
      const hasMoreCommunities = communities.length > this.limit;
      const hasMoreUsers = users.length > this.limit;

      const hasNextCursor = hasMorePosts || hasMoreCommunities || hasMoreUsers;

      return {
        posts: posts.map((p) => convertPost(p)),
        communities: communities.map((c) => convertCommunity(c, "partial")),
        comments: [],
        users: users.map((p) => convertPerson(p, "partial")),
        nextCursor: hasNextCursor ? String(nextCursor) : null,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async deletePost(form: Forms.DeletePost): Promise<Schemas.Post> {
    const json = await this.post("/post/delete", {
      post_id: form.postId,
      deleted: form.deleted,
    });

    try {
      const data = z
        .object({
          post_view: pieFedPostViewSchema,
        })
        .parse(json);

      return convertPost(data.post_view);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async createComment(form: Forms.CreateComment): Promise<Schemas.Comment> {
    const { post_id } = await this.resolveObjectId(form.postApId);

    const json = await this.post("/comment", {
      body: form.body,
      post_id,
      parent_id: form.parentId,
    });

    try {
      const { comment_view } = z
        .object({
          comment_view: pieFedCommentViewSchema,
        })
        .parse(json);

      return convertComment(comment_view);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async deleteComment(form: Forms.DeleteComment): Promise<Schemas.Comment> {
    const json = await this.post("/comment/delete", {
      comment_id: form.id,
      deleted: form.deleted,
    });

    try {
      const { comment_view } = z
        .object({
          comment_view: pieFedCommentViewSchema,
        })
        .parse(json);

      return convertComment(comment_view);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async editComment(form: Forms.EditComment): Promise<Schemas.Comment> {
    const json = await this.put("/comment", {
      comment_id: form.id,
      body: form.body,
    });

    try {
      const { comment_view } = z
        .object({
          comment_view: pieFedCommentViewSchema,
        })
        .parse(json);

      return convertComment(comment_view);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async getPersonContent(
    form: Forms.GetPersonContent,
    options: RequestOptions,
  ) {
    const personOrUsername: Partial<{
      username: string;
      person_id: number;
    }> = {};

    if (z.string().url().safeParse(form.apIdOrUsername).success) {
      const { person_id } = await this.resolveObjectId(form.apIdOrUsername);
      if (_.isNil(person_id)) {
        throw new Error("person not found");
      }
      personOrUsername.person_id = person_id;
    } else {
      personOrUsername.username = form.apIdOrUsername;
    }

    const json =
      form.type === "Posts"
        ? await this.get(
            "/post/list",
            {
              ...personOrUsername,
              limit: this.limit,
              sort: "New",
              page_cursor:
                form.pageCursor === INIT_PAGE_TOKEN
                  ? undefined
                  : form.pageCursor,
              type_: "All",
            },
            options,
          )
        : await this.get(
            "/comment/list",
            {
              ...personOrUsername,
              limit: this.limit,
              sort: "New",
              page_cursor:
                form.pageCursor === INIT_PAGE_TOKEN
                  ? undefined
                  : form.pageCursor,
              type_: "All",
            },
            options,
          );

    try {
      const { posts, comments, next_page } = z
        .object({
          posts: z.array(pieFedPostViewSchema).optional(),
          comments: z.array(pieFedCommentViewSchema).optional(),
          next_page: z.string().nullable().optional(),
        })
        .parse(json);

      return {
        posts: posts?.map((p) => convertPost(p)) ?? [],
        comments: comments?.map(convertComment) ?? [],
        nextCursor: next_page ?? null,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async editPost(form: Forms.EditPost) {
    const { post_id } = await this.resolveObjectId(form.apId);
    const res = await this.put("/post", {
      post_id,
      title: form.title,
      url: form.url,
      body: form.body,
      nsfw: form.nsfw,
    });
    try {
      const data = z.object({ post_view: pieFedPostViewSchema }).parse(res);
      return convertPost(data.post_view);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async createPost(form: Forms.CreatePost) {
    const { community } = await this.getCommunity({ slug: form.communitySlug });
    const res = await this.post("/post", {
      title: form.title,
      community_id: community.id,
      url: form.url,
      body: form.body,
      nsfw: form.nsfw,
    });
    try {
      const data = z.object({ post_view: pieFedPostViewSchema }).parse(res);
      return convertPost(data.post_view);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async markPostRead(form: Forms.MarkPostRead) {
    await this.post("/post/mark_as_read", {
      post_ids: [form.postIds],
      read: form.read,
    });
  }

  async getPrivateMessages(
    form: Forms.GetPrivateMessages,
    options: RequestOptions,
  ) {
    const json = await this.get(
      "/private_message/list",
      {
        unread_only: form.unreadOnly ?? false,
        page: form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        limit: this.limit,
      },
      options,
    );

    try {
      const { private_messages, next_page } = z
        .object({
          private_messages: z.array(pieFedPrivateMessageViewSchema),
          next_page: z.string().nullable().optional(),
        })
        .parse(json);

      const profiles = _.uniqBy(
        [
          ...private_messages.map((pm) => pm.creator),
          ...private_messages.map((pm) => pm.recipient),
        ],
        (p) => p.actor_id,
      ).map((person) => convertPerson({ person }, "partial"));

      return {
        privateMessages: private_messages.map(convertPrivateMessage),
        profiles,
        nextCursor: next_page ?? null,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async createPrivateMessage(form: Forms.CreatePrivateMessage) {
    const json = await this.post("/private_message", {
      content: form.body,
      recipient_id: form.recipientId,
    });

    try {
      const { private_message_view } = z
        .object({
          private_message_view: pieFedPrivateMessageViewSchema,
        })
        .parse(json);

      return convertPrivateMessage(private_message_view);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async markPrivateMessageRead(form: Forms.MarkPrivateMessageRead) {
    await this.post("/private_message/mark_as_read", {
      private_message_id: form.id,
      read: form.read,
    });
  }

  async featurePost(form: Forms.FeaturePost) {
    const res = this.post("/post/feature", {
      post_id: form.postId,
      featured: form.featured,
      feature_type: form.featureType,
    });
    try {
      const data = z.object({ post_view: pieFedPostViewSchema }).parse(res);
      return convertPost(data.post_view);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async getReplies(form: Forms.GetReplies, option: RequestOptions) {
    const json = await this.get(
      "/user/replies",
      {
        sort: form.sort,
        page: form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        limit: this.limit,
        unread_only: form.unreadOnly,
      },
      option,
    );

    try {
      const { replies, next_page } = z
        .object({
          replies: z.array(pieFedReplyViewSchema),
          next_page: z.string().nullable().optional(),
        })
        .parse(json);

      return {
        replies: replies.map(convertReply),
        profiles: replies.map((r) =>
          convertPerson({ person: r.creator }, "partial"),
        ),
        nextCursor: next_page ?? null,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async getMentions(form: Forms.GetMentions, options: RequestOptions) {
    const json = await this.get(
      "/user/mentions",
      {
        page: form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        limit: this.limit,
        unread_only: form.unreadOnly,
      },
      options,
    );

    try {
      const { replies, next_page } = z
        .object({
          next_page: z.string().nullable().optional(),
          replies: z.array(pieFedReplyViewSchema),
        })
        .parse(json);

      return {
        mentions: replies.map(convertMention),
        profiles: _.unionBy(
          replies.map((r) => convertPerson({ person: r.creator }, "partial")),
          (p) => p.apId,
        ),
        nextCursor: next_page ?? null,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async markReplyRead(form: Forms.MarkReplyRead) {
    await this.post("/comment/mark_as_read", {
      comment_reply_id: form.id,
      read: form.read,
    });
  }

  async markMentionRead(form: Forms.MarkMentionRead) {
    await this.markReplyRead(form);
  }

  async createPostReport(form: Forms.CreatePostReport) {
    await this.post("/post/report", {
      post_id: form.postId,
      reason: form.reason,
    });
  }

  async createCommentReport(form: Forms.CreateCommentReport) {
    await this.post("/comment/report", {
      comment_id: form.commentId,
      reason: form.reason,
    });
  }

  async blockPerson(form: Forms.BlockPerson) {
    await this.post("/user/block", {
      person_id: form.personId,
      block: form.block,
    });
  }

  async blockCommunity(form: Forms.BlockCommunity) {
    await this.post("/community/block", {
      community_id: form.communityId,
      block: form.block,
    });
  }

  async uploadImage(form: Forms.UploadImage) {
    const formData = new FormData();
    formData.append("file", form.image);

    const res = await fetch(`${this.instance}/api/alpha/upload/image`, {
      method: "POST",
      headers: {
        ..._.omit(DEFAULT_HEADERS, "Content-Type"),
        ...(this.jwt ? { authorization: `Bearer ${this.jwt}` } : {}),
      },
      body: formData,
      cache: "no-store",
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`upload failed, status code ${res.status}`);
    }

    const json = await res.json();

    try {
      const { url } = z
        .object({
          url: z.string(),
        })
        .parse(json);

      return {
        url,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async saveUserSettings(form: Forms.SaveUserSettings) {
    await this.put("/user/save_user_settings", {
      avatar: form.avatar,
      banner: form.banner,
      bio: form.bio,
      display_name: form.displayName,
      email: form.email,
    });
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
    const json = await this.get(
      "/resolve_object",
      {
        q: form.q,
      },
      options,
    );

    try {
      const { post, community, person } = z
        .object({
          post: pieFedPostViewSchema.optional(),
          community: pieFedCommentViewSchema.optional(),
          person: pieFedPersonViewSchema.optional(),
        })
        .parse(json);

      return {
        post: post ? convertPost(post) : null,
        community: community ? convertCommunity(community, "partial") : null,
        user: person ? convertPerson(person, "partial") : null,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
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
