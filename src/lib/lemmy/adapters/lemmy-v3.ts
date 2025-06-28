import { env } from "@/src/env";
import * as lemmyV3 from "lemmy-v3";
import {
  ApiBlueprint,
  Schemas,
  RequestOptions,
  Forms,
  INIT_PAGE_TOKEN,
  Errors,
} from "./api-blueprint";
import { createSlug } from "../utils";
import _ from "lodash";

function is2faError(err?: Error | null) {
  return err && err.message.includes("missing_totp_token");
}

const DEFAULT_HEADERS = {
  // lemmy.ml will reject requests if
  // User-Agent header is not present
  "User-Agent": env.REACT_APP_NAME.toLowerCase(),
};

export function getLemmyClient(instance: string) {
  const client = new lemmyV3.LemmyHttp(instance.replace(/\/$/, ""), {
    headers: DEFAULT_HEADERS,
  });

  const setJwt = (jwt: string) => {
    client.setHeaders({
      ...DEFAULT_HEADERS,
      Authorization: `Bearer ${jwt}`,
    });
  };

  return {
    client,
    setJwt,
  };
}

function cursorToInt(pageCursor: string | null | undefined) {
  return pageCursor ? _.parseInt(pageCursor) : undefined;
}

function convertCommunity(
  communityView: lemmyV3.CommunityView | { community: lemmyV3.Community },
): Schemas.Community {
  const counts = "counts" in communityView ? communityView.counts : null;
  const subscribed =
    "subscribed" in communityView ? communityView.subscribed : null;
  const { community } = communityView;
  return {
    createdAt: community.published,
    id: community.id,
    apId: community.actor_id,
    slug: createSlug({ apId: community.actor_id, name: community.name }).slug,
    icon: community.icon ?? null,
    banner: community.banner ?? null,
    description: community.description ?? null,
    ...(counts
      ? {
          usersActiveDayCount: counts.users_active_day,
          usersActiveWeekCount: counts.users_active_week,
          usersActiveMonthCount: counts.users_active_month,
          usersActiveHalfYearCount: counts.users_active_half_year,
          postCount: counts.posts,
          commentCount: counts.posts,
          subscriberCount: counts.subscribers,
          subscribersLocalCount: counts.subscribers_local,
        }
      : {}),
    ...(subscribed
      ? {
          subscribed:
            subscribed === "ApprovalRequired" ? "Pending" : subscribed,
        }
      : {}),
  };
}

function convertPerson({
  person,
  counts,
}:
  | lemmyV3.PersonView
  | { person: lemmyV3.Person; counts?: undefined }): Schemas.Person {
  return {
    apId: person.actor_id,
    id: person.id,
    avatar: person.avatar ?? null,
    bio: person.bio ?? null,
    matrixUserId: person.matrix_user_id ?? null,
    slug: createSlug({ apId: person.actor_id, name: person.name }).slug,
    deleted: person.deleted,
    createdAt: person.published,
    isBot: person.bot_account,
    postCount: counts?.post_count ?? null,
    commentCount: counts?.comment_count ?? null,
  };
}

function convertPost(postView: lemmyV3.PostView): Schemas.Post {
  const { post, counts, community, creator } = postView;
  return {
    creatorSlug: createSlug({ apId: creator.actor_id, name: creator.name })
      .slug,
    url: post.url ?? null,
    urlContentType: post.url_content_type ?? null,
    creatorId: post.creator_id,
    createdAt: post.published,
    id: post.id,
    apId: post.ap_id,
    title: post.name,
    body: post.body ?? null,
    thumbnailUrl: post.thumbnail_url ?? null,
    upvotes: counts.upvotes,
    downvotes: counts.downvotes,
    optimisticMyVote: postView.my_vote,
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
    featuredCommunity: post.featured_community,
    featuredLocal: post.featured_local,
    read: postView.read,
    saved: postView.saved,
  };
}
function convertComment(commentView: lemmyV3.CommentView): Schemas.Comment {
  const { post, counts, creator, comment, community } = commentView;
  return {
    createdAt: comment.published,
    id: comment.id,
    apId: comment.ap_id,
    body: comment.content,
    creatorId: creator.id,
    creatorApId: creator.actor_id,
    creatorSlug: createSlug({ apId: creator.actor_id, name: creator.name })
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
    postTitle: post.name,
    myVote: commentView.my_vote ?? null,
  };
}

export class LemmyV3Api implements ApiBlueprint<lemmyV3.LemmyHttp> {
  client: lemmyV3.LemmyHttp;
  instance: string;
  limit = 50;

  private resolveObjectId = _.memoize(
    async (apId: string) => {
      const { post, comment, community, person } =
        await this.client.resolveObject({
          q: apId,
        });
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
    this.client = new lemmyV3.LemmyHttp(instance.replace(/\/$/, ""), {
      headers: DEFAULT_HEADERS,
    });
    if (jwt) {
      this.setJwt(jwt);
    }
  }

  setJwt(jwt: string) {
    this.client.setHeaders({
      ...DEFAULT_HEADERS,
      Authorization: `Bearer ${jwt}`,
    });
  }

  async getSite(options: RequestOptions) {
    const site = await this.client.getSite(options);
    const me = site.my_user?.local_user_view.person;
    return {
      instance: this.instance,
      admins: site.admins.map((p) => convertPerson(p)),
      me: me ? convertPerson({ person: me }) : null,
      version: site.version,
      usersActiveDayCount: site.site_view.counts.users_active_day,
      usersActiveWeekCount: site.site_view.counts.users_active_week,
      usersActiveMonthCount: site.site_view.counts.users_active_month,
      usersActiveHalfYearCount: site.site_view.counts.users_active_half_year,
      postCount: site.site_view.counts.posts,
      commentCount: site.site_view.counts.comments,
      userCount: site.site_view.counts.users,
      sidebar: site.site_view.site.sidebar ?? null,
      icon: site.site_view.site.icon ?? null,
      title: site.site_view.site.name,
      moderates:
        site.my_user?.moderates.map(({ community }) =>
          convertCommunity({ community }),
        ) ?? null,
      follows:
        site.my_user?.follows.map(({ community }) =>
          convertCommunity({ community }),
        ) ?? null,
      personBlocks:
        site.my_user?.person_blocks.map((block) =>
          // @ts-expect-error
          convertPerson({ person: block.target }),
        ) ?? null,
      communityBlocks:
        site.my_user?.community_blocks.map((community) =>
          convertCommunity({ community }),
        ) ?? null,
      applicationQuestion:
        site.site_view.local_site.application_question ?? null,
    };
  }

  async getPost(form: { apId: string }, options: RequestOptions) {
    const { post_id } = await this.resolveObjectId(form.apId);
    if (_.isNil(post_id)) {
      throw new Error("post not found");
    }
    const fullPost = await this.client.getPost(
      {
        id: post_id,
      },
      options,
    );
    return {
      post: convertPost(fullPost.post_view),
      creator: convertPerson({ person: fullPost.post_view.creator }),
    };
  }

  async getPosts(form: Forms.GetPosts, options: RequestOptions) {
    const posts = await this.client.getPosts(
      {
        show_read: form.showRead,
        sort: form.sort as any,
        type_: form.type,
        page_cursor:
          form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        limit: this.limit,
        community_name: form.communitySlug,
        saved_only: form.savedOnly,
      },
      options,
    );
    return {
      nextCursor: posts.next_page ?? null,
      posts: posts.posts.map((p) => ({
        post: convertPost(p),
        creator: convertPerson({ person: p.creator }),
        /* community:  */
      })),
    };
  }

  async savePost(form: Forms.SavePost) {
    const { post_view } = await this.client.savePost({
      post_id: form.postId,
      save: form.save,
    });
    return convertPost(post_view);
  }

  async likePost(form: Forms.LikePost) {
    const { post_view } = await this.client.likePost({
      post_id: form.postId,
      score: form.score,
    });
    return convertPost(post_view);
  }

  async deletePost(form: Forms.DeletePost) {
    const { post_view } = await this.client.deletePost({
      post_id: form.postId,
      deleted: form.deleted,
    });
    return convertPost(post_view);
  }

  async featurePost(form: Forms.FeaturePost) {
    const { post_view } = await this.client.featurePost({
      post_id: form.postId,
      featured: form.featured,
      feature_type: form.featureType,
    });
    return convertPost(post_view);
  }

  async getPerson(form: Forms.GetPerson, options: RequestOptions) {
    const { person } = await this.client.resolveObject(
      {
        q: form.apId,
      },
      options,
    );

    if (!person) {
      throw new Error("person not found");
    }

    return convertPerson(person);
  }

  async getPersonContent(
    form: Forms.GetPersonContent,
    options: RequestOptions,
  ) {
    const { person_id } = await this.resolveObjectId(form.apId);

    if (_.isNil(person_id)) {
      throw new Error("person not found");
    }

    const { posts } = await this.client.getPersonDetails(
      {
        person_id,
        limit: this.limit,
        page:
          _.isUndefined(form.pageCursor) || form.pageCursor === INIT_PAGE_TOKEN
            ? 1
            : _.parseInt(form.pageCursor) + 1,
      },
      options,
    );

    const nextCursor =
      _.isUndefined(form.pageCursor) || form.pageCursor === INIT_PAGE_TOKEN
        ? 1
        : _.parseInt(form.pageCursor) + 1;
    const hasNextCursor = posts.length >= this.limit;

    return {
      posts: posts.map(convertPost),
      nextCursor: hasNextCursor ? String(nextCursor) : null,
    };
  }

  async search(form: Forms.Search, options: RequestOptions) {
    const cursor = cursorToInt(form.pageCursor) ?? 1;
    const { posts, communities, users } = await this.client.search(
      {
        q: form.q,
        page: cursor,
      },
      options,
    );
    const hasMorePosts = posts.length > this.limit;
    const hasMoreCommunities = communities.length > this.limit;
    const hasMoreUsers = users.length > this.limit;
    const nextCursor =
      hasMorePosts || hasMoreCommunities || hasMoreUsers
        ? `${cursor + 1}`
        : null;
    return {
      posts: posts.map(convertPost),
      communities: communities.map(convertCommunity),
      users: users.map(convertPerson),
      nextCursor,
    };
  }

  async getCommunity(form: Forms.GetCommunity, options: RequestOptions) {
    const { community_view, moderators } = await this.client.getCommunity(
      {
        name: form.slug,
      },
      options,
    );
    return {
      community: convertCommunity(community_view),
      mods: moderators.map((m) => convertPerson({ person: m.moderator })),
    };
  }

  async getCommunities(form: Forms.GetCommunities, options: RequestOptions) {
    const { communities } = await this.client.listCommunities(
      {
        sort: form.sort,
        type_: form.type,
        limit: this.limit,
        page:
          _.isUndefined(form.pageCursor) || form.pageCursor === INIT_PAGE_TOKEN
            ? 1
            : _.parseInt(form.pageCursor) + 1,
      },
      options,
    );

    const nextCursor =
      _.isUndefined(form.pageCursor) || form.pageCursor === INIT_PAGE_TOKEN
        ? 1
        : _.parseInt(form.pageCursor) + 1;
    const hasNextCursor = communities.length >= this.limit;

    return {
      communities: communities.map((communityView) =>
        convertCommunity(communityView),
      ),
      nextCursor: hasNextCursor ? String(nextCursor) : null,
    };
  }

  async followCommunity(form: Forms.FollowCommunity) {
    const { community_view } = await this.client.followCommunity({
      community_id: form.communityId,
      follow: form.follow,
    });
    return convertCommunity(community_view);
  }

  async editPost(form: Schemas.EditPost) {
    const { post_id } = await this.resolveObjectId(form.apId);

    if (_.isNil(post_id)) {
      throw new Error("post not found");
    }

    const { post_view } = await this.client.editPost({
      post_id,
      url: form.url ?? undefined,
      body: form.body ?? undefined,
      name: form.title,
      alt_text: form.altText,
      custom_thumbnail: form.thumbnailUrl ?? undefined,
    });

    return convertPost(post_view);
  }

  async logout() {
    const { success } = await this.client.logout();
    if (!success) {
      throw new Error("failed to logout");
    }
  }

  async getComments(form: Forms.GetComments, options: RequestOptions) {
    if (!form.postApId) {
      throw new Error("postApId required");
    }

    const { post_id } = await this.resolveObjectId(form.postApId);

    if (_.isNil(post_id)) {
      throw new Error("could not find post");
    }

    const { comments } = await this.client.getComments(
      {
        post_id,
        type_: "All",
        limit: this.limit,
        max_depth: 6,
        page:
          _.isUndefined(form.pageCursor) || form.pageCursor === INIT_PAGE_TOKEN
            ? 1
            : _.parseInt(form.pageCursor) + 1,
      },
      options,
    );

    const nextCursor =
      _.isUndefined(form.pageCursor) || form.pageCursor === INIT_PAGE_TOKEN
        ? 1
        : _.parseInt(form.pageCursor) + 1;
    const hasNextCursor = comments.length >= this.limit;

    return {
      comments: comments.map(convertComment),
      creators: comments.map(({ creator }) =>
        convertPerson({ person: creator }),
      ),
      nextCursor: hasNextCursor ? String(nextCursor) : null,
    };
  }

  async createComment({ postApId, body, parentId }: Forms.CreateComment) {
    const { post_id } = await this.resolveObjectId(postApId);

    if (_.isNil(post_id)) {
      throw new Error("could not find post");
    }

    const comment = await this.client.createComment({
      post_id,
      content: body,
      parent_id: parentId,
    });

    return convertComment(comment.comment_view);
  }

  async likeComment({ id, score }: Forms.LikeComment) {
    const { comment_view } = await this.client.likeComment({
      comment_id: id,
      score,
    });
    return convertComment(comment_view);
  }

  async deleteComment({ id, deleted }: Forms.DeleteComment) {
    const { comment_view } = await this.client.deleteComment({
      comment_id: id,
      deleted,
    });
    return convertComment(comment_view);
  }

  async editComment({ id, body }: Forms.EditComment) {
    const { comment_view } = await this.client.editComment({
      comment_id: id,
      content: body,
    });
    return convertComment(comment_view);
  }

  async login(form: Forms.Login): Promise<{ jwt: string }> {
    try {
      const { jwt } = await this.client.login({
        username_or_email: form.username,
        password: form.password,
        totp_2fa_token: form.mfaCode,
      });
      if (_.isNil(jwt)) {
        throw new Error("api did not return jwt");
      }
      this.setJwt(jwt);
      return { jwt };
    } catch (err) {
      if (_.isError(err) && is2faError(err)) {
        throw Errors.MFA_REQUIRED;
      }
      throw err;
    }
  }
}
