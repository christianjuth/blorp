import { env } from "@/src/env";
import * as lemmyV4 from "lemmy-v4";
import {
  ApiBlueprint,
  Forms,
  INIT_PAGE_TOKEN,
  RequestOptions,
  Schemas,
} from "./api-blueprint";
import { createSlug } from "../utils";
import _ from "lodash";

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

function convertCommunity(community: lemmyV4.CommunityView): Schemas.Community {
  return {
    createdAt: community.community.published,
    id: community.community.id,
    apId: community.community.ap_id,
    slug: createSlug(community.community, true).slug,
    icon: community.community.icon ?? null,
    banner: community.community.banner ?? null,
    description: community.community.description ?? null,
    usersActiveDayCount: community.community.users_active_day,
    usersActiveWeekCount: community.community.users_active_week,
    usersActiveMonthCount: community.community.users_active_month,
    usersActiveHalfYearCount: community.community.users_active_half_year,
    postCount: community.community.posts,
    commentCount: community.community.comments,
    subscriberCount: community.community.subscribers,
    subscribersLocalCount: community.community.subscribers_local,
    subscribed: (() => {
      switch (community.community_actions?.follow_state) {
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
    slug: createSlug(person, true).slug,
    deleted: person.deleted,
    createdAt: person.published,
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
    createdAt: post.published,
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
    communitySlug: createSlug(community, true).slug,
    creatorId: creator.id,
    creatorApId: creator.ap_id,
    creatorSlug: createSlug(creator, true).slug,
    thumbnailAspectRatio: null,
    url: post.url ?? null,
    urlContentType: post.url_content_type ?? null,
    crossPosts: [],
    featuredCommunity: post.featured_community,
    featuredLocal: post.featured_local,
    read: !!post_actions?.read,
    saved: !!post_actions?.saved,
  };
}

export class LemmyV4Api implements ApiBlueprint<lemmyV4.LemmyHttp> {
  client: lemmyV4.LemmyHttp;
  instance: string;
  limit = 50;

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

    const content = await this.client.listPersonContent(
      {
        person_id: person.person.id,
        limit: this.limit,
        page_cursor:
          form.pageCursor === INIT_PAGE_TOKEN ? undefined : form.pageCursor,
      },
      options,
    );

    const posts = content.content
      .filter((c) => c.type_ === "Post")
      .map((c) => convertPost(c));

    return {
      posts,
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
}
