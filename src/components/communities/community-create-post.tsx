import { createSlug } from "@/src/lib/lemmy/utils";
import { useCreatePostStore } from "@/src/stores/create-post";
import { useIonAlert, useIonRouter } from "@ionic/react";
import { v4 as uuid } from "uuid";
import _ from "lodash";
import { Deferred } from "@/src/lib/deferred";
import { useAuth } from "@/src/stores/auth";
import { useCommunity } from "@/src/lib/lemmy";

export function useCommunityCreatePost({
  communityName,
}: {
  communityName?: string;
}) {
  const [alrt] = useIonAlert();

  const router = useIonRouter();
  const drafts = useCreatePostStore((s) => s.drafts);
  const updateDraft = useCreatePostStore((s) => s.updateDraft);

  const community = useCommunity({
    name: communityName,
  });

  return async () => {
    const communityData = community.data?.community_view.community;
    if (!communityData) {
      return;
    }
    let createPostId = _.entries(drafts).find(
      ([_id, { community }]) =>
        community && createSlug(community)?.slug === communityName,
    )?.[0];

    if (createPostId) {
      try {
        const deferred = new Deferred();
        alrt({
          message: `You have a draft post saved for ${communityName}. Would you like to continue where you left off?`,
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
    createPostId ??= uuid();

    updateDraft(createPostId, {
      community: _.pick(communityData, [
        "name",
        "id",
        "title",
        "icon",
        "actor_id",
      ]),
    });
    router.push(`/create?id=${createPostId}`);
  };
}

export function CommunityCreatePost({
  communityName,
  renderButton,
}: {
  communityName?: string;
  renderButton: (props: { onClick: () => void }) => void;
}) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const createPost = useCommunityCreatePost({ communityName });

  if (!isLoggedIn || !communityName) {
    return null;
  }

  return <>{renderButton({ onClick: createPost })}</>;
}
