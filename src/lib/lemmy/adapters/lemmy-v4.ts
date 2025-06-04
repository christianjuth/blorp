import { env } from "@/src/env";
import * as lemmyV4 from "lemmy-v4";
import { ApiBlueprint, Forms, RequestOptions, Schemas } from "./api-blueprint";
import { createSlug } from "../utils";

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

function convertPerson(person: lemmyV4.Person): Schemas.Person {
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
}: lemmyV4.PostView): Schemas.Post {
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
      admins: site.admins.map((p) => convertPerson(p.person)),
      me: null,
      version: site.version,
      /* me: me ? convertPerson(me) : null, */
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

  async getPosts(form: Forms.GetPosts, options: RequestOptions) {
    const posts = await this.client.getPosts(
      {
        show_read: form.showRead,
        sort: form.sort as any,
        type_: form.type,
        page_cursor: form.pageCursor,
        limit: this.limit,
        community_name: form.communitySlug,
      },
      options,
    );

    return {
      nextCursor: posts.next_page ?? null,
      data: posts.posts.map((p) => ({
        post: convertPost(p),
        creator: convertPerson(p.creator),
      })),
    };
  }

  //async getPersonContent(
  //  form: Forms.GetPersonContent,
  //  options: RequestOptions,
  //) {
  //  const { person } = await this.client.resolveObject(
  //    {
  //      q: form.apId,
  //    },
  //    options,
  //  );
  //
  //  if (!person) {
  //    throw new Error("person not found");
  //  }
  //
  //  const p = await this.client.getPersonDetails(
  //    {
  //      person_id: person.person.id,
  //      limit: this.limit,
  //      page: form.pageCursor ? _.parseInt(form.pageCursor) : undefined,
  //    },
  //    options,
  //  );
  //
  //  return {
  //    posts: posts.map(convertPost),
  //    nextCursor: form.pageCursor ? `${_.parseInt(form.pageCursor) + 1}` : "2",
  //  };
  //}
}
