import { env } from "@/src/env";
import * as lemmyV4 from "lemmy-v4";
import {
  ApiBlueprint,
  Errors,
  Forms,
  INIT_PAGE_TOKEN,
  RequestOptions,
  Schemas,
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
  const client = new lemmyV4.LemmyHttp(instance.replace(/\/$/, ""), {
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

function convertCommunity(
  communityView: lemmyV4.CommunityView,
): Schemas.Community {
  const { community } = communityView;
  return {
    createdAt: communityView.community.published_at,
    id: communityView.community.id,
    apId: communityView.community.ap_id,
    slug: createSlug({ apId: community.ap_id, name: community.name }).slug,
    icon: communityView.community.icon ?? null,
    banner: communityView.community.banner ?? null,
    description: communityView.community.description ?? null,
    usersActiveDayCount: communityView.community.users_active_day,
    usersActiveWeekCount: communityView.community.users_active_week,
    usersActiveMonthCount: communityView.community.users_active_month,
    usersActiveHalfYearCount: communityView.community.users_active_half_year,
    postCount: communityView.community.posts,
    commentCount: communityView.community.comments,
    subscriberCount: communityView.community.subscribers,
    subscribersLocalCount: communityView.community.subscribers_local,
    subscribed: (() => {
      switch (communityView.community_actions?.follow_state) {
        case "Pending":
        case "ApprovalRequired":
          return "Pending";
        case "Accepted":
          return "Subscribed";
      }
      return "NotSubscribed";
    })(),
  };
}

function convertPerson({
  person,
}: lemmyV4.PersonView | { person: lemmyV4.Person }): Schemas.Person {
  return {
    id: person.id,
    apId: person.ap_id,
    avatar: person.avatar ?? null,
    bio: person.bio ?? null,
    matrixUserId: person.matrix_user_id ?? null,
    slug: createSlug({ apId: person.ap_id, name: person.name }).slug,
    deleted: person.deleted,
    createdAt: person.published_at,
    isBot: person.bot_account,
    postCount: person.post_count ?? null,
    commentCount: person?.comment_count ?? null,
  };
}

function convertPost({
  post,
  community,
  creator,
  post_actions,
}: Pick<
  lemmyV4.PostView,
  "post" | "community" | "creator" | "post_actions"
>): Schemas.Post {
  return {
    id: post.id,
    createdAt: post.published_at,
    apId: post.ap_id,
    title: post.name,
    body: post.body ?? null,
    thumbnailUrl: post.thumbnail_url ?? null,
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    commentsCount: post.comments,
    deleted: post.deleted,
    removed: post.removed,
    communityApId: community.ap_id,
    communitySlug: createSlug({ apId: community.ap_id, name: community.name })
      .slug,
    creatorId: creator.id,
    creatorApId: creator.ap_id,
    creatorSlug: createSlug({ apId: creator.ap_id, name: creator.name }).slug,
    thumbnailAspectRatio: null,
    url: post.url ?? null,
    urlContentType: post.url_content_type ?? null,
    crossPosts: [],
    featuredCommunity: post.featured_community,
    featuredLocal: post.featured_local,
    read: !!post_actions?.read_at,
    saved: !!post_actions?.saved_at,
    nsfw: post.nsfw,
  };
}
function convertComment(commentView: lemmyV4.CommentView): Schemas.Comment {
  const { post, creator, comment, community } = commentView;
  return {
    createdAt: comment.published_at,
    id: comment.id,
    apId: comment.ap_id,
    body: comment.content,
    creatorId: creator.id,
    creatorApId: creator.ap_id,
    creatorSlug: createSlug({ apId: creator.ap_id, name: creator.name }).slug,
    path: comment.path,
    downvotes: comment.downvotes,
    upvotes: comment.upvotes,
    postId: post.id,
    postApId: post.ap_id,
    removed: comment.removed,
    deleted: comment.deleted,
    communitySlug: createSlug({ apId: community.ap_id, name: community.name })
      .slug,
    communityApId: community.ap_id,
    postTitle: post.name,
    myVote: commentView.comment_actions?.like_score ?? null,
  };
}

export class LemmyV4Api implements ApiBlueprint<lemmyV4.LemmyHttp> {
  client: lemmyV4.LemmyHttp;
  instance: string;
  limit = 50;

  private resolveObjectId = _.memoize(
    async (apId: string) => {
      // @ts-expect-error
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
    this.client = new lemmyV4.LemmyHttp(instance.replace(/\/$/, ""), {
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
    // TODO: uncomment once the below is implemented
    // const account = await this.client.getAccount();
    return {
      instance: this.instance,
      admins: site.admins.map((p) => convertPerson(p)),
      me: null,
      version: site.version,
      /* me: me ? convertPerson(me) : null, */
      moderates: [],
      follows: [],
      communityBlocks: [],
      personBlocks: [],
      usersActiveDayCount: site.site_view.local_site.users_active_day,
      usersActiveWeekCount: site.site_view.local_site.users_active_week,
      usersActiveMonthCount: site.site_view.local_site.users_active_month,
      usersActiveHalfYearCount:
        site.site_view.local_site.users_active_half_year,
      postCount: site.site_view.local_site.posts,
      commentCount: site.site_view.local_site.comments,
      userCount: site.site_view.local_site.users,
      sidebar: site.site_view.site.sidebar ?? null,
      icon: site.site_view.site.icon ?? null,
      title: site.site_view.site.name,
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
      feature_type: form.featureType,
      featured: form.featured,
    });
    return convertPost(post_view);
  }

  async getPerson(form: Forms.GetPerson, options: RequestOptions) {
    // @ts-expect-error
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

    const content = await this.client.listPersonContent(
      {
        person_id,
        limit: this.limit,
        page_cursor:
          form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
        type_: form.type,
      },
      options,
    );

    const posts = content.content
      .filter((c) => c.type_ === "Post")
      .map((c) => convertPost(c));

    const comments = content.content
      .filter((c) => c.type_ === "Comment")
      .map((c) => convertComment(c));

    return {
      posts,
      comments,
      nextCursor: content.next_page ?? null,
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
      },
      options,
    );

    return {
      nextCursor: posts.next_page ?? null,
      posts: posts.posts.map((p) => ({
        post: convertPost(p),
        creator: convertPerson({ person: p.creator }),
      })),
    };
  }

  async search(form: Forms.Search, options: RequestOptions) {
    const { results, next_page } = await this.client.search(
      {
        q: form.q,
        page_cursor:
          form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
      },
      options,
    );
    const posts = results.filter((r) => r.type_ === "Post");
    const communities = results.filter((r) => r.type_ === "Community");
    const users = results.filter((r) => r.type_ === "Person");
    return {
      posts: posts.map(convertPost),
      communities: communities.map(convertCommunity),
      users: users.map(convertPerson),
      nextCursor: next_page ?? null,
    };
  }

  async getCommunity(form: Forms.GetCommunity, options?: RequestOptions) {
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
    const { communities, next_page } = await this.client.listCommunities(
      {
        sort: form.sort,
        type_: form.type,
        page_cursor:
          form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
      },
      options,
    );

    return {
      communities: communities.map(convertCommunity),
      nextCursor: next_page ?? null,
    };
  }

  async followCommunity(form: Forms.FollowCommunity) {
    const { community_view } = await this.client.followCommunity({
      community_id: form.communityId,
      follow: form.follow,
    });
    return convertCommunity(community_view);
  }

  async editPost(form: Forms.EditPost) {
    const { post_id } = await this.resolveObjectId(form.apId);

    if (_.isNil(post_id)) {
      throw new Error("couldn't find post");
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

    const { comments, next_page } = await this.client.getComments(
      {
        post_id,
        type_: "All",
        limit: this.limit,
        max_depth: 6,
        page_cursor:
          form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
      },
      options,
    );

    return {
      comments: comments.map(convertComment),
      creators: comments.map(({ creator }) =>
        convertPerson({ person: creator }),
      ),
      nextCursor: next_page ?? null,
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

  async markPostRead(form: Forms.MarkPostRead) {
    const [firstPost] = form.postIds;
    if (form.postIds.length === 1 && firstPost) {
      await this.client.markPostAsRead({
        post_id: firstPost,
        read: form.read,
      });
    } else {
      if (form.read === false) {
        throw new Error("cant bulk mark multiple posts as unread");
      }
      await this.client.markManyPostAsRead({
        post_ids: form.postIds,
      });
    }
  }

  async login(form: Forms.Login) {
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

  async getPrivateMessages(
    form: Forms.GetPrivateMessages,
    options: RequestOptions,
  ) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async createPrivateMessage(
    form: Forms.CreatePrivateMessage,
  ): Promise<Schemas.PrivateMessage> {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async markPrivateMessageRead(form: Forms.MarkPrivateMessageRead) {
    await this.client.markPrivateMessageAsRead({
      private_message_id: form.id,
      read: form.read,
    });
  }

  async getReplies(form: Forms.GetReplies, options: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async getMentions(form: Forms.GetReplies, options: RequestOptions) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async markReplyRead(form: Forms.MarkReplyRead) {
    await this.client.markCommentReplyAsRead({
      comment_reply_id: form.id,
      read: form.read,
    });
  }

  async markMentionRead(form: Forms.MarkMentionRead) {
    throw Errors.NOT_IMPLEMENTED;
    return {} as any;
  }

  async createPost(form: Forms.CreatePost) {
    const community = await this.getCommunity({
      slug: form.communitySlug,
    });

    const { post_view } = await this.client.createPost({
      alt_text: form.altText,
      body: form.body ?? undefined,
      community_id: community.community.id,
      custom_thumbnail: form.thumbnailUrl ?? undefined,
      name: form.title,
      nsfw: form.nsfw ?? undefined,
      url: form.url ?? undefined,
    });

    return convertPost(post_view);
  }

  async createPostReport(form: Forms.CreatePostReport) {
    await this.client.createPostReport({
      post_id: form.postId,
      reason: form.reason,
    });
  }

  async createCommentReport(form: Forms.CreateCommentReport) {
    await this.client.createCommentReport({
      comment_id: form.commentId,
      reason: form.reason,
    });
  }

  async blockPerson(form: Forms.BlockPerson): Promise<void> {
    await this.client.blockPerson({
      person_id: form.personId,
      block: form.block,
    });
  }

  async blockCommunity(form: Forms.BlockCommunity): Promise<void> {
    await this.client.blockCommunity({
      community_id: form.communityId,
      block: form.block,
    });
  }

  async uploadImage(form: Forms.UploadImage) {
    const res = await this.client.uploadImage(form);
    const fileId = res.filename;
    if (!res.image_url && fileId) {
      res.image_url = `${this.instance}/pictrs/image/${fileId}`;
    }
    return { url: res.image_url };
  }

  async getCaptcha(options: RequestOptions) {
    const { ok } = await this.client.getCaptcha(options);
    if (!ok) {
      throw new Error("couldn't get captcha");
    }
    return {
      uuid: ok.uuid,
      audioUrl: ok.wav,
      imgUrl: ok.png,
    };
  }

  async register(form: Forms.Register) {
    const { jwt, registration_created, verify_email_sent } =
      await this.client.register({
        username: form.username,
        password: form.password,
        password_verify: form.repeatPassword,
        show_nsfw: form.showNsfw,
        email: form.email,
        captcha_uuid: form.captchaUuid,
        captcha_answer: form.captchaAnswer,
        answer: form.answer,
      });
    return {
      jwt: jwt ?? null,
      registrationCreated: registration_created,
      verifyEmailSent: verify_email_sent,
    };
  }
}
