import { env } from "@/src/env";
import * as lemmyV3 from "lemmy-v3";
import {
  ApiBlueprint,
  Schemas,
  RequestOptions,
  Forms,
  INIT_PAGE_TOKEN,
} from "./api-blueprint";
import { createSlug } from "../utils";
import _ from "lodash";

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
  communityView: lemmyV3.CommunityView,
): Schemas.Community {
  return {
    createdAt: communityView.community.published,
    id: communityView.community.id,
    apId: communityView.community.actor_id,
    slug: createSlug(communityView.community, true).slug,
    icon: communityView.community.icon ?? null,
    banner: communityView.community.banner ?? null,
    description: communityView.community.description ?? null,
    usersActiveDayCount: communityView.counts.users_active_day,
    usersActiveWeekCount: communityView.counts.users_active_week,
    usersActiveMonthCount: communityView.counts.users_active_month,
    usersActiveHalfYearCount: communityView.counts.users_active_half_year,
    postCount: communityView.counts.posts,
    commentCount: communityView.counts.posts,
    subscriberCount: communityView.counts.subscribers,
    subscribersLocalCount: communityView.counts.subscribers_local,
    subscribed:
      communityView.subscribed === "ApprovalRequired"
        ? "Pending"
        : communityView.subscribed,
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
    slug: createSlug(person, true).slug,
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
    creatorSlug: createSlug(post, true).slug,
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
    communitySlug: createSlug(community, true).slug,
    communityApId: community.actor_id,
    creatorApId: creator.actor_id,
    crossPosts: [],
    featuredCommunity: post.featured_community,
    featuredLocal: post.featured_local,
    read: postView.read,
    saved: postView.saved,
  };
}

export class LemmyV3Api implements ApiBlueprint<lemmyV3.LemmyHttp> {
  client: lemmyV3.LemmyHttp;
  instance: string;
  limit = 50;

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
    };
  }

  async getPost(form: { apId: string }, options: RequestOptions) {
    const { post } = await this.client.resolveObject(
      {
        q: form.apId,
      },
      options,
    );
    if (!post) {
      throw new Error("post not found");
    }
    const fullPost = await this.client.getPost(
      {
        id: post.post.id,
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
    const { person } = await this.client.resolveObject(
      {
        q: form.apId,
      },
      options,
    );

    if (!person) {
      throw new Error("person not found");
    }

    const { posts } = await this.client.getPersonDetails(
      {
        person_id: person.person.id,
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
    const hasNextCursor = posts.length > this.limit;

    return {
      posts: posts.map(convertPost),
      nextCursor: hasNextCursor ? String(nextCursor) : null,
    };
  }

  async search(form: Forms.Search, options: RequestOptions) {
    const cursor = cursorToInt(form.pageCursor) ?? 1;
    const { posts } = await this.client.search(
      {
        q: form.q,
        page: cursor,
      },
      options,
    );
    const nextCursor = posts.length > this.limit ? `${cursor + 1}` : null;
    return {
      posts: posts.map(convertPost),
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
}
