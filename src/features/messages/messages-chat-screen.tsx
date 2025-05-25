import { ContentGutters } from "@/src/components/gutters";
import { MarkdownRenderer } from "@/src/components/markdown/renderer";
import { UserDropdown } from "@/src/components/nav";
import { usePrivateMessages } from "@/src/lib/lemmy";
import { createSlug, decodeApId } from "@/src/lib/lemmy/utils";
import { cn } from "@/src/lib/utils";
import { useParams } from "@/src/routing";
import { parseAccountInfo, useAuth } from "@/src/stores/auth";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import _ from "lodash";
import { useEffect, useMemo, useRef } from "react";
import { VList, VListHandle } from "virtua";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { useProfilesStore } from "@/src/stores/profiles";
import { Avatar } from "@radix-ui/react-avatar";
import { PersonAvatar } from "@/src/components/person/person-avatar";

dayjs.extend(updateLocale);

export default function Messages() {
  const otherActorId = decodeApId(useParams("/messages/chat/:userId").userId);

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const person = useProfilesStore(
    (s) => s.profiles[getCachePrefixer()(otherActorId)]?.data.person,
  );
  const chat = usePrivateMessages({});

  const data = useMemo(() => {
    let prevDate: dayjs.Dayjs;

    return chat.data?.pages
      .flatMap((p) => p.private_messages)
      .reverse()
      .filter(
        (pm) =>
          pm.recipient.actor_id === otherActorId ||
          pm.creator.actor_id === otherActorId,
      )
      .map((pm) => {
        const newDate = dayjs(pm.private_message.published);

        let topOfDay = false;
        if (!newDate.isSame(prevDate, "date")) {
          topOfDay = true;
          prevDate = newDate;
        }
        prevDate ??= newDate;

        return {
          topOfDay,
          ...pm,
        };
      });
  }, [chat.data, otherActorId]);

  const account = useAuth((s) => s.getSelectedAccount());
  const { person: me } = parseAccountInfo(account);

  const ref = useRef<VListHandle>(null);
  useEffect(() => {
    if (data) {
      ref.current?.scrollToIndex(data.length);
    }
  }, [chat.isPending]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons>
            <IonBackButton text="Messages" />
          </IonButtons>
          <IonTitle>
            {(person ? createSlug(person)?.slug : null) ?? "Loading..."}
          </IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <VList
          className="pt-5"
          shift
          ref={ref}
          onScroll={() => {
            if (ref.current?.findStartIndex() === 0) {
              if (!chat.isFetchingNextPage && chat.hasNextPage) {
                chat.fetchNextPage();
              }
            }
          }}
        >
          {data?.map((item, index) => {
            const isMe = item.creator.id === me?.id;
            return (
              <ContentGutters key={index}>
                <div className="flex-row pb-4 w-full">
                  {item.topOfDay && (
                    <span className="block pb-4 text-center text-xs text-muted-foreground">
                      {dayjs(item.private_message.published).format("ll")}
                    </span>
                  )}
                  <div className="flex gap-2">
                    {!isMe && (
                      <PersonAvatar
                        actorId={item.creator.actor_id}
                        person={item.creator}
                        size="sm"
                      />
                    )}
                    <MarkdownRenderer
                      markdown={item.private_message.content}
                      className={cn(
                        "p-2 rounded-lg max-w-2/3",
                        isMe
                          ? "bg-brand-secondary text-white ml-auto"
                          : "rounded-tl-none bg-secondary",
                      )}
                    />
                  </div>
                </div>
              </ContentGutters>
            );
          })}
        </VList>
      </IonContent>
    </IonPage>
  );
}
