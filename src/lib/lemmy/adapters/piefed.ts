import _ from "lodash";
import { env } from "@/src/env";
import {
  ApiBlueprint,
  Forms,
  INIT_PAGE_TOKEN,
  RequestOptions,
  Schemas,
} from "./api-blueprint";
import z from "zod";
import { createSlug } from "../utils";

const DEFAULT_HEADERS = {
  // lemmy.ml will reject requests if
  // User-Agent header is not present
  "User-Agent": env.REACT_APP_NAME.toLowerCase(),
};

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
  updated: z.string(),
});

export const pieFedCountsSchema = z.object({
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
  counts: pieFedCountsSchema,
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
  post_count: z.number(),
  post_reply_count: z.number(),
  published: z.string(),
  subscriptions_count: z.number(),
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
  sidebar: z.string(),
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

function convertPost(
  postView: z.infer<typeof pieFedPostViewSchema>,
): Schemas.Post {
  const { post, counts, community, creator } = postView;
  return {
    creatorSlug: createSlug(post, true).slug,
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
    optimisticMyVote: postView.my_vote,
    commentsCount: counts.comments,
    deleted: post.deleted,
    removed: post.removed,
    thumbnailAspectRatio: null,
    communitySlug: createSlug(community, true).slug,
    communityApId: community.actor_id,
    creatorApId: creator.actor_id,
    crossPosts: [],
    // TODO: see if this exists
    featuredCommunity: false,
    // TODO: see if this exists
    featuredLocal: false,
    read: postView.read,
    saved: postView.saved,
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
    slug: createSlug(communityView.community, true).slug,
    icon: communityView.community.icon ?? null,
    banner: communityView.community.banner ?? null,
    description: communityView.community.description ?? null,
    ...(counts
      ? {
          postCount: counts.post_count,
          commentCount: counts.post_reply_count,
          subscriberCount: counts.subscriptions_count,
          subscribersLocalCount: counts.subscriptions_count,
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
    slug: createSlug(person, true).slug,
    deleted: person.deleted,
    createdAt: person.published,
    isBot: person.bot,
    // TODO: add thses counts
    postCount: counts?.post_count ?? null,
    commentCount: counts?.comment_count ?? null,
  };
}

export class PieFedApi implements ApiBlueprint<null> {
  client = null;
  instance: string;
  limit = 50;

  jwt?: string;

  setJwt(jwt: string): void {
    this.jwt = jwt;
  }

  async fetch(
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
    });
    if (res.status < 200 || res.status >= 400) {
      throw new Error("unexpected error, status code " + res.status);
    }
    return await res.json();
  }

  private resolveObjectId = _.memoize(
    async (apId: string) => {
      const json = await this.fetch("/resolve_object", {
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
    const json = await this.fetch("/site", {}, options);
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
  }

  async getPosts(form: Forms.GetPosts, options: RequestOptions) {
    const json = await this.fetch(
      "/post/list",
      {
        limit: this.limit,
        page: form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        community_name: form.communitySlug,
        sort: form.sort,
      },
      options,
    );
    const data = z
      .object({
        next_page: z.string().optional(),
        posts: z.array(pieFedPostViewSchema),
      })
      .parse(json);
    return {
      nextCursor: data.next_page ?? null,
      posts: data.posts.map((post) => ({
        post: convertPost(post),
      })),
    };
  }

  async getCommunities(form: Forms.GetCommunities, options: RequestOptions) {
    const json = await this.fetch(
      "/community/list",
      {
        limit: this.limit,
        page: form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        sort: form.sort,
      },
      options,
    );
    const data = z
      .object({
        next_page: z.string().optional(),
        communities: z.array(pieFedCommunityViewSchema),
      })
      .parse(json);

    return {
      nextCursor: data.next_page ?? null,
      communities: data.communities.map(convertCommunity),
    };
  }

  async getCommunity(form: Forms.GetCommunity, options: RequestOptions) {
    if (!form.slug) {
      throw new Error("community slug required");
    }

    const json = await this.fetch(
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
    const { person_id } = await this.resolveObjectId(form.apId);
    if (_.isNil(person_id)) {
      throw new Error("person not found for apId");
    }
    const json = await this.fetch(
      "/user",
      {
        person_id,
      },
      options,
    );
    const data = z.object({ person_view: pieFedPersonViewSchema }).parse(json);
    return convertPerson(data.person_view);
  }

  async getPost(form: { apId: string }, options: RequestOptions) {
    const { post_id } = await this.resolveObjectId(form.apId);
    if (_.isNil(post_id)) {
      throw new Error("post not found for apId");
    }
    const json = await this.fetch(
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
    const data = z.object({ jwt: z.string() }).parse(json);
    this.setJwt(data.jwt);
    return data;
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
}
