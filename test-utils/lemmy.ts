import dayjs from "dayjs";
import utcPlugin from "dayjs/plugin/utc";
import _ from "lodash";
import {
  PostView,
  PersonView,
  CommunityView,
  ImageDetails,
  CommentView,
} from "lemmy-js-client";
import { PartialDeep } from "type-fest";
import { faker } from "@faker-js/faker";

dayjs.extend(utcPlugin);

const uuid = () => _.random(2000, 200000);

const absoluteTime = () =>
  dayjs(1738299372085)
    .utc()
    .subtract(1, "hour")
    .format("YYYY-MM-DDTHH:mm:ss.SSS[000]Z");

const relativeTime = () =>
  dayjs().utc().subtract(1, "hour").format("YYYY-MM-DDTHH:mm:ss.SSS[000]Z");

const BODY_TEXT_PARAGRAPH =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const BODY_TEXT = _.repeat(BODY_TEXT_PARAGRAPH + "\n\n", 3);

const API_ROOT = "https://blorpblorp.xyz";

const POST_ID = uuid();
const POST_PUBLISHED = relativeTime();

const COMMUNITY_ID = uuid();
const COMMUNITY_PUBLISHED = absoluteTime();

const PERSON_ID = uuid();
const PERSON_PUBLISHED = relativeTime();

const COMMENT_ID = uuid();
const COMMENT_PUBLISHED = relativeTime();

export function getPerson(config?: { personView?: PartialDeep<PersonView> }) {
  const id = config?.personView?.person?.id ?? PERSON_ID;
  const person: PersonView = {
    is_admin: false,
    ...config?.personView,
    person: {
      name: "Jon Doe",
      banned: false,
      published: PERSON_PUBLISHED,
      updated: PERSON_PUBLISHED,
      actor_id: API_ROOT + "/u/BrikoX",
      local: true,
      deleted: false,
      bot_account: false,
      instance_id: 1,
      ...config?.personView?.person,
      id,
    },
    counts: {
      post_count: 10,
      comment_count: 33,
      ...config?.personView?.counts,
      person_id: id,
    },
  };

  return person;
}

export function getCommunity(config?: {
  communityView?: PartialDeep<CommunityView>;
}) {
  const id = config?.communityView?.community?.id ?? COMMUNITY_ID;
  const view: CommunityView = {
    subscribed: "NotSubscribed",
    blocked: false,
    banned_from_community: false,
    ...config?.communityView,
    community: {
      published: COMMUNITY_PUBLISHED,
      name: "memes",
      title: "Memes",
      removed: false,
      deleted: false,
      nsfw: false,
      actor_id: API_ROOT + "/c/memes",
      hidden: false,
      local: true,
      posting_restricted_to_mods: false,
      instance_id: 1,
      visibility: "Public",
      banner: `https://picsum.photos/id/11/800/200`,
      icon: `https://picsum.photos/id/12/200/200`,
      ...config?.communityView?.community,
      id,
    },
    counts: {
      subscribers: 562,
      subscribers_local: 432,
      posts: 753,
      comments: 1324,
      published: COMMUNITY_PUBLISHED,
      users_active_day: 34,
      users_active_week: 73,
      users_active_month: 235,
      users_active_half_year: 426,
      ...config?.communityView?.counts,
      community_id: id,
    },
  };

  return view;
}

export function getRandomCommunity() {
  const title = faker.lorem.words(3);
  const name = title.replaceAll(" ", "-");
  return getCommunity({
    communityView: {
      community: {
        id: uuid(),
        title,
        name,
        actor_id: `${API_ROOT}/c/${name}`,
        published: relativeTime(),
        updated: undefined,
      },
    },
  });
}

export function getPost(config?: {
  variant: "youtube" | "image" | "article" | "text";
  postView?: PartialDeep<Omit<PostView, "image_details">>;
  personView?: PartialDeep<PersonView>;
}) {
  const creator = getPerson({
    personView: config?.personView,
  });
  const community = getCommunity({
    communityView: {
      community: config?.postView?.community,
    },
  });

  const id = config?.postView?.post?.id ?? POST_ID;

  const view: PostView = {
    creator_banned_from_community: false,
    creator_is_admin: false,
    creator_is_moderator: false,
    creator_blocked: false,
    banned_from_community: false,
    saved: false,
    read: false,
    hidden: false,
    subscribed: "NotSubscribed",
    unread_comments: 0,
    ...config?.postView,
    community: community.community,
    creator: creator.person,
    post: {
      published: POST_PUBLISHED,
      name: "This is a test post",
      creator_id: PERSON_ID,
      community_id: community.community.id,
      removed: false,
      local: true,
      locked: false,
      deleted: false,
      nsfw: false,
      ap_id: API_ROOT + "/post/24819939",
      language_id: 37,
      featured_community: false,
      featured_local: false,
      ...config?.postView?.post,
      id,
    },
    counts: {
      comments: 4,
      upvotes: 10,
      downvotes: 2,
      score: 8,
      published: POST_PUBLISHED,
      newest_comment_time: absoluteTime(),
      ...config?.postView?.counts,
      post_id: id,
    },
  };

  switch (config?.variant) {
    case "text": {
      view.post.body = BODY_TEXT;
      break;
    }
    case "image": {
      const imageDetails: ImageDetails = view.image_details ?? {
        height: 200,
        width: 300,
        link: "",
        content_type: "image/jpeg",
      };
      const imgUrl = `https://picsum.photos/id/10/${imageDetails.width}/${imageDetails.height}`;
      imageDetails.link = imgUrl;
      view.image_details = imageDetails;
      view.post.thumbnail_url = imgUrl;
      view.post.url_content_type = imageDetails.content_type;
      break;
    }
    case "article": {
      const imageDetails: ImageDetails = view.image_details ?? {
        height: 200,
        width: 300,
        link: "",
        content_type: "image/jpeg",
      };
      const imgUrl = `https://picsum.photos/id/10/${imageDetails.width}/${imageDetails.height}`;
      imageDetails.link = imgUrl;
      view.image_details = imageDetails;
      view.post.thumbnail_url = imgUrl;
      view.post.url_content_type = "text/html";
      view.post.url = "https://react.dev/blog/2024/12/05/react-19";
      break;
    }
    case "youtube": {
      view.post.url = "https://www.youtube.com/watch?v=LDU_Txk06tM";
      break;
    }
  }

  view.counts.score = view.counts.upvotes - view.counts.downvotes;
  return view;
}

export function getRandomPost() {
  return getPost({
    variant: _.sample(["youtube", "image", "article"]),
    postView: {
      post: {
        id: uuid(),
        name: faker.lorem.words(8),
        ap_id: `${API_ROOT}/post/${uuid()}`,
      },
    },
  });
}

export function getComment(config?: {
  commentView?: PartialDeep<CommentView>;
  postView?: PartialDeep<Omit<PostView, "image_details">>;
  personView?: PartialDeep<PersonView>;
}): CommentView {
  const post = getPost({
    variant: "text",
    postView: config?.postView,
  });

  const creator = getPerson({
    personView: config?.personView,
  });
  const community = getCommunity({
    communityView: {
      community: config?.postView?.community,
    },
  });

  const id = config?.commentView?.comment?.id ?? COMMENT_ID;

  return {
    post: post.post,
    creator: creator.person,
    community: community.community,
    creator_banned_from_community: false,
    creator_is_moderator: false,
    creator_is_admin: false,
    saved: false,
    banned_from_community: false,
    subscribed: "NotSubscribed",
    creator_blocked: false,
    comment: {
      ap_id: `${API_ROOT}/comment/${id}`,
      id,
      creator_id: creator.person.id,
      post_id: post.post.id,
      content: "123",
      removed: false,
      deleted: false,
      published: COMMENT_PUBLISHED,
      local: true,
      path: `0.${id}`,
      distinguished: false,
      language_id: 0,
      ...config?.commentView?.comment,
    },
    counts: {
      comment_id: id,
      score: 1,
      upvotes: 1,
      downvotes: 0,
      published: COMMENT_PUBLISHED,
      child_count: 0,
      ...config?.commentView?.counts,
    },
  };
}
