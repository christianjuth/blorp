import { PostSortType } from "lemmy-js-client";
import { useFiltersStore } from "@/src/stores/filters";
import { useMemo } from "react";
import { useAuth } from "../stores/auth";
import { useMedia } from "../lib/hooks";
import { ActionMenu, ActionMenuProps } from "./action-menu";

import { TbArrowsDownUp, TbMessageCircle } from "react-icons/tb";
import { LuClock3, LuCalendarArrowUp } from "react-icons/lu";
import {
  FaPersonRunning,
  FaCaretDown,
  FaArrowTrendUp,
  FaHourglassEnd,
} from "react-icons/fa6";
import { IoSkullOutline } from "react-icons/io5";
import { TbMessageCircleUp } from "react-icons/tb";
import { PiFireSimpleBold } from "react-icons/pi";

export function CommunitySortSelect() {
  const communitySort = useFiltersStore((s) => s.communitySort);
  const setCommunitySort = useFiltersStore((s) => s.setCommunitySort);

  // function getIconForCommunitySort(sort: CommunitySortType) {
  //   const Icon = COMMUNITY_SORT_OPTIONS.find((s) => s.value === sort)?.icon;
  //   return Icon ? <Icon /> : undefined;
  // }
  //
  //

  const COMMUNITY_SORT_OPTIONS = useMemo(
    () =>
      [
        {
          label: "Top All",
          value: "TopAll",
          // icon: ArrowUpCircle,
        } as const,
        {
          label: "Hot",
          value: "Hot",
          // icon: Flame,
        } as const,
        {
          label: "Active",
          value: "Active",
          // icon: Flame,
        } as const,
        // {
        //   label: "Scaled",
        //   value: "Scaled",
        //   // icon: Clock3,
        // },
        {
          label: "Controversial",
          value: "Controversial",
          // icon: Sword,
        } as const,
        {
          label: "New",
          value: "New",
          // icon: Clock3,
        } as const,
        {
          label: "Old",
          value: "Old",
          // icon: Hourglass,
        } as const,
      ].map((opt) => ({
        value: opt.value,
        text: opt.label,
        onClick: () => setCommunitySort(opt.value),
      })),
    [],
  );

  return (
    <ActionMenu
      align="start"
      header="Community Sort"
      actions={COMMUNITY_SORT_OPTIONS}
      trigger={
        <div className="flex flex-row items-center gap-1 h-7.5 px-4 border rounded-full text-sm text-muted-foreground">
          <span className="capitalize text-sort">
            {
              COMMUNITY_SORT_OPTIONS.find(
                ({ value }) => value === communitySort,
              )?.text
            }
          </span>
          <TbArrowsDownUp />
        </div>
      }
    />
  );

  // return (
  //   <Select
  //     options={COMMUNITY_SORT_OPTIONS}
  //     title="Sort Communities By"
  //     value={communitySort}
  //     onValueChange={setCommunitySort}
  //     // trigger={getIconForCommunitySort(communitySort)}
  //   />
  // );
}

const COMMENT_SORT_OPTIONS = [
  {
    label: "Hot",
    value: "Hot",
    // icon: Flame,
  },
  {
    label: "Top",
    value: "Top",
    // icon: ArrowUpCircle,
  },
  {
    label: "New",
    value: "New",
    // icon: Clock3,
  },
  {
    label: "Controversial",
    value: "Controversial",
    // icon: Sword,
  },
  {
    label: "Old",
    value: "Old",
    // icon: Hourglass,
  },
];

export function CommentSortSelect() {
  const commentSort = useFiltersStore((s) => s.commentSort);
  const setCommentSort = useFiltersStore((s) => s.setCommentSort);
  return null;
  // return (
  //   <Select
  //     options={COMMENT_SORT_OPTIONS}
  //     title="Sort Comments By"
  //     value={commentSort}
  //     onValueChange={setCommentSort}
  //     trigger={
  //       <XStack
  //         gap="$1.5"
  //         ai="center"
  //         bw={1}
  //         bc="$color5"
  //         br={99999}
  //         py={7}
  //         px={13}
  //       >
  //         <Text fontWeight={500} fontSize="$3">
  //           {commentSort}
  //         </Text>
  //         <ArrowUpDown size={15} />
  //       </XStack>
  //     }
  //   />
  // );
}

function getIconForSort(sort: PostSortType) {
  if (sort.startsWith("Top")) {
    return <LuCalendarArrowUp />;
  }

  switch (sort) {
    case "Hot":
      return <PiFireSimpleBold />;
    case "Active":
      return <FaPersonRunning />;
    case "New":
      return <LuClock3 />;
    case "Controversial":
      return <IoSkullOutline />;
    case "Scaled":
      return <FaArrowTrendUp />;
    case "MostComments":
      return <TbMessageCircleUp />;
    case "NewComments":
      return <TbMessageCircle />;
    case "Old":
      return <FaHourglassEnd />;
    default:
      return <TbArrowsDownUp />;
  }
}

export function PostSortBar({
  hideOnGtMd,
  align = "end",
}: {
  hideOnGtMd?: boolean;
  align?: "start" | "end";
}) {
  const postSort = useFiltersStore((s) => s.postSort);
  const setPostSort = useFiltersStore((s) => s.setPostSort);

  const media = useMedia();

  const actions: ActionMenuProps["actions"] = useMemo(
    () => [
      {
        text: "Active",
        onClick: () => setPostSort("Active"),
      },
      {
        text: "Hot",
        onClick: () => setPostSort("Hot"),
      },
      {
        text: "Top",
        actions: [
          {
            text: "Hour",
            onClick: () => setPostSort("TopHour"),
          },
          {
            text: "6 Hours",
            onClick: () => setPostSort("TopSixHour"),
          },
          {
            text: "12 Hours",
            onClick: () => setPostSort("TopTwelveHour"),
          },
          {
            text: "Day",
            onClick: () => setPostSort("TopDay"),
          },
          {
            text: "Week",
            onClick: () => setPostSort("TopWeek"),
          },
          {
            text: "Month",
            onClick: () => setPostSort("TopMonth"),
          },
          {
            text: "3 Months",
            onClick: () => setPostSort("TopThreeMonths"),
          },
          {
            text: "6 Months",
            onClick: () => setPostSort("TopSixMonths"),
          },
          {
            text: "9 Months",
            onClick: () => setPostSort("TopNineMonths"),
          },
          {
            text: "Year",
            onClick: () => setPostSort("TopYear"),
          },
          {
            text: "All Time",
            onClick: () => setPostSort("TopAll"),
          },
        ],
      },
      {
        text: "New",
        onClick: () => setPostSort("New"),
      },
      {
        text: "Controversial",
        onClick: () => setPostSort("Controversial"),
      },
      {
        text: "Scaled",
        onClick: () => setPostSort("Scaled"),
      },
      {
        text: "Most Comments",
        onClick: () => setPostSort("MostComments"),
      },
      {
        text: "New Comments",
        onClick: () => setPostSort("NewComments"),
      },
      {
        text: "Old",
        onClick: () => setPostSort("Old"),
      },
    ],
    [],
  );

  if (hideOnGtMd && media.md) {
    return null;
  }

  return (
    <ActionMenu
      header="Sort by"
      align={align}
      actions={actions}
      trigger={
        <div className="flex flex-row items-center gap-1 h-7.5 text-xl text-brand">
          {getIconForSort(postSort)}
        </div>
      }
    />
  );
}

export function HomeFilter() {
  const instance = useAuth((s) => s.getSelectedAccount().instance);
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const listingType = useFiltersStore((s) => s.listingType);
  const setListingType = useFiltersStore((s) => s.setListingType);

  const LISTING_TYPE_OPTIONS: ActionMenuProps["actions"] = useMemo(
    () =>
      [
        {
          label: "All",
          value: "All",
          // icon: Flame,
        } as const,
        {
          label: `Local (${instance ? new URL(instance).host : ""})`,
          value: "Local",
          // icon: Flame,
        } as const,
        ...(isLoggedIn
          ? ([
              {
                label: "Subscribed",
                value: "Subscribed",
                // icon: ArrowUpCircle,
              },
            ] as const)
          : []),
        // {
        //   label: "ModeratorView",
        //   value: "ModeratorView",
        //   // icon: ArrowUpCircle,
        // },
      ].map((opt) => ({
        text: opt.label,
        value: opt.value,
        onClick: () => setListingType(opt.value),
      })),
    [instance, isLoggedIn],
  );

  return (
    <ActionMenu
      align="start"
      actions={LISTING_TYPE_OPTIONS}
      trigger={
        <div className="flex flex-row items-center gap-0.5 text-lg">
          <span className="font-black capitalize">{listingType}</span>
          <FaCaretDown className="text-muted-foreground" />
        </div>
      }
    />
  );
}

export function CommunityFilter() {
  const instance = useAuth((s) => s.getSelectedAccount().instance);

  const listingType = useFiltersStore((s) => s.communitiesListingType);
  const setListingType = useFiltersStore((s) => s.setCommunitiesListingType);
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const LISTING_TYPE_OPTIONS = useMemo(
    () =>
      [
        {
          label: "All",
          value: "All",
          // icon: Flame,
        } as const,
        {
          label: `Local (${instance ? new URL(instance).host : ""})`,
          value: "Local",
          // icon: Flame,
        } as const,
        ...(isLoggedIn
          ? ([
              {
                label: "Subscribed",
                value: "Subscribed",
                // icon: ArrowUpCircle,
              },
            ] as const)
          : []),
        // {
        //   label: "ModeratorView",
        //   value: "ModeratorView",
        //   // icon: ArrowUpCircle,
        // },
      ].map((opt) => ({
        text: opt.label,
        value: opt.value,
        onClick: () => setListingType(opt.value),
      })),
    [instance, isLoggedIn],
  );

  return (
    <ActionMenu
      align="start"
      actions={LISTING_TYPE_OPTIONS}
      trigger={
        <div className="flex flex-row items-center gap-0.5 text-lg">
          <span className="font-black capitalize">{listingType}</span>
          <FaCaretDown className="text-muted-foreground" />
        </div>
      }
    />
  );
}
