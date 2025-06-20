import { ContentGutters } from "@/src/components/gutters";
import _, { parseInt } from "lodash";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { UserDropdown } from "@/src/components/nav";
import { PageTitle } from "@/src/components/page-title";
import { useParams } from "@/src/routing";
import { getAccountSite, parseAccountInfo, useAuth } from "@/src/stores/auth";
import NotFound from "../not-found";
import { createSlug } from "@/src/lib/lemmy/utils";
import { PersonCard } from "@/src/components/person/person-card";
import { CommunityCard } from "@/src/components/communities/community-card";
import { SectionItem, Section } from "./shared-components";
import { useBlockCommunity, useBlockPerson } from "@/src/lib/lemmy";
import { useConfirmationAlert } from "@/src/lib/hooks/index";

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
  const slug = person ? createSlug(person) : null;

  return (
    <IonPage>
      <PageTitle>{slug?.slug ?? "Person"}</PageTitle>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="Settings" />
          </IonButtons>
          <IonTitle data-tauri-drag-region>{slug?.slug ?? "Person"}</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true}>
        <ContentGutters className="pt-4 max-md:px-2.5">
          <div className="flex flex-col gap-8">
            <Section title="BLOCKED USERS">
              {personBlocks?.map((p) => {
                // @ts-expect-error
                const target: Person = p.target;
                const slug = createSlug(target);
                return (
                  <SectionItem
                    key={target.actorId}
                    onClick={() =>
                      getConfirmation({
                        message: `Unblock ${slug?.slug ?? "person"}`,
                      }).then(() =>
                        blockPerson.mutate({
                          person_id: target.person_id,
                          block: false,
                        }),
                      )
                    }
                  >
                    <PersonCard
                      actorId={target.actor_id}
                      person={target}
                      size="sm"
                      disableLink
                    />
                  </SectionItem>
                );
              })}
            </Section>

            <Section title="BLOCKED COMMUNITIES">
              {community_blocks?.map((c) => {
                // @ts-expect-error
                const target: Community = c.community;
                const slug = createSlug(target);
                return (
                  <SectionItem
                    key={c.apId}
                    onClick={() =>
                      getConfirmation({
                        message: `Unblock ${slug?.slug ?? "community"}`,
                      }).then(() =>
                        blockCommunity.mutate({
                          community_id: target.id,
                          block: false,
                        }),
                      )
                    }
                  >
                    <CommunityCard size="sm" apId={c.apId} disableLink />
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
