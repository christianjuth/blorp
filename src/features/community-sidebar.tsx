import { SmallScreenSidebar } from "@/src/components/communities/community-sidebar";
import { useEffect } from "react";
import { useCommunity } from "../lib/api";
import _ from "lodash";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from "@ionic/react";
import { useParams } from "@/src/routing/index";
import { useRecentCommunitiesStore } from "../stores/recent-communities";

import { UserDropdown } from "../components/nav";
import { PageTitle } from "../components/page-title";
import { useLinkContext } from "../routing/link-context";
import { ContentGutters } from "../components/gutters";
import { ToolbarBackButton } from "../components/toolbar/toolbar-back-button";
import { ToolbarTitle } from "../components/toolbar/toolbar-title";
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
      updateRecent(community.data.community);
    }
  }, [community.data]);

  return (
    <IonPage>
      <PageTitle>{communityName}</PageTitle>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start" className="gap-2">
            <ToolbarBackButton />
            <ToolbarTitle size="sm">{communityName}</ToolbarTitle>
          </IonButtons>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <ContentGutters className="px-0">
          <SmallScreenSidebar
            communityName={communityName}
            actorId={community.data?.community.apId}
            expanded
          />
          <></>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
