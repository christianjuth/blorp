import {
  useListCommunities,
  useModeratingCommunities,
  useSubscribedCommunities,
} from "@/src/lib/lemmy/index";
import { useFiltersStore } from "@/src/stores/filters";
import _ from "lodash";
import { CommunityCard } from "./community-card";
import { HomeFilter } from "../lemmy-sort";
import { IoChevronDown } from "react-icons/io5";

export function PopularCommunitiesSidebar() {
  const listingType = useFiltersStore((s) => s.listingType);

  const subscribedCommunities = useSubscribedCommunities();
  const moderatingCommunities = useModeratingCommunities();

  const { data } = useListCommunities({
    sort: "TopWeek",
    limit: 20,
    type_: listingType,
  });

  let communities = data?.pages.map((p) => p.communities).flat();

  if (listingType === "Subscribed") {
    communities = _.sortBy(communities, (c) => c.community.name);
  }

  return (
    <div className="gap-3 flex flex-col py-4 absolute inset-x-0 h-[calc(100vh-60px)] overflow-auto">
      <HomeFilter>
        <span className="text-xs text-muted-foreground flex flex-row gap-1">
          {listingType === "All" && "POPULAR ON LEMMY"}
          {listingType === "Local" && "POPULAR LOCALLY"}
          {listingType === "Subscribed" && "SUBSCRIBED"}
          {listingType === "ModeratorView" && "MODERATING"}
          <IoChevronDown className="text-muted-foreground text-sm" />
        </span>
      </HomeFilter>

      {listingType === "Subscribed" &&
        subscribedCommunities?.map((view) => (
          <CommunityCard
            key={view.community.id}
            communityView={view}
            size="sm"
          />
        ))}

      {listingType === "ModeratorView" &&
        moderatingCommunities?.map((view) => (
          <CommunityCard
            key={view.community.id}
            communityView={view}
            size="sm"
          />
        ))}

      {listingType !== "Subscribed" &&
        listingType !== "ModeratorView" &&
        communities?.map((view) => (
          <CommunityCard
            key={view.community.id}
            communityView={view}
            size="sm"
          />
        ))}
    </div>
  );
}
