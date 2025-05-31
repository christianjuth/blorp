import { env } from "@/src/env";
import * as lemmyV4 from "lemmy-v4";
import { ApiAdapter, RequestOptions, Schemas } from "./adapter";
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

function convertPost(post: lemmyV4.Post): Schemas.Post {
  return {
    apId: post.ap_id,
    title: post.name,
    body: post.body ?? null,
    thumbnail: post.thumbnail_url ?? null,
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    commentsCount: post.comments,
    isDeleted: post.deleted,
    isRemoved: post.removed,
  };
}

export class LemmyV4Api implements ApiAdapter<lemmyV4.LemmyHttp> {
  client: lemmyV4.LemmyHttp;
  instance: string;
  limit = 50;

  constructor({ instance }: { instance: string }) {
    this.instance = instance;
    this.client = new lemmyV4.LemmyHttp(instance.replace(/\/$/, ""), {
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
    return convertPost(fullPost.post_view.post);
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
      data: posts.posts.map((p) => convertPost(p.post)),
    };
  }
}
