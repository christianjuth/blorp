import {
  FeedPostCard,
  getPostProps,
  PostProps,
} from "~/src/components/posts/post";
import {
  CommunitySidebar,
  SmallScreenSidebar,
} from "~/src/components/communities/community-sidebar";
import { ContentGutters } from "../components/gutters";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { FlashList } from "../components/flashlist";
import { useCommunity, useMostRecentPost, usePosts } from "../lib/lemmy";
import { PostReportProvider } from "../components/posts/post-report";
// import { RefreshButton } from "../components/ui/button";
import { isNotNull } from "../lib/utils";
import { usePostsStore } from "../stores/posts";
import _ from "lodash";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import { useParams } from "react-router";
import { CommunityBanner } from "../components/communities/community-banner";
import { useRecentCommunitiesStore } from "../stores/recent-communities";

import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { UserDropdown } from "../components/nav";
import { PostSortBar } from "../components/lemmy-sort";
import { Title } from "../components/title";
import { useLinkContext } from "../components/nav/link-context";

const EMPTY_ARR = [];

const SIDEBAR_MOBILE = "sidebar-mobile";
const BANNER = "banner";

type Item = typeof SIDEBAR_MOBILE | typeof BANNER | PostProps;

const Post = memo((props: PostProps) => (
  <ContentGutters className="px-0">
    <FeedPostCard {...props} />
    <></>
  </ContentGutters>
));

export default function CommunityFeed() {
  const linkCtx = useLinkContext();
  const router = useIonRouter();
  const [search, setSearch] = useState("");

  const { communityName } = useParams<{ communityName: string }>();

  const posts = usePosts({
    community_name: communityName,
  });

  const mostRecentPost = useMostRecentPost({
    community_name: communityName,
  });

  const community = useCommunity({
    name: communityName,
  });

  const updateRecent = useRecentCommunitiesStore((s) => s.update);

  useEffect(() => {
    if (community.data) {
      updateRecent(community.data.community_view.community);
    }
  }, [community.data]);

  // const tabBar = useCustomTabBarHeight();

  // const ref = useRef<FlashList<any>>(null);
  // useScrollToTop(ref);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = posts;

  const postCache = usePostsStore((s) => s.posts);

  const data = useMemo(() => {
    const postIds = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;

    const postViews = postIds
      .map((apId) => {
        const postView = postCache[apId]?.data;
        return postView ? getPostProps(postView, "community") : null;
      })
      .filter(isNotNull);

    return [BANNER, SIDEBAR_MOBILE, ...postViews] as const;
  }, [posts.data?.pages, postCache]);

  const firstPost = posts.data?.pages[0]?.posts[0];
  const hasNewPost = mostRecentPost?.data?.post.ap_id !== firstPost;

  return (
    <IonPage>
      <Title>{communityName}</Title>
      <IonHeader>
        <IonToolbar data-tauri-drag-region>
          <IonButtons slot="start">
            <IonBackButton text="" />
          </IonButtons>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`${linkCtx.root}c/${communityName}/s?q=${search}`);
            }}
          >
            <IonSearchbar
              mode="ios"
              className="max-w-md mx-auto"
              placeholder={`Search ${communityName}`}
              value={search}
              onIonInput={(e) => setSearch(e.detail.value ?? "")}
            />
          </form>
          <IonButtons slot="end" className="gap-3">
            <PostSortBar align="end" />
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <PostReportProvider>
          <FlashList<Item>
            className="h-full ion-content-scroll-host"
            // ref={ref}
            data={data}
            renderItem={({ item }) => {
              if (item === SIDEBAR_MOBILE) {
                return communityName ? (
                  <ContentGutters>
                    <SmallScreenSidebar communityName={communityName} />
                    <></>
                  </ContentGutters>
                ) : (
                  <></>
                );
              }

              if (item === BANNER) {
                return (
                  <ContentGutters className="max-md:hidden pt-3">
                    <CommunityBanner communityName={communityName} />
                    <></>
                  </ContentGutters>
                );
              }

              return <Post {...item} />;
            }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            estimatedItemSize={475}
            refresh={() => Promise.all([refetch(), mostRecentPost.refetch()])}
          />
        </PostReportProvider>

        <ContentGutters className="max-md:hidden absolute top-0 right-0 left-0">
          <div className="flex-1" />
          {communityName && <CommunitySidebar communityName={communityName} />}
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}
