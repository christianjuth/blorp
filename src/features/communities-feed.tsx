import { useListCommunities } from "@/src/lib/api/index";
import {
  CommunityCard,
  CommunityCardSkeleton,
} from "../components/communities/community-card";
import { memo, useMemo, useState } from "react";
import { useFiltersStore } from "@/src/stores/filters";
import { ContentGutters } from "@/src/components/gutters";
import { VirtualList } from "@/src/components/virtual-list";
import { useMedia } from "../lib/hooks";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import { MenuButton, UserDropdown } from "../components/nav";
import { CommunityFilter, CommunitySortSelect } from "../components/lemmy-sort";
import { PageTitle } from "../components/page-title";
import { Link } from "@/src/routing/index";
import { getAccountSite, useAuth } from "../stores/auth";
import { Search } from "../components/icons";
import { ToolbarButtons } from "../components/toolbar/toolbar-buttons";

const MemoedListItem = memo(function ListItem(props: {
  communitySlug: string;
}) {
  return (
    <ContentGutters className="md:contents">
      <CommunityCard communitySlug={props.communitySlug} className="mt-1" />
    </ContentGutters>
  );
});

export default function Communities() {
  const router = useIonRouter();
  const [search, setSearch] = useState("");

  const communitySort = useFiltersStore((s) => s.communitySort);
  const listingType = useFiltersStore((s) => s.communitiesListingType);

  const media = useMedia();

  const moderates = useAuth((s) =>
    getAccountSite(s.getSelectedAccount()),
  )?.moderates;
  const moderatesCommunities = moderates?.map(({ slug }) => slug);

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    // isRefetching,
    refetch,
  } = useListCommunities({
    sort: communitySort,
    type: listingType,
  });

  const communities = useMemo(
    () =>
      data?.pages
        .map((p) => p.communities)
        .flat()
        .map(({ slug }) => slug),
    [data?.pages],
  );

  let numCols = 1;
  if (media.xl) {
    numCols = 3;
  } else if (media.sm) {
    numCols = 2;
  }

  return (
    <IonPage>
      <PageTitle>Communities</PageTitle>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <ToolbarButtons side="left">
            <MenuButton />
            <CommunityFilter />
          </ToolbarButtons>
          <form
            className="max-md:hidden"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/communities/s?q=${search}`);
            }}
            data-tauri-drag-region
          >
            <IonSearchbar
              mode="ios"
              className="max-w-md mx-auto"
              value={search}
              onIonInput={(e) => setSearch(e.detail.value ?? "")}
            />
          </form>
          <ToolbarButtons side="right">
            <Link to="/communities/s" className="text-2xl contents md:hidden">
              <Search className="text-muted-foreground scale-110" />
            </Link>
            <CommunitySortSelect />
            <UserDropdown />
          </ToolbarButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <ContentGutters className="h-full max-md:contents">
          <VirtualList<string>
            key={communitySort + listingType}
            className="h-full ion-content-scroll-host"
            numColumns={numCols}
            data={
              listingType === "ModeratorView"
                ? moderatesCommunities
                : communities
            }
            renderItem={({ item }) => <MemoedListItem communitySlug={item} />}
            onEndReached={() => {
              if (
                listingType !== "ModeratorView" &&
                hasNextPage &&
                !isFetchingNextPage
              ) {
                fetchNextPage();
              }
            }}
            estimatedItemSize={52}
            refresh={refetch}
            placeholder={
              <ContentGutters className="md:contents">
                <CommunityCardSkeleton className="mt-1" />
              </ContentGutters>
            }
          />
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
