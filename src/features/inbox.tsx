import { CommentReplyView, PersonMentionView } from "lemmy-js-client";
import { Link } from "@/src/routing/index";
import { FlashList } from "@/src/components/flashlist";
import { ContentGutters } from "@/src/components/gutters";
import { MarkdownRenderer } from "../components/markdown/renderer";
import { RelativeTime } from "@/src/components/relative-time";
import {
  useMarkReplyRead,
  useNotificationCount,
  usePersonMentions,
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
import { MenuButton, UserDropdown } from "../components/nav";
import { Title } from "../components/title";
import { cn } from "../lib/utils";
import { useMemo } from "react";
import _ from "lodash";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { useMedia, useUrlSearchState } from "../lib/hooks";
import z from "zod";

function Mention({
  mention,
  noBorder = false,
}: {
  mention: PersonMentionView;
  noBorder?: boolean;
}) {
  const markRead = useMarkReplyRead();
  const communitySlug = createCommunitySlug(mention.community);
  const path = mention.comment.path.split(".");
  const parent = path.at(-2);
  const newPath = [parent !== "0" ? parent : undefined, mention.comment.id]
    .filter(Boolean)
    .join(".");
  return (
    <ContentGutters className="px-0">
      <div
        className={cn("flex-1 max-md:px-2.5", !noBorder && "border-b-[0.5px]")}
      >
        <Link
          to={`/inbox/c/:communityName/posts/:post/comments/:comment`}
          params={{
            communityName: communitySlug,
            post: encodeURIComponent(mention.post.ap_id),
            comment: newPath,
          }}
          onClickCapture={() => {
            //markRead.mutate({
            //  comment_reply_id: mention.comment_reply.id,
            //  read: true,
            //});
          }}
          className={cn(
            "my-2.5 flex-1 text-sm leading-6 block",
            !mention.person_mention.read && "border-l-3 border-l-brand pl-2",
          )}
        >
          <div className="flex flex-row flex-wrap">
            {mention.person_mention.read ? null : <div />}
            <span>
              <span className="font-bold">{mention.creator.name}</span>
              <span> mentioned you in the post </span>
              <span className="font-bold">{mention.post.name}</span>
            </span>
          </div>
          <MarkdownRenderer markdown={mention.comment.content} />
          <RelativeTime
            time={mention.comment.published}
            className="text-zinc-400"
          />
        </Link>
      </div>
      <></>
    </ContentGutters>
  );
}

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
    <ContentGutters className="px-0">
      <div
        className={cn("flex-1 max-md:px-2.5", !noBorder && "border-b-[0.5px]")}
      >
        <Link
          to={`/inbox/c/:communityName/posts/:post/comments/:comment`}
          params={{
            communityName: communitySlug,
            post: encodeURIComponent(replyView.post.ap_id),
            comment: newPath,
          }}
          onClickCapture={() => {
            markRead.mutate({
              comment_reply_id: replyView.comment_reply.id,
              read: true,
            });
          }}
          className={cn(
            "my-2.5 flex-1 text-sm leading-6 block",
            !replyView.comment_reply.read && "border-l-3 border-l-brand pl-2",
          )}
        >
          <div className="flex flex-row flex-wrap">
            {replyView.comment_reply.read ? null : <div />}
            <span>
              <span className="font-bold">{replyView.creator.name}</span>
              <span> replied to your comment in </span>
              <span className="font-bold">{replyView.post.name}</span>
            </span>
          </div>
          <MarkdownRenderer markdown={replyView.comment.content} />
          <RelativeTime
            time={replyView.comment.published}
            className="text-zinc-400"
          />
        </Link>
      </div>
      <></>
    </ContentGutters>
  );
}

export default function Inbox() {
  const media = useMedia();

  const replies = useReplies({});
  const mentions = usePersonMentions({});

  const [type, setType] = useUrlSearchState(
    "type",
    "all",
    z.enum(["mentions", "replies", "all"]),
  );

  // This updates in the backgroudn,
  // but calling it here ensures the
  // count is updated when the user visits
  // the inbox page.
  useNotificationCount();

  const data = useMemo(() => {
    const data: (
      | { id: string; reply: CommentReplyView }
      | { id: string; mention: PersonMentionView }
    )[] = [];

    if (replies.data && (type === "replies" || type === "all")) {
      data.push(
        ...replies.data.pages
          .flatMap((p) => p.replies)
          .map((reply) => ({
            reply,
            id: `r${reply.comment_reply.id}`,
          })),
      );
    }

    if (mentions.data && (type === "mentions" || type === "all")) {
      data.push(
        ...(mentions.data?.pages
          .flatMap((p) => p.mentions)
          .map((mention) => ({
            mention,
            id: `m${mention.person_mention.id}`,
          })) ?? []),
      );
    }

    data.sort((a, b) => {
      const aPublished =
        "reply" in a
          ? a.reply.comment_reply.published
          : a.mention.person_mention.published;
      const bPublished =
        "reply" in b
          ? b.reply.comment_reply.published
          : b.mention.person_mention.published;
      return bPublished.localeCompare(aPublished);
    });

    return _.uniqBy(data, "id");
  }, [type, replies.data, mentions.data]);

  return (
    <IonPage>
      <Title>Inbox</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <MenuButton />
          </IonButtons>
          <IonTitle data-tauri-drag-region>Inbox</IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
        {media.maxMd && (
          <IonToolbar>
            <IonButtons slot="start">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={type}
                onValueChange={(val) =>
                  val && setType(val as "mentions" | "replies" | "all")
                }
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="replies">Replies</ToggleGroupItem>
                <ToggleGroupItem value="mentions">Mentions</ToggleGroupItem>
              </ToggleGroup>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent scrollY={false}>
        <FlashList
          header={[
            <ContentGutters className="max-md:hidden">
              <div className="py-2 bg-background border-b-[.5px]">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  value={type}
                  onValueChange={(val) =>
                    val && setType(val as "mentions" | "replies" | "all")
                  }
                >
                  <ToggleGroupItem value="all">All</ToggleGroupItem>
                  <ToggleGroupItem value="replies">Replies</ToggleGroupItem>
                  <ToggleGroupItem value="mentions">Mentions</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <></>
            </ContentGutters>,
          ]}
          stickyHeaderIndices={[0]}
          data={data}
          renderItem={({ item }) => {
            if ("reply" in item) {
              const reply = item.reply;
              return <Reply replyView={reply} />;
            }

            if ("mention" in item) {
              const mention = item.mention;
              return <Mention mention={mention} />;
            }

            return null;
          }}
          onEndReached={() => {
            if (replies.hasNextPage && (type === "all" || type === "replies")) {
              replies.fetchNextPage();
            }
            if (
              mentions.hasNextPage &&
              (type === "all" || type === "mentions")
            ) {
              mentions.fetchNextPage();
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
