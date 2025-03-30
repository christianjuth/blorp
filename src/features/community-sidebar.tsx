import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import {
  CommunitySidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
// import { CommunityBanner } from "../components/communities/community-banner";
import { ContentGutters } from "../components/gutters";
import { useScrollToTop } from "@react-navigation/native";
import { memo, useEffect, useMemo, useRef } from "react";
// import { PostSortBar } from "../components/lemmy-sort";
import { FlashList } from "../components/flashlist";
import { useCommunity, useMostRecentPost, usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";
import { RefreshButton } from "../components/ui/button";
import { isNotNull } from "../lib/utils";
import { usePostsStore } from "../stores/posts";
import _ from "lodash";
import {
  IonBackButton,
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
import { useParams } from "react-router";
import { CommunityBanner } from "../components/communities/community-banner";
import { useRecentCommunitiesStore } from "../stores/recent-communities";

import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { UserDropdown } from "../components/nav";
import {
  CommunityFilter,
  CommunitySortSelect,
  PostSortBar,
} from "../components/lemmy-sort";
import { Title } from "../components/title";

const EMPTY_ARR = [];

const SIDEBAR_MOBILE = "sidebar-mobile";
const BANNER = "banner";
const POST_SORT_BAR = "post-sort-bar";

type Item =
  | typeof SIDEBAR_MOBILE
  | typeof BANNER
  | typeof POST_SORT_BAR
  | PostProps;

const Post = memo((props: PostProps) => (
  <ContentGutters className="px-0">
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

export default function CommunityFeed() {
  const { communityName } = useParams<{ communityName: string }>();

  const community = useCommunity({
    name: communityName,
  });

  const updateRecent = useRecentCommunitiesStore((s) => s.update);

  useEffect(() => {
    if (community.data) {
      updateRecent(community.data.community_view.community);
    }
  }, [community.data]);

  return (
    <IonPage>
      <Title>{communityName}</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonTitle data-tauri-drag-region>{communityName}</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <CommunitySidebar communityName={communityName} asPage />
      </IonContent>
    </IonPage>
  );
}
