/**
 * These utils convert PieFed responses into
 * Lemmy friendly data.
 */

import type {
  CommunityAggregates,
  CommunityView,
  Person,
  PersonAggregates,
  Comment,
} from "lemmy-js-client";
import _ from "lodash";
import type { FlattenedComment } from "./index";

function communityAggregatesCompat<
  C extends CommunityAggregates | undefined | null,
>(counts: C): C {
  if (!counts) {
    return counts;
  }
  if ("post_count" in counts && _.isNumber(counts.post_count)) {
    counts.posts ??= counts.post_count;
  }
  if ("post_reply_count" in counts && _.isNumber(counts.post_reply_count)) {
    counts.comments ??= counts.post_reply_count;
  }
  if (
    "subscriptions_count" in counts &&
    _.isNumber(counts.subscriptions_count)
  ) {
    counts.subscribers ??= counts.subscriptions_count;
  }
  return counts;
}

export function communityCompat<C extends Partial<CommunityView> | undefined>(
  communityView: C,
): C {
  if (!communityView) {
    return communityView;
  }
  const clone = {
    ...communityView,
  };
  if (clone.counts) {
    clone.counts = communityAggregatesCompat(clone.counts);
  }
  return clone;
}

function profileCompat<P extends Person>(profile: P): P {
  const clone = { ...profile };
  if ("user_name" in clone && _.isString(clone.user_name)) {
    clone.name ??= clone.user_name;
  }
  return clone;
}

export function profileViewCompat<
  P extends Partial<{
    person: Person;
    counts: PersonAggregates;
  }>,
>(profile: P): P {
  const clone = { ...profile };

  if (clone.person) {
    clone.person = profileCompat(clone.person);
  }

  return clone;
}

function commentCompat(comment: Comment) {
  const clone = { ...comment };
  if ("body" in clone && _.isString(clone.body)) {
    clone.content ??= clone.body;
  }
  return clone;
}

export function commentViewCompat<C extends Partial<FlattenedComment>>(
  comment: C,
): C {
  const clone = { ...comment };
  if (clone.comment) {
    clone.comment = commentCompat(clone.comment);
  }
  return clone;
}
