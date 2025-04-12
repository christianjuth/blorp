import { CommentReplyView } from "lemmy-js-client";
import { Link } from "react-router-dom";
import { FlashList } from "@/src/components/flashlist";
import { ContentGutters } from "@/src/components/gutters";
import { MarkdownRenderer } from "../components/markdown/renderer";
import { RelativeTime } from "@/src/components/relative-time";
import {
  useMarkReplyRead,
  useNotificationCount,
  useReplies,
} from "@/src/lib/lemmy/index";
import { createCommunitySlug } from "@/src/lib/lemmy/utils";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { UserDropdown } from "../components/nav";
import { Title } from "../components/title";

function Reply({
  replyView,
  noBorder = false,
}: {
  replyView: CommentReplyView;
  noBorder?: boolean;
}) {
  const markRead = useMarkReplyRead();
  const communitySlug = createCommunitySlug(replyView.community);
  const path = replyView.comment.path.split(".");
  const parent = path.at(-2);
  const newPath = [parent !== "0" ? parent : undefined, replyView.comment.id]
    .filter(Boolean)
    .join(".");
  return (
    <ContentGutters>
      <Link
        to={`/inbox/c/${communitySlug}/posts/${encodeURIComponent(replyView.post.ap_id)}/comments/${newPath}`}
        onClickCapture={() => {
          markRead.mutate({
            comment_reply_id: replyView.comment_reply.id,
            read: true,
          });
        }}
        className="border-b-[0.5px] border-border pb-2.5 mt-2.5 flex-1 text-sm leading-6"
      >
        <div className="flex flex-row flex-wrap">
          {replyView.comment_reply.read ? null : (
            <div
            // h={8} w={8} bg="$accentColor" my={6} mr={5} br={9999}
            />
          )}
          <span
          // lineHeight="$1.5"
          >
            <span
              // fontSize="$4" fontWeight="bold"
              className="font-bold"
            >
              {replyView.creator.name}
            </span>
            <span> replied to your comment in </span>
            <span
              // fontSize="$4" fontWeight="bold"
              className="font-bold"
            >
              {replyView.post.name}
            </span>
          </span>
        </div>
        <MarkdownRenderer markdown={replyView.comment.content} />
        <RelativeTime
          time={replyView.comment.published}
          className="text-zinc-400"
        />
      </Link>
      <></>
    </ContentGutters>
  );
}

export default function Inbox() {
  const replies = useReplies({});

  // This updates in the backgroudn,
  // but calling it here ensures the
  // count is updated when the user visits
  // the inbox page.
  useNotificationCount();

  const allReplies = replies.data?.pages.flatMap((p) => p.replies);

  return (
    <IonPage>
      <Title>Inbox</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonTitle data-tauri-drag-region>Inbox</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <FlashList
          data={allReplies}
          renderItem={({ item, index }) => (
            <Reply
              key={item.comment_reply.id}
              replyView={item}
              noBorder={index + 1 === allReplies?.length}
            />
          )}
          onEndReached={() => {
            if (replies.hasNextPage) {
              replies.fetchNextPage();
            }
          }}
          estimatedItemSize={375}
          className="h-full ion-content-scroll-host"
          refresh={replies.refetch}
        />
      </IonContent>
    </IonPage>
  );
}
