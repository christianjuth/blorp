import { twMerge } from "tailwind-merge";
import { CommunityJoinButton } from "./community-join-button";
import { createCommunitySlug } from "@/src/lib/lemmy/utils";
import { useCommunitiesStore } from "@/src/stores/communities";

export function CommunityBanner({ communityName }: { communityName?: string }) {
  const data = useCommunitiesStore((s) =>
    communityName ? s.communities[communityName]?.data : null,
  );

  const slug = data ? createCommunitySlug(data.communityView.community) : null;

  const banner = data?.communityView.community.banner;
  const icon = data?.communityView.community.icon;

  const hideBanner = !banner;

  return (
    <div className="flex-1">
      {!hideBanner && (
        <div className="relative flex-1">
          <div className="aspect-[5]">
            <img
              src={banner}
              className="h-full w-full object-cover rounded-xl"
            />
          </div>

          <div className="absolute left-5 h-20 w-20 outline-background outline-2 -translate-y-1/2 bg-background rounded-full flex items-center justify-center">
            <img src={icon} className="h-20 w-20 object-cover rounded-full" />
          </div>
        </div>
      )}

      <div
        className={twMerge(
          "my-1.5 flex flex-row justify-between",
          !hideBanner && "pl-28 pb-3",
        )}
      >
        <span className="font-bold text-lg">c/{slug}</span>
        <CommunityJoinButton communityName={communityName} />
      </div>
    </div>
  );
}
