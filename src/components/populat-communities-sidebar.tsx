import { useListCommunities } from "@/src/lib/lemmy/index";
import { useFiltersStore } from "../stores/filters";
import _ from "lodash";
import { CommunityCard } from "./communities/community-card";

export function PopularCommunitiesSidebar() {
  const listingType = useFiltersStore((s) => s.listingType);

  const { data } = useListCommunities({
    sort: "TopWeek",
    limit: listingType === "Subscribed" ? 50 : 20,
    type_: listingType,
  });

  let communities = data?.pages.map((p) => p.communities).flat();

  if (listingType === "Subscribed") {
    communities = _.sortBy(communities, (c) => c.community.name);
  }

  return (
    <div className="gap-3 flex flex-col py-4 absolute inset-x-0 h-[calc(100vh-60px)] overflow-auto">
      <span className="text-xs text-muted-foreground">
        {listingType === "All" && "POPULAR COMMUNITIES"}
        {listingType === "Local" && "POPULAR COMMUNITIES"}
        {listingType === "Subscribed" && "SUBSCRIBED"}
      </span>

      {communities?.map((view) => (
        <CommunityCard key={view.community.id} communityView={view} size="sm" />
      ))}
    </div>
  );
}
