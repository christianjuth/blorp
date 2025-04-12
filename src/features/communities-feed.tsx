import { useListCommunities } from "~/src/lib/lemmy/index";
import { Community } from "~/src/components/community";
import { memo, useMemo, useState } from "react";
import { useFiltersStore } from "~/src/stores/filters";
import { ContentGutters } from "~/src/components/gutters";
import { FlashList } from "~/src/components/flashlist";
import { CommunityView } from "lemmy-js-client";
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
import { UserDropdown } from "../components/nav";
import { CommunityFilter } from "../components/lemmy-sort";
import { Title } from "../components/title";
import { Link } from "react-router-dom";
import { searchOutline } from "ionicons/icons";

const MemoedListItem = memo(
  function ListItem(props: CommunityView) {
    return (
      <ContentGutters className="md:contents">
        <Community communityView={props} className="pt-3.5" />
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

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isRefetching,
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
      <Title>Communities</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
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
          <IonButtons slot="end" className="gap-4">
            <Link
              to="/communities/s"
              className="text-2xl contents text-brand md:hidden"
            >
              <IonIcon icon={searchOutline} />
            </Link>
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <ContentGutters className="h-full max-md:contents">
          <FlashList<CommunityView>
            key={communitySort + listingType}
            className="h-full ion-content-scroll-host"
            numColumns={numCols}
            data={communities}
            renderItem={({ item }) => <MemoedListItem {...item} />}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            estimatedItemSize={48}
            refresh={refetch}
          />
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
