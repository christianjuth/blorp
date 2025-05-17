import { CommentReplyView, PersonMentionView } from "lemmy-js-client";
import { Link } from "@/src/routing/index";
import { VirtualList } from "@/src/components/virtual-list";
import { ContentGutters } from "@/src/components/gutters";
import { MarkdownRenderer } from "../components/markdown/renderer";
import { RelativeTime } from "@/src/components/relative-time";
import {
  useMarkPersonMentionRead,
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
import { PageTitle } from "../components/page-title";
import { cn } from "../lib/utils";
import { useMemo } from "react";
import _ from "lodash";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { useMedia } from "../lib/hooks";
import { useInboxStore } from "../stores/inbox";
import { Skeleton } from "../components/ui/skeleton";
import { ActionMenu } from "../components/adaptable/action-menu";
import { IoEllipsisHorizontal } from "react-icons/io5";

const NO_ITEMS = "NO_ITEMS";
type Item =
  | typeof NO_ITEMS
  | { id: string; reply: CommentReplyView }
  | {
      id: string;
      mention: PersonMentionView;
    };

function Placeholder() {
  return (
    <ContentGutters className="px-0">
      <div className="flex-1 flex flex-col gap-2 mt-2.5">
        <Skeleton className="h-12 max-md:mx-3" />
        <Skeleton className="h-5.5 max-md:mx-3" />
        <Skeleton className="h-6 w-12 max-md:mx-3 self-end" />
        <Skeleton className="h-px mt-0.5" />
      </div>
      <></>
    </ContentGutters>
  );
}

function Mention({
  mention,
  noBorder = false,
}: {
  mention: PersonMentionView;
  noBorder?: boolean;
}) {
  const markRead = useMarkPersonMentionRead();
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
        <div
          className={cn(
            "my-2.5 flex-1 text-sm leading-6 block",
            !mention.person_mention.read && "border-l-3 border-l-brand pl-2",
          )}
        >
          <Link
            to={`/inbox/c/:communityName/posts/:post/comments/:comment`}
            params={{
              communityName: communitySlug,
              post: encodeURIComponent(mention.post.ap_id),
              comment: newPath,
            }}
            onClickCapture={() => {
              markRead.mutate({
                person_mention_id: mention.person_mention.id,
                read: true,
              });
            }}
          >
            <div className="flex flex-row flex-wrap">
              {mention.person_mention.read ? null : <div />}
              <span>
                <span className="font-bold">{mention.creator.name}</span>
                <span> mentioned you in the post </span>
                <span className="font-bold">{mention.post.name}</span>
              </span>
            </div>
            <MarkdownRenderer
              markdown={mention.comment.content}
              className="pb-2"
            />
          </Link>
          <div className="flex flex-row justify-end gap-2 text-muted-foreground">
            <RelativeTime time={mention.comment.published} />
            <ActionMenu
              align="end"
              actions={[
                {
                  text: mention.person_mention.read
                    ? "Mark unread"
                    : "Mark read",
                  onClick: () =>
                    markRead.mutate({
                      person_mention_id: mention.person_mention.id,
                      read: !mention.person_mention.read,
                    }),
                },
              ]}
              trigger={<IoEllipsisHorizontal />}
            />
          </div>
        </div>
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
        <div
          className={cn(
            "my-2.5 flex-1 text-sm leading-6 block",
            !replyView.comment_reply.read && "border-l-3 border-l-brand pl-2",
          )}
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
          >
            <div className="flex flex-row flex-wrap">
              {replyView.comment_reply.read ? null : <div />}
              <span>
                <span className="font-bold">{replyView.creator.name}</span>
                <span> replied to your comment in </span>
                <span className="font-bold">{replyView.post.name}</span>
              </span>
            </div>
            <MarkdownRenderer
              markdown={replyView.comment.content}
              className="pb-2"
            />
          </Link>
          <div className="flex flex-row justify-end gap-2 text-muted-foreground">
            <RelativeTime time={replyView.comment.published} />
            <ActionMenu
              align="end"
              actions={[
                {
                  text: replyView.comment_reply.read
                    ? "Mark unread"
                    : "Mark read",
                  onClick: () =>
                    markRead.mutate({
                      comment_reply_id: replyView.comment_reply.id,
                      read: !replyView.comment_reply.read,
                    }),
                },
              ]}
              trigger={<IoEllipsisHorizontal />}
            />
          </div>
        </div>
      </div>
      <></>
    </ContentGutters>
  );
}

export default function Inbox() {
  const media = useMedia();

  const type = useInboxStore((s) => s.inboxType);
  const setType = useInboxStore((s) => s.setInboxType);

  const replies = useReplies({
    unread_only: type === "unread",
  });
  const mentions = usePersonMentions({
    unread_only: type === "unread",
  });
  const isRefetching = replies.isRefetching || mentions.isRefetching;
  const isPending = replies.isPending || mentions.isPending;

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

    if (
      replies.data &&
      (type === "replies" || type === "all" || type === "unread")
    ) {
      data.push(
        ...replies.data.pages
          .flatMap((p) => p.replies)
          .map((reply) => ({
            reply,
            id: `r${reply.comment_reply.id}`,
          })),
      );
    }

    if (
      mentions.data &&
      (type === "mentions" || type === "all" || type === "unread")
    ) {
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
      <PageTitle>Inbox</PageTitle>
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
                  val &&
                  setType(val as "all" | "unread" | "mentions" | "replies")
                }
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="unread">Unread</ToggleGroupItem>
                <ToggleGroupItem value="replies">Replies</ToggleGroupItem>
                <ToggleGroupItem value="mentions">Mentions</ToggleGroupItem>
              </ToggleGroup>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent scrollY={false}>
        <VirtualList<Item>
          header={[
            <ContentGutters className="max-md:hidden" key="type-select-header">
              <div className="py-2 bg-background border-b-[.5px]">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  value={type}
                  onValueChange={(val) =>
                    val &&
                    setType(val as "all" | "unread" | "mentions" | "replies")
                  }
                >
                  <ToggleGroupItem value="all">All</ToggleGroupItem>
                  <ToggleGroupItem value="unread">Unread</ToggleGroupItem>
                  <ToggleGroupItem value="replies">Replies</ToggleGroupItem>
                  <ToggleGroupItem value="mentions">Mentions</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <></>
            </ContentGutters>,
          ]}
          stickyHeaderIndices={[0]}
          data={
            data.length === 0 && !isRefetching && !isPending ? [NO_ITEMS] : data
          }
          renderItem={({ item }) => {
            if (item === NO_ITEMS) {
              return (
                <ContentGutters>
                  <div className="flex-1 italic text-muted-foreground p-6 text-center">
                    <span>No {type !== "all" ? type : "notifications"}</span>
                  </div>
                  <></>
                </ContentGutters>
              );
            }

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
            if (
              !replies.isFetchingNextPage &&
              replies.hasNextPage &&
              (type === "all" || type === "replies")
            ) {
              replies.fetchNextPage();
            }
            if (
              !mentions.isFetchingNextPage &&
              mentions.hasNextPage &&
              (type === "all" || type === "mentions")
            ) {
              mentions.fetchNextPage();
            }
          }}
          estimatedItemSize={375}
          className="h-full ion-content-scroll-host"
          refresh={replies.refetch}
          placeholder={<Placeholder />}
        />
      </IonContent>
    </IonPage>
  );
}
