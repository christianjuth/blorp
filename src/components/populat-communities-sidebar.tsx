import { useListCommunities } from "~/src/lib/lemmy/index";
import { createCommunitySlug } from "../lib/lemmy/utils";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { CommunityView } from "lemmy-js-client";
import { abbriviateNumber } from "~/src/lib/format";
import { useFiltersStore } from "../stores/filters";
import _ from "lodash";
import { Link } from "react-router-dom";

dayjs.extend(localizedFormat);

function SmallComunityCard({
  communityView,
}: {
  communityView: CommunityView;
}) {
  const { community, counts } = communityView;
  const slug = createCommunitySlug(community);
  return (
    <Link to={`/home/c/${slug}`} className="flex items-center gap-3">
      <img src={community.icon} className="h-8 w-8 rounded-full object-cover" />
      {/*     <Text fontSize="$4">{community.title.substring(0, 1)}</Text> */}
      <div
        className="flex flex-col"
        // gap="$0.5"
      >
        <span
          // fontSize="$3"
          className="text-xs"
        >
          c/{community.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {abbriviateNumber(counts.subscribers)} members
        </span>
      </div>
    </Link>
  );
}

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
      <span
        // color="$color10" fontSize="$3"
        className="text-xs text-muted-foreground"
      >
        {listingType === "All" && "POPULAR COMMUNITIES"}
        {listingType === "Local" && "POPULAR COMMUNITIES"}
        {listingType === "Subscribed" && "SUBSCRIBED"}
      </span>

      {communities?.map((view) => (
        <SmallComunityCard key={view.community.id} communityView={view} />
      ))}
    </div>
  );
}
