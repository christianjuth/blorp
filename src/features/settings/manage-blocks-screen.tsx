import { ContentGutters } from "@/src/components/gutters";
import _, { parseInt } from "lodash";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from "@ionic/react";
import { UserDropdown } from "@/src/components/nav";
import { PageTitle } from "@/src/components/page-title";
import { useParams } from "@/src/routing";
import { getAccountSite, parseAccountInfo, useAuth } from "@/src/stores/auth";
import NotFound from "../not-found";
import { PersonCard } from "@/src/components/person/person-card";
import { CommunityCard } from "@/src/components/communities/community-card";
import { SectionItem, Section } from "./shared-components";
import { useBlockCommunity, useBlockPerson } from "@/src/lib/api";
import { useConfirmationAlert } from "@/src/lib/hooks/index";
import { ToolbarBackButton } from "@/src/components/toolbar/toolbar-back-button";
import { ToolbarTitle } from "@/src/components/toolbar/toolbar-title";

export default function SettingsPage() {
  const getConfirmation = useConfirmationAlert();

  const { index: indexStr } = useParams("/settings/manage-blocks/:index");
  const index = parseInt(indexStr);

  const account = useAuth((s) => s.accounts[index]);

  const blockCommunity = useBlockCommunity(account);
  const blockPerson = useBlockPerson(account);

  if (!account) {
    return <NotFound />;
  }

  const site = getAccountSite(account);
  const personBlocks = site?.personBlocks;
  const community_blocks = site?.communityBlocks;

  const { person } = parseAccountInfo(account);
  const slug = person?.slug;

  return (
    <IonPage>
      <PageTitle>{slug ?? "Person"}</PageTitle>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start" className="gap-2">
            <ToolbarBackButton />
            <ToolbarTitle size="sm">{slug ?? "Person"}</ToolbarTitle>
          </IonButtons>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true}>
        <ContentGutters className="pt-4 max-md:px-3.5">
          <div className="flex flex-col gap-8">
            <Section title="BLOCKED USERS">
              {personBlocks?.map((p) => {
                return (
                  <SectionItem
                    key={p.apId}
                    onClick={() =>
                      getConfirmation({
                        message: `Unblock ${p.slug}`,
                      }).then(() =>
                        blockPerson.mutate({
                          personId: p.id,
                          block: false,
                        }),
                      )
                    }
                  >
                    <PersonCard
                      actorId={p.apId}
                      person={p}
                      size="sm"
                      disableLink
                    />
                  </SectionItem>
                );
              })}
            </Section>

            <Section title="BLOCKED COMMUNITIES">
              {community_blocks?.map((c) => {
                return (
                  <SectionItem
                    key={c.apId}
                    onClick={() =>
                      getConfirmation({
                        message: `Unblock ${c.slug}`,
                      }).then(() =>
                        blockCommunity.mutate({
                          communityId: c.id,
                          block: false,
                        }),
                      )
                    }
                  >
                    <CommunityCard
                      size="sm"
                      communitySlug={c.slug}
                      disableLink
                    />
                  </SectionItem>
                );
              })}
            </Section>
          </div>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
