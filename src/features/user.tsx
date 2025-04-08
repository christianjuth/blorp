import { ContentGutters } from "../components/gutters";
import { abbriviateNumber } from "../lib/format";
import { usePersonDetails, usePersonFeed } from "../lib/lemmy";
import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "../components/posts/post";
import Markdown from "react-markdown";
import { FlashList } from "../components/flashlist";
import { PostSortBar } from "../components/lemmy-sort";
import { memo, useMemo, useState } from "react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { createPersonSlug, decodeApId, encodeApId } from "../lib/lemmy/utils";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import _ from "lodash";
import { useCommentsStore } from "../stores/comments";
import { useLinkContext } from "../components/nav/link-context";
import { useProfilesStore } from "../stores/profiles";
import { usePostsStore } from "../stores/posts";
import { isNotNull } from "../lib/utils";
import { CommentView } from "lemmy-js-client";
import { Link, useParams } from "react-router-dom";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { UserDropdown } from "../components/nav";
import { Title } from "../components/title";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/src/components/ui/avatar";
import { LuCakeSlice } from "react-icons/lu";
import { useMedia } from "../lib/hooks";

const BANNER = "banner";
const POST_SORT_BAR = "post-sort-bar";

type Item = typeof BANNER | typeof POST_SORT_BAR | PostProps | CommentView;

function isPost(item: Item): item is PostProps {
  return _.isObject(item) && "apId" in item;
}

const Post = memo((props: PostProps) => (
  <ContentGutters className="px-0">
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

const Comment = memo(function Comment({ path }: { path: string }) {
  const commentView = useCommentsStore((s) => s.comments[path]?.data);
  const linkCtx = useLinkContext();

  if (!commentView) {
    return null;
  }

  const { comment, community, post } = commentView;

  const parent = path.split(".").at(-2);
  const newPath = [parent !== "0" ? parent : undefined, comment.id]
    .filter(Boolean)
    .join(".");

  return (
    <ContentGutters>
      <Link
        to={`${linkCtx.root}c/${community.slug}/posts/${encodeApId(post.ap_id)}/comments/${newPath}`}
        className="py-2 border-b flex-1 overflow-hidden"
      >
        {comment.deleted ? (
          <span className="text-sm text-muted-foreground italic">deleted</span>
        ) : (
          <Markdown>{comment.content}</Markdown>
        )}
      </Link>
      <></>
    </ContentGutters>
  );
});

dayjs.extend(localizedFormat);

const EMPTY_ARR = [];

export default function User() {
  const media = useMedia();
  const { userId } = useParams<{ userId: string }>();

  const actorId = userId ? decodeApId(userId) : undefined;

  const [type, setType] = useState<"posts" | "comments" | "all">("all");

  usePersonDetails({ actorId });
  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    data,
  } = usePersonFeed({ actorId });

  const personView = useProfilesStore((s) =>
    actorId ? s.profiles[actorId]?.data : undefined,
  );

  const person = personView?.person;
  const counts = personView?.counts;

  const postCache = usePostsStore((s) => s.posts);

  const listData = useMemo(() => {
    const commentViews =
      data?.pages.map((res) => res.comments).flat() ?? EMPTY_ARR;

    const postIds = data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView) : null;
      })
      .filter(isNotNull);

    switch (type) {
      case "posts":
        return postViews;
      case "comments":
        return commentViews;
      default:
        return [...postViews, ...commentViews].sort((a, b) => {
          const aPublished = isPost(a)
            ? a.published
            : (a as CommentView).comment.published;
          const bPublished = isPost(b)
            ? b.published
            : (b as CommentView).comment.published;
          return bPublished.localeCompare(aPublished);
        });
    }
  }, [data?.pages, postCache, type]);

  if (!personView) {
    return null;
  }

  return (
    <IonPage>
      <Title>{person ? createPersonSlug(person) : "Person"}</Title>
      <IonHeader>
        <IonToolbar
          data-tauri-drag-region
          style={
            media.maxMd ? { "--border-color": "var(--background)" } : undefined
          }
        >
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <IonTitle data-tauri-drag-region>
            {person ? createPersonSlug(person) : "Person"}
          </IonTitle>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <ContentGutters className="max-md:hidden">
          <div className="flex-1" />
          <div className="absolute py-4 flex flex-col gap-3 w-full">
            <span>
              {personView.person.display_name ?? personView.person.name}
            </span>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <LuCakeSlice />
              <span>
                Created {dayjs(personView.person.published).format("ll")}
              </span>
            </div>

            {person?.bio && <Markdown>{person.bio}</Markdown>}

            {counts && (
              <div className="grid grid-cols-2 grid-flow-dense">
                <span className="col-start-1">
                  {abbriviateNumber(counts.post_count)}
                </span>
                <span className="col-start-1 text-sm text-muted-foreground">
                  Posts
                </span>

                <span className="col-start-2">
                  {abbriviateNumber(counts.comment_count)}
                </span>
                <span className="col-start-2 text-sm text-muted-foreground">
                  Comments
                </span>
              </div>
            )}
          </div>
        </ContentGutters>

        <FlashList<Item>
          className="h-full ion-content-scroll-host"
          data={
            [
              BANNER,
              // "sidebar-mobile",
              POST_SORT_BAR,
              ...listData,
            ] as const
          }
          renderItem={({ item }) => {
            // if (item === "sidebar-mobile") {
            //   return communityName ? (
            //     <ContentGutters>
            //       <SmallScreenSidebar communityName={communityName} />
            //       <></>
            //     </ContentGutters>
            //   ) : (
            //     <></>
            //   );
            // }

            if (item === "banner") {
              return (
                <ContentGutters className="pt-4 pb-2">
                  <div className="flex flex-row gap-2.5">
                    <Avatar className="h-13 w-13">
                      <AvatarImage src={person?.avatar} />
                      <AvatarFallback className="text-xl">
                        {person?.name?.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col leading-4">
                      <span className="font-bold text-lg">
                        {personView.person.display_name ??
                          personView.person.name}
                      </span>
                      <span>u/{personView.person.name}</span>
                    </div>
                  </div>
                </ContentGutters>
              );
            }

            if (item === "post-sort-bar") {
              return (
                <ContentGutters className="max-md:py-1 max-md:bg-background max-md:border-b-[0.5px]">
                  <div className="flex flex-row md:h-12 md:border-b-[0.5px] md:bg-background flex-1 items-center">
                    <div>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        value={type}
                        onValueChange={(val) =>
                          val && setType(val as "posts" | "comments" | "all")
                        }
                      >
                        <ToggleGroupItem value="all">All</ToggleGroupItem>
                        <ToggleGroupItem value="posts">Posts</ToggleGroupItem>
                        <ToggleGroupItem value="comments">
                          <span>Comments</span>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    {type === "posts" && (
                      <>
                        <div className="w-[.5px] h-5 bg-border mx-3 my-auto" />
                        <PostSortBar align="start" />
                      </>
                    )}
                  </div>
                  <></>
                </ContentGutters>
              );
              // return (
              //   <ContentGutters>
              //     <XStack flex={1}
              //       py="$2"
              //       gap="$3"
              //       bbc="$color3"
              //       bbw={1}
              //       $md={{
              //         bbw: 0.5,
              //         px: "$3",
              //       }}
              //       ai="center"
              //       bg="$background"
              //     >
              //       <ToggleGroup
              //         defaultValue={type}
              //         options={[
              //           { value: "posts", label: "Posts" },
              //           { value: "comments", label: "Comments" },
              //         ]}
              //         onValueChange={(newType) => {
              //           setTimeout(() => {
              //             setType(newType);
              //           }, 0);
              //         }}
              //       />

              //       {type === "posts" && (
              //         <>
              //           <View h="$1" w={1} bg="$color6" />
              //           <PostSortBar />
              //         </>
              //       )}
              //     </XStack>
              //     <></>
              //   </ContentGutters>
              // );
            }

            if (isPost(item)) {
              return <Post {...item} />;
            }

            return <Comment path={item.comment.path} />;
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          stickyHeaderIndices={[1]}
          estimatedItemSize={475}
          refresh={refetch}
        />
      </IonContent>
    </IonPage>
  );
}
