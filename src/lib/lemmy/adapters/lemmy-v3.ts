import { env } from "@/src/env";
import * as lemmyV3 from "lemmy-v3";
import { ApiAdapter, Schemas, RequestOptions } from "./adapter";
import { createSlug } from "../utils";

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

function convertPerson(
  person: lemmyV3.Person,
  aggregates?: lemmyV3.PersonAggregates,
): Schemas.Person {
  return {
    apId: person.actor_id,
    avatar: person.avatar ?? null,
    bio: person.bio ?? null,
    matrixUserId: person.matrix_user_id ?? null,
    slug: createSlug(person, true).slug,
    deleted: person.deleted,
    createdAt: person.published,
    isBot: person.bot_account,
    postCount: aggregates?.post_count ?? null,
    commentCount: aggregates?.comment_count ?? null,
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
    optimisticDeleted: null,
    removed: post.removed,
    optimisticRemoved: null,
    thumbnailAspectRatio: null,
    communitySlug: createSlug(community, true).slug,
    creatorApId: creator.actor_id,
    crossPosts: [],
    featuredCommunity: post.featured_community,
    optimisticFeaturedCommunity: null,
    featuredLocal: post.featured_local,
    optimisticFeaturedLocal: null,
    read: postView.read,
    optimisticRead: null,
    saved: postView.saved,
    optimisticSaved: null,
  };
}

export class LemmyV3Api implements ApiAdapter<lemmyV3.LemmyHttp> {
  client: lemmyV3.LemmyHttp;
  instance: string;
  limit = 50;

  constructor({ instance }: { instance: string }) {
    this.instance = instance;
    this.client = new lemmyV3.LemmyHttp(instance.replace(/\/$/, ""), {
      headers: DEFAULT_HEADERS,
    });
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
      admins: site.admins.map((p) => convertPerson(p.person, p.counts)),
      me: me ? convertPerson(me) : null,
      version: site.version,
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
      creator: convertPerson(fullPost.post_view.creator),
    };
  }

  async getPosts(
    form: {
      showRead: boolean;
      sort: string;
      pageCursor?: string;
    },
    options: RequestOptions,
  ) {
    const posts = await this.client.getPosts(
      {
        show_read: form.showRead,
        sort: form.sort as any,
        page_cursor: form.pageCursor,
        limit: this.limit,
      },
      options,
    );
    return {
      nextCursor: posts.next_page ?? null,
      data: posts.posts.map((p) => ({
        post: convertPost(p),
        creator: convertPerson(p.creator),
        /* community:  */
      })),
    };
  }
}
