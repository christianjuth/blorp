import { SmallScreenSidebar } from "@/src/components/communities/community-sidebar";
import { useEffect } from "react";
import { useCommunity } from "../lib/lemmy";
import _ from "lodash";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useParams } from "@/src/routing/index";
import { useRecentCommunitiesStore } from "../stores/recent-communities";

import { UserDropdown } from "../components/nav";
import { PageTitle } from "../components/page-title";
import { useLinkContext } from "../routing/link-context";
import { ContentGutters } from "../components/gutters";
export default function CommunityFeed() {
  const linkCtx = useLinkContext();
  const { communityName } = useParams(
    `${linkCtx.root}c/:communityName/sidebar`,
  );

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
      <PageTitle>{communityName}</PageTitle>
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
        <ContentGutters className="px-0">
          <SmallScreenSidebar
            communityName={communityName}
            actorId={community.data?.community_view.community.actor_id}
            expanded
          />
          <></>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
