import { twMerge } from "tailwind-merge";
import { CommunityJoinButton } from "./community-join-button";
import { createSlug } from "@/src/lib/lemmy/utils";
import { useCommunitiesStore } from "@/src/stores/communities";
import { Skeleton } from "../ui/skeleton";
import { useState } from "react";
import { useAuth } from "@/src/stores/auth";

export function CommunityBanner({ communityName }: { communityName?: string }) {
  const [bannerReady, setBannerReady] = useState(false);
  const [iconReady, setIconReady] = useState(false);

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const data = useCommunitiesStore((s) =>
    communityName
      ? s.communities[getCachePrefixer()(communityName)]?.data
      : null,
  );

  const slug = data ? createSlug(data.communityView.community) : null;

  const banner = data?.communityView.community.banner;
  const icon = data?.communityView.community.icon;

  const hideBanner = !banner;

  return (
    <div className="flex-1">
      {!hideBanner && (
        <div className="relative flex-1">
          <div className="aspect-[5] relative">
            {!bannerReady && (
              <Skeleton className="absolute inset-0 rounded-xl" />
            )}
            <img
              src={banner}
              className="h-full w-full object-cover rounded-xl relative"
              onLoad={() => setBannerReady(true)}
            />
          </div>

          {icon && (
            <div className="absolute left-5 h-20 w-20 outline-background outline-2 -translate-y-1/2 bg-background rounded-full flex items-center justify-center">
              {!iconReady && (
                <Skeleton className="absolute inset-0 rounded-full" />
              )}
              <img
                src={icon}
                className="h-20 w-20 object-cover rounded-full relative"
                onLoad={() => setIconReady(true)}
              />
            </div>
          )}
        </div>
      )}

      <div
        className={twMerge(
          "my-1.5 flex flex-row justify-between",
          !hideBanner && icon && "pl-28",
          !hideBanner && "pb-3",
        )}
      >
        <span className="font-bold text-lg">
          {slug?.name}
          <span className="italic">@{slug?.host}</span>
        </span>
        <CommunityJoinButton communityName={communityName} />
      </div>
    </div>
  );
}
