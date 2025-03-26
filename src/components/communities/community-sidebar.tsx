import { useCommunity } from "~/src/lib/lemmy/index";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import Markdown from "react-markdown";
import { abbriviateNumber } from "~/src/lib/format";
// import { CommunityJoinButton } from "./community-join-button";
import { useLinkContext } from "../nav/link-context";
import { useCommunitiesStore } from "~/src/stores/communities";
import { ContentGutters } from "../gutters";
import { LuCakeSlice } from "react-icons/lu";

dayjs.extend(localizedFormat);

export const COMMUNITY_SIDEBAR_WIDTH = 300;

export function CommunitySidebar({
  communityName,
  hideDescription = false,
  asPage,
}: {
  communityName: string;
  hideDescription?: boolean;
  asPage?: boolean;
}) {
  const data = useCommunitiesStore((s) => s.communities[communityName]?.data);

  if (!data) {
    return null;
  }

  const communityView = data.communityView;
  const community = communityView.community;
  const counts = communityView.counts;

  const content = (
    <div className="gap-2 flex flex-col">
      <div
      // ai="flex-start" jc="space-between"
      >
        <div
          className="flex flex-col gap-3"
          // gap="$3"
        >
          <span
            // fontSize="$5" fontWeight="bold"
            className="font-bold leading-3"
          >
            {community.title}
          </span>

          <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <LuCakeSlice />
            <span>Created {dayjs(community.published).format("ll")}</span>
          </div>
        </div>

        {/* <CommunityJoinButton */}
        {/*   communityName={communityName} */}
        {/*   // $gtMd={{ dsp: "none" }} */}
        {/* /> */}
      </div>

      <div className="grid grid-cols-3 text-sm">
        <span className="font-bold">
          {counts && abbriviateNumber(counts.subscribers)}
        </span>
        <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
          Members
        </span>

        <span className="font-bold">
          {counts && abbriviateNumber(counts.posts)}
        </span>
        <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
          Posts
        </span>

        <span className="font-bold">
          {counts && abbriviateNumber(counts.comments)}
        </span>
        <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
          Comments
        </span>
      </div>

      {community.description && !hideDescription && (
        <div
          className="prose dark:prose-invert prose-xs leading-normal pt-3"
          // py="$3" btc="$color0" btw={1}
        >
          <Markdown>{community.description}</Markdown>
        </div>
      )}
    </div>
  );

  return (
    <div
      // position={asPage ? undefined : "absolute"}
      // maxHeight={dimensions.height - header.height}
      // $md={{
      //   maxHeight: dimensions.height - header.height - tabBar.height,
      // }}
      // w="100%"
      // h={asPage ? "100%" : undefined}
      className="gap-3 flex flex-col py-4 absolute inset-x-0 h-[calc(100vh-60px)] overflow-auto"
    >
      {content}
      {/* <ScrollView */}
      {/*   zIndex="$5" */}
      {/*   $md={{ */}
      {/*     p: "$4", */}
      {/*   }} */}
      {/*   flex={1} */}
      {/* > */}
      {/*   {asPage ? ( */}
      {/*     <ContentGutters> */}
      {/*       <View flex={1}>{content}</View> */}
      {/*     </ContentGutters> */}
      {/*   ) : ( */}
      {/*     content */}
      {/*   )} */}
      {/* </ScrollView> */}
    </div>
  );
}

export function SmallScreenSidebar({
  communityName,
}: {
  communityName: string;
}) {
  const linkCtx = useLinkContext();

  useCommunity({
    name: communityName,
  });
  const data = useCommunitiesStore((s) => s.communities[communityName]?.data);

  if (!data) {
    return null;
  }

  const communityView = data.communityView;
  const community = communityView.community;
  const counts = communityView.counts;

  return null;

  // return (
  //   <YStack bg="$background" flex={1} p="$3" gap="$3" $gtMd={{ dsp: "none" }}>
  //     <XStack ai="flex-start" jc="space-between">
  //       <YStack gap="$3">
  //         <Text fontSize="$5" fontWeight="bold">
  //           {community.title}
  //         </Text>

  //         <XStack ai="center" gap="$1.5">
  //           <CakeSlice size="$1" color="$color11" />
  //           <Text fontSize="$3" color="$color11">
  //             Created {dayjs(community.published).format("ll")}
  //           </Text>
  //         </XStack>
  //       </YStack>

  //       <CommunityJoinButton communityName={communityName} />
  //     </XStack>

  //     <XStack>
  //       <YStack gap="$1" flex={1}>
  //         <Text fontWeight="bold" fontSize="$4">
  //           {counts && abbriviateNumber(counts.subscribers)}
  //         </Text>
  //         <Text fontSize="$3" color="$color11">
  //           Members
  //         </Text>
  //       </YStack>

  //       <YStack gap="$1" flex={1}>
  //         <Text fontWeight="bold" fontSize="$4">
  //           {counts && abbriviateNumber(counts.posts)}
  //         </Text>
  //         <Text fontSize="$3" color="$color11">
  //           Posts
  //         </Text>
  //       </YStack>

  //       <YStack gap="$1" flex={1}>
  //         <Text fontWeight="bold" fontSize="$4">
  //           {counts && abbriviateNumber(counts.comments)}
  //         </Text>
  //         <Text fontSize="$3" color="$color11">
  //           Comments
  //         </Text>
  //       </YStack>
  //     </XStack>

  //     <Link href={`${linkCtx.root}c/${communityName}/sidebar`}>
  //       <Text color="$accentColor">Show more</Text>
  //     </Link>
  //   </YStack>
  // );
}
