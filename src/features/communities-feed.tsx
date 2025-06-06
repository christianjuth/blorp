import { useListCommunities } from "@/src/lib/lemmy/index";
import {
  CommunityCard,
  CommunityCardSkeleton,
} from "../components/communities/community-card";
import { memo, useMemo, useState } from "react";
import { useFiltersStore } from "@/src/stores/filters";
import { ContentGutters } from "@/src/components/gutters";
import { VirtualList } from "@/src/components/virtual-list";
import { Community } from "lemmy-v3";
import { useMedia } from "../lib/hooks";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonToolbar,
  IonIcon,
  useIonRouter,
} from "@ionic/react";
import { MenuButton, UserDropdown } from "../components/nav";
import { CommunityFilter, CommunitySortSelect } from "../components/lemmy-sort";
import { PageTitle } from "../components/page-title";
import { Link } from "@/src/routing/index";
import { searchOutline } from "ionicons/icons";
import { useAuth } from "../stores/auth";

const MemoedListItem = memo(
  function ListItem(props: { community: Community }) {
    return (
      <ContentGutters className="md:contents">
        <CommunityCard apId={props.community.actor_id} className="mt-1" />
      </ContentGutters>
    );
  },
  (a, b) => {
    return a.community.actor_id === b.community.actor_id;
  },
);

export default function Communities() {
  const router = useIonRouter();
  const [search, setSearch] = useState("");

  const communitySort = useFiltersStore((s) => s.communitySort);
  const listingType = useFiltersStore((s) => s.communitiesListingType);

  const media = useMedia();

  const moderates = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.moderates,
  );
  const moderatesCommunities = moderates?.map(({ community }) => ({
    community,
  }));

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    // isRefetching,
    refetch,
  } = useListCommunities({
    limit: 50,
    sort: communitySort,
    type_: listingType,
  });

  const communities = useMemo(
    () => data?.pages.map((p) => p.communities).flat(),
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
          <IonButtons slot="start" className="gap-2">
            <MenuButton />
            <CommunityFilter />
          </IonButtons>
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
          <IonButtons slot="end" className="gap-3.5 md:gap-4.t">
            <Link to="/communities/s" className="text-2xl contents md:hidden">
              <IonIcon icon={searchOutline} className="text-muted-foreground" />
            </Link>
            <CommunitySortSelect />
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <ContentGutters className="h-full max-md:contents">
          <VirtualList<{ community: Community }>
            key={communitySort + listingType}
            className="h-full ion-content-scroll-host"
            numColumns={numCols}
            data={
              listingType === "ModeratorView"
                ? moderatesCommunities
                : communities
            }
            renderItem={({ item }) => <MemoedListItem {...item} />}
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
