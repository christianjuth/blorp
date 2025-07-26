import {
  FeedPostCard,
  PostCardSkeleton,
  PostProps,
} from "@/src/components/posts/post";
import {
  CommunitySidebar,
  SmallScreenSidebar,
} from "@/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";
import { Fragment, memo, useEffect, useMemo, useState } from "react";
import { VirtualList } from "../components/virtual-list";
import { useCommunity, useMostRecentPost, usePosts } from "../lib/api";
import { PostReportProvider } from "../components/posts/post-report";
import _ from "lodash";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import { useParams } from "@/src/routing/index";
import { CommunityBanner } from "../components/communities/community-banner";
import { useRecentCommunitiesStore } from "../stores/recent-communities";

import { UserDropdown } from "../components/nav";
import { PostSortButton } from "../components/lemmy-sort";
import { PageTitle } from "../components/page-title";
import { useLinkContext } from "../routing/link-context";
import { Link } from "@/src/routing/index";
import { useFiltersStore } from "../stores/filters";
import { Button } from "../components/ui/button";
import { dispatchScrollEvent } from "../lib/scroll-events";
import { LuLoaderCircle } from "react-icons/lu";
import { FaArrowUp } from "react-icons/fa6";
import { useMedia } from "../lib/hooks";
import { CommunityFeedSortBar } from "../components/communities/community-feed-sort-bar";
import { ToolbarTitle } from "../components/toolbar/toolbar-title";
import { getAccountSite, useAuth } from "../stores/auth";
import { usePostsStore } from "../stores/posts";
import { Search } from "../components/icons";
import { ToolbarBackButton } from "../components/toolbar/toolbar-back-button";
import { Separator } from "../components/ui/separator";

const EMPTY_ARR: never[] = [];

const NO_ITEMS = "NO_ITEMS";
type Item = string;

const Post = memo((props: PostProps) => (
  <ContentGutters className="px-0">
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

export default function CommunityFeed() {
  const media = useMedia();

  const linkCtx = useLinkContext();
  const router = useIonRouter();
  const [search, setSearch] = useState("");

  const { communityName } = useParams(`${linkCtx.root}c/:communityName`);

  const postSort = useFiltersStore((s) => s.postSort);
  const posts = usePosts({
    communitySlug: communityName,
  });
  const data = useMemo(
    () => _.uniq(posts.data?.pages.flatMap((p) => p.posts)) ?? EMPTY_ARR,
    [posts.data],
  );

  const mostRecentPost = useMostRecentPost("community", {
    communitySlug: communityName,
  });

  const community = useCommunity({
    name: communityName,
  });

  const modApIds = community.data?.mods.map((m) => m.apId);
  const adminApIds = useAuth(
    (s) => getAccountSite(s.getSelectedAccount())?.admins,
  )?.map((a) => a.apId);

  const updateRecent = useRecentCommunitiesStore((s) => s.update);

  useEffect(() => {
    if (community.data) {
      updateRecent(community.data.community);
    }
  }, [community.data]);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  const mostRecentPostApId = mostRecentPost?.data?.post.apId;
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const hasNewPost = usePostsStore((s) =>
    mostRecentPostApId
      ? !(getCachePrefixer()(mostRecentPostApId) in s.posts)
      : false,
  );

  return (
    <IonPage>
      <PageTitle>{communityName}</PageTitle>
      <IonHeader>
        <IonToolbar
          data-tauri-drag-region
          style={
            media.maxMd
              ? {
                  "--border-color": "var(--color-background)",
                }
              : undefined
          }
        >
          <IonButtons slot="start" className="gap-2">
            <ToolbarBackButton />
            <ToolbarTitle size="sm" className="md:hidden max-md:text-white">
              {communityName}
            </ToolbarTitle>
          </IonButtons>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`${linkCtx.root}c/${communityName}/s?q=${search}`);
            }}
            data-tauri-drag-region
            className="max-md:hidden"
          >
            <IonSearchbar
              className="max-w-md mx-auto"
              placeholder={`Search ${communityName}`}
              value={search}
              onIonInput={(e) => setSearch(e.detail.value ?? "")}
            />
          </form>
          <IonButtons slot="end" className="gap-3.5 md:gap-4.5">
            <Link
              to={`${linkCtx.root}c/:communityName/s`}
              params={{
                communityName,
              }}
              className="text-2xl contents md:hidden"
            >
              <Search className="text-brand scale-110 dark:text-muted-foreground" />
            </Link>
            <div className="md:hidden contents">
              <PostSortButton
                align="end"
                className="text-brand dark:text-muted-foreground"
              />
            </div>
            <UserDropdown />
          </IonButtons>
        </IonToolbar>

        {hasNewPost && (
          <ContentGutters className="absolute mt-2 inset-x-0">
            <div className="flex flex-row justify-center flex-1">
              <Button
                variant="outline"
                size="sm"
                className="absolute"
                onClick={() => {
                  refetch().then(() =>
                    dispatchScrollEvent(router.routeInfo.pathname),
                  );
                }}
              >
                New posts
                {isRefetching ? (
                  <LuLoaderCircle className="animate-spin" />
                ) : (
                  <FaArrowUp />
                )}
              </Button>
            </div>
            <></>
          </ContentGutters>
        )}
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <VirtualList<Item>
            key={postSort}
            className="h-full ion-content-scroll-host"
            data={
              data.length === 0 && !posts.isRefetching && !posts.isPending
                ? [NO_ITEMS]
                : data
            }
            stickyHeaderIndices={[1, 2]}
            header={[
              <Fragment key="community-header">
                <SmallScreenSidebar
                  communityName={communityName}
                  actorId={community.data?.community.apId}
                />
                <ContentGutters className="max-md:hidden pt-4">
                  <CommunityBanner communityName={communityName} />
                  <></>
                </ContentGutters>
              </Fragment>,
              <CommunityFeedSortBar
                communityName={communityName}
                key="community-sort-bar"
              />,
              <Separator
                key="separator"
                className="[[data-is-sticky-header=false]_&]:opacity-1"
              />,
            ]}
            renderItem={({ item }) => {
              if (item === NO_ITEMS) {
                return (
                  <ContentGutters>
                    <div className="flex-1 italic text-muted-foreground p-6 text-center">
                      <span>Nothing to see here</span>
                    </div>
                    <></>
                  </ContentGutters>
                );
              }
              return (
                <Post
                  apId={item}
                  featuredContext="community"
                  modApIds={modApIds}
                  adminApIds={adminApIds}
                />
              );
            }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            estimatedItemSize={475}
            refresh={() => Promise.all([refetch(), mostRecentPost.refetch()])}
            placeholder={
              posts.isPending ? (
                <ContentGutters className="px-0">
                  <PostCardSkeleton />
                  <></>
                </ContentGutters>
              ) : undefined
            }
          />
        </PostReportProvider>

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0 z-10">
          <div className="flex-1" />
          {communityName && (
            <CommunitySidebar
              communityName={communityName}
              actorId={community.data?.community.apId}
            />
          )}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
