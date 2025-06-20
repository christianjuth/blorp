import dayjs from "dayjs";
import utcPlugin from "dayjs/plugin/utc";
import { Schemas } from "@/src/lib/lemmy/adapters/api-blueprint";
import { createSlug } from "@/src/lib/lemmy/utils";
import _ from "lodash";
import { PartialDeep } from "type-fest";
import { faker } from "@faker-js/faker";

dayjs.extend(utcPlugin);

const API_ROOT = "https://blorpblorp.xyz";
const HOST = new URL(API_ROOT).host;
const POST_ID = 0;
const PERSON_ID = 0;
const COMMUNITY_ID = 0;

const BODY_TEXT_PARAGRAPH =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const BODY_TEXT = _.repeat(BODY_TEXT_PARAGRAPH + "\n\n", 3);
const COMMUNITY_DESCRIPTION = _.repeat(BODY_TEXT_PARAGRAPH + "\n\n", 2);

export const randomDbId = () => _.random(2000, 200000);

const absoluteTime = () =>
  dayjs(1738299372085)
    .utc()
    .subtract(1, "hour")
    .format("YYYY-MM-DDTHH:mm:ss.SSS[000]Z");

const relativeTime = () =>
  dayjs().utc().subtract(1, "hour").format("YYYY-MM-DDTHH:mm:ss.SSS[000]Z");

export function getPerson(): Schemas.Person {
  return {
    createdAt: relativeTime(),
    id: PERSON_ID,
    apId: `${API_ROOT}/u/${PERSON_ID}`,
    avatar: null,
    slug: "",
    matrixUserId: null,
    bio: "This is me",
    deleted: false,
    isBot: false,
    postCount: 100,
    commentCount: 2000,
  };
}

export function getPost(config?: {
  variant?: "youtube" | "image" | "article" | "text";
  post?: Partial<Schemas.Post>;
  /* postView?: PartialDeep<Omit<PostView, "image_details">>; */
  /* personView?: PartialDeep<PersonView>; */
}): {
  post: Schemas.Post;
  creator: Schemas.Person;
} {
  const creator = getPerson();
  const creatorSlug = createSlug(creator, true).slug;

  const postId = config?.post?.id ?? POST_ID;

  const post: Schemas.Post = {
    createdAt: relativeTime(),
    id: postId,
    apId: `${API_ROOT}/post/${postId}`,
    title: "This is a test post",
    body: BODY_TEXT,
    upvotes: 10,
    downvotes: 2,
    commentsCount: 4,
    deleted: false,
    saved: false,
    creatorSlug,
    creatorId: creator.id,
    creatorApId: creator.apId,
    communitySlug: "",
    communityApId: "",
    thumbnailUrl: null,
    thumbnailAspectRatio: null,
    url: null,
    urlContentType: null,
    removed: false,
    crossPosts: [],
    featuredCommunity: false,
    featuredLocal: false,
    read: false,
    ...config?.post,
  };

  switch (config?.variant) {
    case "text": {
      post.body = BODY_TEXT;
      break;
    }
    case "image": {
      const height = 200;
      const width = 300;
      post.thumbnailAspectRatio = width / height;
      const imgUrl = `https://picsum.photos/id/10/${width}/${height}`;
      post.thumbnailUrl = imgUrl;
      post.urlContentType = "image/jpeg";
      break;
    }
    case "article": {
      const height = 200;
      const width = 300;
      post.thumbnailAspectRatio = width / height;
      const imgUrl = `https://picsum.photos/id/10/${width}/${height}`;
      post.thumbnailUrl = imgUrl;
      post.urlContentType = "text/html";
      post.url = "https://react.dev/blog/2024/12/05/react-19";
      break;
    }
    case "youtube": {
      post.url = "https://www.youtube.com/watch?v=LDU_Txk06tM";
      break;
    }
  }

  return {
    creator,
    post,
  };
}

export function getCommunity(
  overrides?: Partial<Schemas.Community>,
): Schemas.Community {
  const communityId = overrides?.id ?? COMMUNITY_ID;
  return {
    createdAt: relativeTime(),
    id: communityId,
    apId: `${API_ROOT}/c/${communityId}`,
    slug: `${COMMUNITY_ID}@${HOST}`,
    subscriberCount: 562,
    subscribersLocalCount: 432,
    postCount: 753,
    commentCount: 1324,
    usersActiveDayCount: 34,
    usersActiveWeekCount: 73,
    usersActiveMonthCount: 235,
    usersActiveHalfYearCount: 426,
    banner: `https://picsum.photos/id/11/800/200`,
    icon: `https://picsum.photos/id/12/200/200`,
    subscribed: "NotSubscribed",
    description: COMMUNITY_DESCRIPTION,
  };
}
