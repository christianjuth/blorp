import { createSlug } from "@/src/lib/lemmy/utils";
import { useCreatePostStore } from "@/src/stores/create-post";
import { useIonAlert, useIonRouter } from "@ionic/react";
import { v4 as uuid } from "uuid";
import _ from "lodash";
import { Community } from "lemmy-js-client";
import { Deferred } from "@/src/lib/deferred";
import { useAuth } from "@/src/stores/auth";

export function useCommunityCreatePost({
  community,
}: {
  community?: Community;
}) {
  const [alrt] = useIonAlert();

  const router = useIonRouter();
  const drafts = useCreatePostStore((s) => s.drafts);
  const updateDraft = useCreatePostStore((s) => s.updateDraft);
  const communitySlug = community ? createSlug(community)?.slug : null;

  return async () => {
    if (!community) {
      return;
    }
    let createPostId = _.entries(drafts).find(
      ([_id, { community }]) =>
        community && createSlug(community)?.slug === communitySlug,
    )?.[0];

    if (createPostId) {
      try {
        const deferred = new Deferred();
        alrt({
          message: `You have a draft post saved for ${communitySlug}. Would you like to continue where you left off?`,
          buttons: [
            {
              text: "New post",
              role: "cancel",
              handler: () => deferred.reject(),
            },
            {
              text: "Continue",
              role: "confirm",
              handler: () => deferred.resolve(),
            },
          ],
        });
        await deferred.promise;
      } catch {
        createPostId = uuid();
      }
    }

    updateDraft(createPostId ?? uuid(), {
      community: _.pick(community, ["name", "id", "title", "icon", "actor_id"]),
    });
    router.push(`/create?id=${createPostId ?? uuid()}`);
  };
}

export function CommunityCreatePost({
  community,
  renderButton,
}: {
  community?: Community;
  renderButton: (props: { onClick: () => void }) => void;
}) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const createPost = useCommunityCreatePost({ community });

  if (!isLoggedIn || !community) {
    return null;
  }

  return <>{renderButton({ onClick: createPost })}</>;
}
