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
  "TopHour",
  "TopSixHour",
  "TopTwelveHour",
  "TopDay",
  "TopWeek",
  "TopMonth",
  "Scaled",
] as const;
const postSortSchema = z.custom<(typeof POST_SORTS)[number]>((sort) => {
  return _.isString(sort) && POST_SORTS.includes(sort as any);
});

const COMMENT_SORTS = ["Hot", "Top", "New", "Old"] as const;

const commentSortSchema = z.custom<(typeof COMMENT_SORTS)[number]>((sort) => {
  return _.isString(sort) && COMMENT_SORTS.includes(sort as any);
});

const COMMUNITY_SORTS = [
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
  "Scaled",
] as const;
const communitySortSchema = z.custom<(typeof COMMUNITY_SORTS)[number]>(
  (sort) => {
    return _.isString(sort) && COMMUNITY_SORTS.includes(sort as any);
  },
);

const DEFAULT_HEADERS = {};

export const pieFedCommunitySchema = z.object({
  actor_id: z.string(),
  ap_domain: z.string(),
  banned: z.boolean(),
  deleted: z.boolean(),
  hidden: z.boolean(),
  icon: z.string().optional(),
  banner: z.string().optional(),
  id: z.number(),
  instance_id: z.number(),
  local: z.boolean(),
  name: z.string(),
  nsfw: z.boolean(),
  published: z.string(),
  removed: z.boolean(),
  restricted_to_mods: z.boolean(),
  title: z.string(),
  description: z.string().optional(),
  updated: z.string().optional(),
});

export const pieFedPostCountsSchema = z.object({
  comments: z.number(),
  downvotes: z.number(),
  newest_comment_time: z.string(),
  post_id: z.number(),
  published: z.string(),
  score: z.number(),
  upvotes: z.number(),
});

export const pieFedPersonSchema = z.object({
  about: z.string().optional(),
  actor_id: z.string(),
  avatar: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  banned: z.boolean(),
  bot: z.boolean(),
  deleted: z.boolean(),
  id: z.number(),
  instance_id: z.number(),
  local: z.boolean(),
  published: z.string(),
  title: z.string().nullable(),
  user_name: z.string(),
});

const pieFedPersonViewSchema = z.object({
  person: pieFedPersonSchema,
  counts: z.object({
    person_id: z.number(),
    comment_count: z.number(),
    post_count: z.number(),
  }),
});

export const pieFedPostSchema = z.object({
  ap_id: z.string(),
  body: z.string().optional(),
  community_id: z.number(),
  deleted: z.boolean(),
  edited_at: z.string().optional(),
  id: z.number(),
  language_id: z.number(),
  local: z.boolean(),
  locked: z.boolean(),
  nsfw: z.boolean(),
  published: z.string(),
  removed: z.boolean(),
  small_thumbnail_url: z.string().optional(),
  sticky: z.boolean(),
  thumbnail_url: z.string().optional(),
  title: z.string(),
  url: z.string().optional(),
  user_id: z.number(),
});

export const pieFedPostViewSchema = z.object({
  activity_alert: z.boolean(),
  banned_from_community: z.boolean(),
  community: pieFedCommunitySchema,
  counts: pieFedPostCountsSchema,
  creator: pieFedPersonSchema,
  creator_banned_from_community: z.boolean(),
  creator_is_admin: z.boolean(),
  creator_is_moderator: z.boolean(),
  hidden: z.boolean(),
  my_vote: z.number(),
  post: pieFedPostSchema,
  read: z.boolean(),
  saved: z.boolean(),
  subscribed: z.string(),
  unread_comments: z.number(),
});

export const pieFedCommunityCountsSchema = z.object({
  id: z.number(),
  published: z.string(),
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
  activity_alert: z.boolean(),
  blocked: z.boolean(),
  community: pieFedCommunitySchema,
  counts: pieFedCommunityCountsSchema,
  subscribed: z.enum(["Subscribed", "NotSubscribed", "Pending"]),
});

export const pieFedAdminCountsSchema = z.object({
  comment_count: z.number(),
  person_id: z.number(),
  post_count: z.number(),
});

export const pieFedAdminSchema = z.object({
  activity_alert: z.boolean(),
  counts: pieFedAdminCountsSchema,
  is_admin: z.boolean(),
  person: pieFedPersonSchema,
});

export const pieFedLanguageSchema = z.object({
  code: z.string(),
  id: z.number(),
  name: z.string(),
});

export const pieFedSiteDetailsSchema = z.object({
  actor_id: z.string(),
  all_languages: z.array(pieFedLanguageSchema),
  description: z.string(),
  enable_downvotes: z.boolean(),
  icon: z.string().optional(),
  name: z.string(),
  registration_mode: z.string(),
  sidebar: z.string().optional(),
  user_count: z.number(),
});

export const pieFedFollowSchema = z.object({
  community: pieFedCommunitySchema,
  follower: pieFedPersonSchema,
});

export const pieFedLocalUserSchema = z.object({
  default_listing_type: z.string(),
  default_sort_type: z.string(),
  show_bot_accounts: z.boolean(),
  show_nsfw: z.boolean(),
  show_read_posts: z.boolean(),
  show_scores: z.boolean(),
});

export const pieFedLocalUserViewSchema = z.object({
  counts: z.object({
    comment_count: z.number(),
    person_id: z.number(),
    post_count: z.number(),
  }),
  local_user: pieFedLocalUserSchema,
  person: pieFedPersonSchema,
});

export const pieFedMyUserSchema = z.object({
  community_blocks: z.array(pieFedCommunityViewSchema).optional(),
  discussion_languages: z.array(pieFedLanguageSchema).optional(),
  follows: z.array(pieFedFollowSchema).optional(),
  instance_blocks: z.array(z.any()).optional(),
  local_user_view: pieFedLocalUserViewSchema.optional(),
  moderates: z.array(pieFedCommunityViewSchema).optional(),
  person_blocks: z.array(pieFedPersonSchema).optional(),
});

export const pieFedSiteSchema = z.object({
  admins: z.array(pieFedAdminSchema),
  my_user: pieFedMyUserSchema.optional(),
  site: pieFedSiteDetailsSchema,
  version: z.string(),
});

export const pieFedCommentSchema = z.object({
  ap_id: z.string(),
  body: z.string(),
  deleted: z.boolean(),
  distinguished: z.boolean(),
  edited_at: z.string().optional(),
  id: z.number(),
  language_id: z.number(),
  local: z.boolean(),
  path: z.string(),
  post_id: z.number(),
  published: z.string(),
  removed: z.boolean(),
  user_id: z.number(),
});

export const pieFedCommentCountsSchema = z.object({
  child_count: z.number(),
  comment_id: z.number(),
  downvotes: z.number(),
  published: z.string(),
  score: z.number(),
  upvotes: z.number(),
});

export const pieFedCommentViewSchema = z.object({
  activity_alert: z.boolean(),
  banned_from_community: z.boolean(),
  canAuthUserModerate: z.boolean(),
  comment: pieFedCommentSchema,
  community: pieFedCommunitySchema,
  counts: pieFedCommentCountsSchema,
  creator: pieFedPersonSchema,
  creator_banned_from_community: z.boolean(),
  creator_blocked: z.boolean(),
  creator_is_admin: z.boolean(),
  creator_is_moderator: z.boolean(),
  my_vote: z.number(),
  post: pieFedPostSchema,
  saved: z.boolean(),
  subscribed: z.enum(["Subscribed", "NotSubscribed", "Pending"]),
});

export const pieFedCommentReplySchema = z.object({
  id: z.number(),
  recipient_id: z.number(),
  comment_id: z.number(),
  read: z.boolean(),
  published: z.string(),
});

export const pieFedReplyViewSchema = z.object({
  comment_reply: pieFedCommentReplySchema,
  comment: pieFedCommentSchema,
  creator: pieFedPersonSchema,
  post: pieFedPostSchema,
  community: pieFedCommunitySchema,
  recipient: pieFedPersonSchema,
  counts: pieFedCommentCountsSchema,
  creator_banned_from_community: z.boolean(),
  creator_is_moderator: z.boolean(),
  creator_is_admin: z.boolean(),
  subscribed: z.enum(["Subscribed", "NotSubscribed", "Pending"]),
  saved: z.boolean(),
  creator_blocked: z.boolean(),
  my_vote: z.number(),
});

export const pieFedPrivateMessageSchema = z.object({
  id: z.number(),
  creator_id: z.number(),
  recipient_id: z.number(),
  content: z.string(),
  deleted: z.boolean(),
  read: z.boolean(),
  published: z.string(),
  updated: z.string().optional(),
  ap_id: z.string(),
  local: z.boolean(),
});

export const pieFedPrivateMessageViewSchema = z.object({
  private_message: pieFedPrivateMessageSchema,
  creator: pieFedPersonSchema,
  recipient: pieFedPersonSchema,
});

function convertPost(
  postView: z.infer<typeof pieFedPostViewSchema>,
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
    crossPosts: [],
    // TODO: see if this exists
    featuredCommunity: false,
    // TODO: see if this exists
    featuredLocal: false,
    read: postView.read,
    saved: postView.saved,
    nsfw: post.nsfw,
  };
}

function convertCommunity(
  communityView:
    | z.infer<typeof pieFedCommunityViewSchema>
    | { community: z.infer<typeof pieFedCommunitySchema> },
): Schemas.Community {
  const counts = "counts" in communityView ? communityView.counts : null;
  const subscribed =
    "subscribed" in communityView ? communityView.subscribed : null;
  return {
    createdAt: communityView.community.published,
    id: communityView.community.id,
    apId: communityView.community.actor_id,
    slug: createSlug({
      apId: communityView.community.actor_id,
      name: communityView.community.name,
    }).slug,
    icon: communityView.community.icon ?? null,
    banner: communityView.community.banner ?? null,
    description: communityView.community.description ?? null,
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
}

function convertPerson({
  person,
  counts,
}:
  | z.infer<typeof pieFedPersonViewSchema>
  | {
      person: z.infer<typeof pieFedPersonSchema>;
      counts?: undefined;
    }): Schemas.Person {
  return {
    apId: person.actor_id,
    id: person.id,
    avatar: person.avatar ?? null,
    bio: person.about ?? null,
    matrixUserId: null,
    slug: createSlug({ apId: person.actor_id, name: person.user_name }).slug,
    deleted: person.deleted,
    createdAt: person.published,
    isBot: person.bot,
    // TODO: add thses counts
    postCount: counts?.post_count ?? null,
    commentCount: counts?.comment_count ?? null,
  };
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

export class PieFedApi implements ApiBlueprint<null> {
  client = null;
  instance: string;
  limit = 50;

  jwt?: string;

  async get(
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
    if (res.status < 200 || res.status >= 300) {
      throw new Error("unexpected error, status code " + res.status);
    }
    return await res.json();
  }

  async post(endpoint: string, body: Record<string, any>) {
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
    if (res.status < 200 || res.status >= 400) {
      throw new Error("unexpected error, status code " + res.status);
    }
    return await res.json();
  }

  async put(endpoint: string, body: Record<string, any>) {
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
    if (res.status < 200 || res.status >= 400) {
      throw new Error("unexpected error, status code " + res.status);
    }
    return await res.json();
  }

  private resolveObjectId = _.memoize(
    async (apId: string) => {
      const json = await this.get("/resolve_object", {
        q: apId,
      });

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
          person: z.object({ person: z.object({ id: z.number() }) }).optional(),
        })
        .parse(json);

      return {
        post_id: post?.post.id,
        comment_id: comment?.comment.id,
        community_id: community?.community.id,
        person_id: person?.person.id,
      };
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
        instance: this.instance,
        admins: site.admins.map((p) => convertPerson(p)),
        me: me ? convertPerson({ person: me }) : null,
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
        moderates: null,
        follows:
          site.my_user?.follows?.map(({ community }) =>
            convertCommunity({ community }),
          ) ?? null,
        personBlocks:
          site.my_user?.person_blocks?.map((block) =>
            convertPerson({ person: block }),
          ) ?? null,
        communityBlocks:
          site.my_user?.community_blocks?.map(({ community }) =>
            convertCommunity({ community }),
          ) ?? null,
        applicationQuestion: null,
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
      },
      options,
    );
    try {
      const data = z
        .object({
          next_page: z.string().nullable(),
          posts: z.array(pieFedPostViewSchema),
        })
        .parse(json);
      return {
        nextCursor: data.next_page,
        posts: data.posts.map((post) => ({
          post: convertPost(post),
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
        sort,
        type_: form.type,
      },
      options,
    );
    try {
      const data = z
        .object({
          next_page: z.string().nullable(),
          communities: z.array(pieFedCommunityViewSchema),
        })
        .parse(json);

      return {
        nextCursor: data.next_page,
        communities: data.communities.map(convertCommunity),
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
      community: convertCommunity(community_view),
      mods: moderators.map((m) => convertPerson({ person: m.moderator })),
    };
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
      const data = z
        .object({ person_view: pieFedPersonViewSchema })
        .parse(json);
      return convertPerson(data.person_view);
    } else {
      const json = await this.get(
        "/user",
        {
          username: form.apIdOrUsername,
        },
        options,
      );
      const data = z
        .object({ person_view: pieFedPersonViewSchema })
        .parse(json);
      return convertPerson(data.person_view);
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

    const { post_view, community_view } = z
      .object({
        post_view: pieFedPostViewSchema,
        community_view: pieFedCommunityViewSchema,
      })
      .parse(json);

    return {
      post: convertPost(post_view),
      community_view: convertCommunity(community_view),
      creator: convertPerson({ person: post_view.creator }),
    };
  }

  async login(form: Forms.Login): Promise<{ jwt: string }> {
    const json = await this.post("/user/login", {
      username: form.username,
      password: form.password,
    });
    return z.object({ jwt: z.string() }).parse(json);
  }

  async likePost(form: Forms.LikePost) {
    const json = await this.post("/post/like", {
      post_id: form.postId,
      score: form.score,
    });
    const data = z.object({ post_view: pieFedPostViewSchema }).parse(json);
    return convertPost(data.post_view);
  }

  async savePost(form: {
    postId: number;
    save: boolean;
  }): Promise<Schemas.Post> {
    const json = await this.put("/post/save", {
      post_id: form.postId,
      save: form.save,
    });
    const data = z.object({ post_view: pieFedPostViewSchema }).parse(json);
    return convertPost(data.post_view);
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
    const { data: sort } = commentSortSchema.safeParse(form.sort);

    const post_id = form.postApId
      ? (await this.resolveObjectId(form.postApId)).post_id
      : undefined;

    const json = await this.get(
      "/comment/list",
      {
        limit: this.limit,
        type_: "All",
        sort,
        page: form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        parent_id: form.parentId,
        post_id,
      },
      options,
    );

    const data = z
      .object({
        comments: z.array(pieFedCommentViewSchema),
        next_page: z.string().nullable(),
      })
      .parse(json);

    return {
      comments: data.comments.map(convertComment),
      creators: data.comments.map(({ creator }) =>
        convertPerson({ person: creator }),
      ),
      nextCursor: data.next_page,
    };
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

    const data = z
      .object({ comment_view: pieFedCommentViewSchema })
      .parse(json);

    return convertComment(data.comment_view);
  }

  async followCommunity(
    form: Forms.FollowCommunity,
  ): Promise<Schemas.Community> {
    const json = await this.post("/community/follow", {
      community_id: form.communityId,
      follow: form.follow,
    });
    const data = z
      .object({
        community_view: pieFedCommunityViewSchema,
      })
      .parse(json);
    return convertCommunity(data.community_view);
  }

  async search(form: Forms.Search, options: RequestOptions) {
    const json = await this.get(
      "/search",
      {
        q: form.q,
        type_: form.type,
        page:
          _.isUndefined(form.pageCursor) || form.pageCursor === INIT_PAGE_TOKEN
            ? 1
            : _.parseInt(form.pageCursor) + 1,
      },
      options,
    );

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
      posts: posts.map(convertPost),
      communities: communities.map(convertCommunity),
      users: users.map(convertPerson),
      nextCursor: hasNextCursor ? String(nextCursor) : null,
    };
  }

  async deletePost(form: Forms.DeletePost): Promise<Schemas.Post> {
    const json = await this.post("/post/delete", {
      post_id: form.postId,
      deleted: form.deleted,
    });

    const data = z
      .object({
        post_view: pieFedPostViewSchema,
      })
      .parse(json);

    return convertPost(data.post_view);
  }

  async createComment(form: Forms.CreateComment): Promise<Schemas.Comment> {
    const { post_id } = await this.resolveObjectId(form.postApId);

    const json = await this.post("/comment", {
      body: form.body,
      post_id,
      parent_id: form.parentId,
    });

    const { comment_view } = z
      .object({
        comment_view: pieFedCommentViewSchema,
      })
      .parse(json);

    return convertComment(comment_view);
  }

  async deleteComment(form: Forms.DeleteComment): Promise<Schemas.Comment> {
    const json = await this.post("/comment/delete", {
      comment_id: form.id,
      deleted: form.deleted,
    });

    const { comment_view } = z
      .object({
        comment_view: pieFedCommentViewSchema,
      })
      .parse(json);

    return convertComment(comment_view);
  }

  async editComment(form: Forms.EditComment): Promise<Schemas.Comment> {
    const json = await this.put("/comment", {
      comment_id: form.id,
      body: form.body,
    });

    const { comment_view } = z
      .object({
        comment_view: pieFedCommentViewSchema,
      })
      .parse(json);

    return convertComment(comment_view);
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

    const json = await this.get(
      "/post/list",
      {
        ...personOrUsername,
        limit: this.limit,
        page_cursor:
          form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        type_: form.type,
      },
      options,
    );

    try {
      const { posts, comments } = z
        .object({
          posts: z.array(pieFedPostViewSchema).optional(),
          comments: z.array(pieFedCommentViewSchema).optional(),
        })
        .parse(json);

      return {
        posts: posts?.map(convertPost) ?? [],
        comments: comments?.map(convertComment) ?? [],
        nextCursor: null,
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
    const data = z.object({ post_view: pieFedPostViewSchema }).parse(res);
    return convertPost(data.post_view);
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
    const data = z.object({ post_view: pieFedPostViewSchema }).parse(res);
    return convertPost(data.post_view);
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
    const { private_messages, next_page } = z
      .object({
        private_messages: z.array(pieFedPrivateMessageViewSchema),
        next_page: z.string().nullable(),
      })
      .parse(json);

    const profiles = _.uniqBy(
      [
        ...private_messages.map((pm) => pm.creator),
        ...private_messages.map((pm) => pm.recipient),
      ],
      (p) => p.actor_id,
    ).map((person) => convertPerson({ person }));

    return {
      privateMessages: private_messages.map(convertPrivateMessage),
      profiles,
      nextCursor: next_page,
    };
  }

  async createPrivateMessage(form: Forms.CreatePrivateMessage) {
    const json = await this.post("/private_message", {
      content: form.body,
      recipient_id: form.recipientId,
    });

    const { private_message_view } = z
      .object({
        private_message_view: pieFedPrivateMessageViewSchema,
      })
      .parse(json);

    return convertPrivateMessage(private_message_view);
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
    const data = z.object({ post_view: pieFedPostViewSchema }).parse(res);
    return convertPost(data.post_view);
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

    const { replies, next_page } = z
      .object({
        replies: z.array(pieFedReplyViewSchema),
        next_page: z.string().nullable(),
      })
      .parse(json);

    return {
      replies: replies.map(convertReply),
      profiles: replies.map((r) => convertPerson({ person: r.creator })),
      nextCursor: next_page,
    };
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

    const { replies, next_page } = z
      .object({
        next_page: z.string().nullable(),
        replies: z.array(pieFedReplyViewSchema),
      })
      .parse(json);

    return {
      mentions: replies.map(convertMention),
      profiles: _.unionBy(
        replies.map((r) => convertPerson({ person: r.creator })),
        (p) => p.apId,
      ),
      nextCursor: next_page,
    };
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
    await this.post("/comment/report", {
      person_id: form.personId,
      block: form.block,
    });
  }

  async blockCommunity(form: Forms.BlockCommunity) {
    await this.post("/comment/report", {
      community_id: form.communityId,
      block: form.block,
    });
  }

  async uploadImage(form: Forms.UploadImage) {
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
