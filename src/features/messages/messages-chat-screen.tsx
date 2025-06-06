import { ContentGutters } from "@/src/components/gutters";
import { MarkdownRenderer } from "@/src/components/markdown/renderer";
import { UserDropdown } from "@/src/components/nav";
import {
  useCreatePrivateMessage,
  useMarkPriavteMessageRead,
  usePrivateMessages,
} from "@/src/lib/lemmy";
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
import { useMedia } from "@/src/lib/hooks";
import { ToolbarTitle } from "@/src/components/toolbar/toolbar-title";

dayjs.extend(updateLocale);

export default function Messages() {
  const media = useMedia();

  const markMessageRead = useMarkPriavteMessageRead();
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

  useEffect(() => {
    const fn = async () => {
      if (data && me) {
        for (const { private_message } of data) {
          if (!private_message.read && private_message.creator_id !== me?.id) {
            await markMessageRead.mutateAsync({
              private_message_id: private_message.id,
              read: true,
            });
          }
        }
      }
    };
    fn();
  }, [data, me]);

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
          <IonButtons className="gap-2">
            <IonBackButton text="" />
            <ToolbarTitle size="sm">
              {(person ? createSlug(person)?.slug : null) ?? "Loading..."}
            </ToolbarTitle>
          </IonButtons>
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
            style={{
              scrollbarGutter: media.xxl ? "stable both-edges" : undefined,
            }}
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
                            ? "bg-brand-secondary text-white ml-auto [&_*]:text-white! [&_a]:underline"
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
        className="my-1 flex items-center gap-2 border rounded-2xl pr-1 focus-within:ring"
        onSubmit={(e) => {
          e.preventDefault();
          if (content.trim().length > 0) {
            createPrivateMessage.mutateAsync({
              content,
              recipient_id: recipient.id,
            });
            onSubmit();
            setContent("");
          }
        }}
      >
        <TextareaAutosize
          placeholder="Message"
          className="pl-3 py-1 flex-1 outline-none resize-none min-h-8"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button
          size="icon"
          variant={content.length === 0 ? "secondary" : "default"}
          className="-rotate-90 h-6.5 w-6.5"
        >
          <Send />
        </Button>
      </form>
    </ContentGutters>
  );
}
