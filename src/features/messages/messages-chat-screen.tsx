import { ContentGutters } from "@/src/components/gutters";
import { MarkdownRenderer } from "@/src/components/markdown/renderer";
import { UserDropdown } from "@/src/components/nav";
import { useCreatePrivateMessage, usePrivateMessages } from "@/src/lib/lemmy";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { VList, VListHandle } from "virtua";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { useProfilesStore } from "@/src/stores/profiles";
import { PersonAvatar } from "@/src/components/person/person-avatar";
import TextareaAutosize from "react-textarea-autosize";
import { Send } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Person } from "lemmy-js-client";

dayjs.extend(updateLocale);

export default function Messages() {
  const otherActorId = decodeApId(useParams("/messages/chat/:userId").userId);

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const person = useProfilesStore(
    (s) => s.profiles[getCachePrefixer()(otherActorId)]?.data.person,
  );
  const [signal, setSignal] = useState(0);
  const chat = usePrivateMessages({});

  const data = useMemo(() => {
    let prevDate: dayjs.Dayjs;

    return chat.data?.pages
      .flatMap((p) => p.private_messages)
      .reverse()
      .filter(
        (pm) =>
          pm.recipient?.actor_id === otherActorId ||
          pm.creator?.actor_id === otherActorId,
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
  }, [chat.isPending, signal]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons>
            <IonBackButton text="" />
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
        <div className="h-full flex flex-col">
          <VList
            key={signal}
            className="pt-5 ion-content-scroll-host"
            //style={{
            //  scrollbarGutter: "stable both-edges",
            //}}
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
            {data?.map((item) => {
              const isMe = item.creator.id === me?.id;
              return (
                <ContentGutters key={item.private_message.id}>
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
                          "p-2.5 rounded-xl max-w-2/3",
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
          {person && (
            <ComposeMessage
              recipient={person}
              onSubmit={() => {
                if (data) {
                  setSignal((s) => s + 1);
                }
              }}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}

function ComposeMessage({
  recipient,
  onSubmit,
}: {
  recipient: Person;
  onSubmit: () => void;
}) {
  const createPrivateMessage = useCreatePrivateMessage(recipient);
  const [content, setContent] = useState("");
  return (
    <ContentGutters>
      <form
        className="py-1 flex items-center"
        onSubmit={(e) => {
          e.preventDefault();
          createPrivateMessage.mutateAsync({
            content,
            recipient_id: recipient.id,
          });
          onSubmit();
          setContent("");
        }}
      >
        <TextareaAutosize
          placeholder="Message"
          className="border px-2 py-0.5 rounded-lg flex-1"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button size="icon" variant="ghost" className="-rotate-90">
          <Send className="text-brand" />
        </Button>
      </form>
    </ContentGutters>
  );
}
