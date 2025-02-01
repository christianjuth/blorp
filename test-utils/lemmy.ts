import dayjs from "dayjs";
import utcPlugin from "dayjs/plugin/utc";
import _ from "lodash";
import {
  PostView,
  PersonView,
  CommunityView,
  ImageDetails,
} from "lemmy-js-client";

dayjs.extend(utcPlugin);

const uuid = () => _.random(2000, 200000);

const absoluteTime = () =>
  dayjs(1738299372085)
    .utc()
    .subtract(1, "hour")
    .format("YYYY-MM-DDTHH:mm:ss.SSS[000]Z");

const relativeTime = () =>
  dayjs().utc().subtract(1, "hour").format("YYYY-MM-DDTHH:mm:ss.SSS[000]Z");

const API_ROOT = "https://lemmy.world";

const POST_ID = uuid();
const POST_PUBLISHED = relativeTime();

const COMMUNITY_ID = uuid();
const COMMUNITY_PUBLISHED = absoluteTime();

const PERSON_ID = uuid();
const PERSON_PUBLISHED = relativeTime();

export function getPerson() {
  const person: PersonView = {
    person: {
      id: PERSON_ID,
      name: "Jon Doe",
      banned: false,
      published: PERSON_PUBLISHED,
      updated: PERSON_PUBLISHED,
      actor_id: API_ROOT + "/u/BrikoX",
      local: true,
      deleted: false,
      bot_account: false,
      instance_id: 1,
    },
    counts: {
      person_id: PERSON_ID,
      post_count: 10,
      comment_count: 33,
    },
    is_admin: false,
  };

  return person;
}

export function getCommunity() {
  const view: CommunityView = {
    community: {
      id: COMMUNITY_ID,
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
    },
    subscribed: "NotSubscribed",
    blocked: false,
    counts: {
      community_id: COMMUNITY_ID,
      subscribers: 562,
      subscribers_local: 432,
      posts: 753,
      comments: 1324,
      published: COMMUNITY_PUBLISHED,
      users_active_day: 34,
      users_active_week: 73,
      users_active_month: 235,
      users_active_half_year: 426,
    },
    banned_from_community: false,
  };

  return view;
}

export function getPost(config?: { variant: "youtube" | "image" | "article" }) {
  const creator = getPerson();
  const community = getCommunity();

  const view: PostView = {
    post: {
      id: POST_ID,
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
    },
    counts: {
      comments: 4,
      upvotes: 10,
      downvotes: 2,
      score: 8,
      published: POST_PUBLISHED,
      post_id: POST_ID,
      newest_comment_time: absoluteTime(),
      report_count: 0,
      unresolved_report_count: 0,
    },
    community: community.community,
    creator: creator.person,
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
  };

  switch (config?.variant) {
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
