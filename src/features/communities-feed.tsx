import { useListCommunities } from "~/src/lib/lemmy/index";
import { Community } from "~/src/components/community";
import { memo, useMemo } from "react";
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
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from "@ionic/react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { UserDropdown } from "../components/nav";

const MemoedListItem = memo(
  function ListItem(props: CommunityView) {
    return (
      <ContentGutters className="md:contents">
        <Community communityView={props} />
      </ContentGutters>
    );
  },
  (a, b) => {
    return a.community.actor_id === b.community.actor_id;
  },
);

export default function Communities() {
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

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    Haptics.impact({ style: ImpactStyle.Medium });

    if (!isRefetching) {
      refetch().then(() => {
        event.detail.complete();
      });
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Communities</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <ContentGutters className="h-full max-md:contents">
          <FlashList<CommunityView>
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
          />
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
