import {
  CommentSortType,
  CommunitySortType,
  PostSortType,
} from "lemmy-js-client";
import { useFiltersStore } from "@/src/stores/filters";
import { useMemo } from "react";
import { useAuth } from "../stores/auth";
import { useMedia } from "../lib/hooks";
import { ActionMenu, ActionMenuProps } from "./adaptable/action-menu";

import { TbArrowsDownUp, TbMessageCircle } from "react-icons/tb";
import { LuClock3, LuCalendarArrowUp } from "react-icons/lu";
import {
  FaPersonRunning,
  FaArrowTrendUp,
  FaHourglassEnd,
} from "react-icons/fa6";

import { IoSkullOutline, IoChevronDown } from "react-icons/io5";
import { TbMessageCircleUp } from "react-icons/tb";
import { PiFireSimpleBold } from "react-icons/pi";
import { FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

function getIconCommunitySort(sort: CommunitySortType) {
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
    case "NameAsc":
      return <FaSortAlphaDown />;
    case "NameDesc":
      return <FaSortAlphaUp />;
    default:
      return <TbArrowsDownUp />;
  }
}

export function CommunitySortSelect() {
  const communitySort = useFiltersStore((s) => s.communitySort);
  const setCommunitySort = useFiltersStore((s) => s.setCommunitySort);

  const actions: ActionMenuProps<CommunitySortType>["actions"] = useMemo(
    () => [
      {
        text: "Active",
        value: "Active",
        onClick: () => setCommunitySort("Active"),
      },
      {
        text: "Hot",
        value: "Hot",
        onClick: () => setCommunitySort("Hot"),
      },
      {
        text: "New",
        value: "New",
        onClick: () => setCommunitySort("New"),
      },
      {
        text: "Old",
        value: "Old",
        onClick: () => setCommunitySort("Old"),
      },
      {
        text: "Top",
        actions: [
          {
            text: "Hour",
            value: "TopHour",
            onClick: () => setCommunitySort("TopHour"),
          },
          {
            text: "6 Hours",
            value: "TopSixHour",
            onClick: () => setCommunitySort("TopSixHour"),
          },
          {
            text: "12 Hours",
            value: "TopTwelveHour",
            onClick: () => setCommunitySort("TopTwelveHour"),
          },
          {
            text: "Day",
            value: "TopDay",
            onClick: () => setCommunitySort("TopDay"),
          },
          {
            text: "Week",
            value: "TopWeek",
            onClick: () => setCommunitySort("TopWeek"),
          },
          {
            text: "Month",
            value: "TopMonth",
            onClick: () => setCommunitySort("TopMonth"),
          },
          {
            text: "3 Months",
            value: "TopThreeMonths",
            onClick: () => setCommunitySort("TopThreeMonths"),
          },
          {
            text: "6 Months",
            value: "TopSixMonths",
            onClick: () => setCommunitySort("TopSixMonths"),
          },
          {
            text: "9 Months",
            value: "TopNineMonths",
            onClick: () => setCommunitySort("TopNineMonths"),
          },
          {
            text: "Year",
            value: "TopYear",
            onClick: () => setCommunitySort("TopYear"),
          },
          {
            text: "All Time",
            value: "TopAll",
            onClick: () => setCommunitySort("TopAll"),
          },
        ],
      },
      {
        text: "Comments",
        actions: [
          {
            text: "Most",
            value: "MostComments",
            onClick: () => setCommunitySort("MostComments"),
          },
          {
            text: "New",
            value: "NewComments",
            onClick: () => setCommunitySort("NewComments"),
          },
        ],
      },
      {
        text: "Controversial",
        value: "Controversial",
        onClick: () => setCommunitySort("Controversial"),
      },
      {
        text: "Scaled",
        value: "Scaled",
        onClick: () => setCommunitySort("Scaled"),
      },
      {
        text: "Name",
        actions: [
          {
            text: "Asc",
            value: "NameAsc",
            onClick: () => setCommunitySort("NameAsc"),
          },
          {
            text: "Desc",
            value: "NameDesc",
            onClick: () => setCommunitySort("NameDesc"),
          },
        ],
      },
    ],
    [],
  );

  return (
    <ActionMenu
      align="end"
      header="Community Sort"
      actions={actions}
      selectedValue={communitySort}
      trigger={
        <div className="text-xl text-brand">
          {getIconCommunitySort(communitySort)}
        </div>
      }
    />
  );
}

function getIconCommentSort(sort: CommentSortType) {
  switch (sort) {
    case "Top":
      return <LuCalendarArrowUp />;
    case "Hot":
      return <PiFireSimpleBold />;
    case "New":
      return <LuClock3 />;
    case "Controversial":
      return <IoSkullOutline />;
    case "Old":
      return <FaHourglassEnd />;
    default:
      return <TbArrowsDownUp />;
  }
}

export function CommentSortSelect() {
  const commentSort = useFiltersStore((s) => s.commentSort);
  const setCommentSort = useFiltersStore((s) => s.setCommentSort);

  const COMMENT_SORT_OPTIONS: ActionMenuProps<CommentSortType>["actions"] =
    useMemo(
      () => [
        {
          text: "Hot",
          onClick: () => setCommentSort("Hot"),
          value: "Hot",
        },
        {
          text: "Top",
          onClick: () => setCommentSort("Top"),
          value: "Top",
        },
        {
          text: "New",
          onClick: () => setCommentSort("New"),
          value: "New",
        },
        {
          text: "Controversial",
          onClick: () => setCommentSort("Controversial"),
          value: "Controversial",
        },
        {
          text: "Old",
          onClick: () => setCommentSort("Old"),
          value: "Old",
        },
      ],
      [],
    );

  return (
    <ActionMenu
      align="start"
      header="Comment Sort"
      actions={COMMENT_SORT_OPTIONS}
      selectedValue={commentSort}
      trigger={
        <Button
          size="sm"
          variant="ghost"
          className="text-md font-normal text-brand hover:text-brand"
          asChild
        >
          <div>
            Sort
            {getIconCommentSort(commentSort)}
          </div>
        </Button>
      }
    />
  );
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

export function PostSortButton({
  hideOnGtMd,
  align = "end",
  variant = "icon",
  className,
}: {
  hideOnGtMd?: boolean;
  align?: "start" | "end";
  variant?: "button" | "icon";
  className?: string;
}) {
  const postSort = useFiltersStore((s) => s.postSort);
  const setPostSort = useFiltersStore((s) => s.setPostSort);

  const media = useMedia();

  const actions: ActionMenuProps<PostSortType>["actions"] = useMemo(
    () => [
      {
        text: "Active",
        value: "Active",
        onClick: () => setPostSort("Active"),
      },
      {
        text: "Hot",
        value: "Hot",
        onClick: () => setPostSort("Hot"),
      },
      {
        text: "Top",
        actions: [
          {
            text: "Hour",
            value: "TopHour",
            onClick: () => setPostSort("TopHour"),
          },
          {
            text: "6 Hours",
            value: "TopSixHour",
            onClick: () => setPostSort("TopSixHour"),
          },
          {
            text: "12 Hours",
            value: "TopTwelveHour",
            onClick: () => setPostSort("TopTwelveHour"),
          },
          {
            text: "Day",
            value: "TopDay",
            onClick: () => setPostSort("TopDay"),
          },
          {
            text: "Week",
            value: "TopWeek",
            onClick: () => setPostSort("TopWeek"),
          },
          {
            text: "Month",
            value: "TopMonth",
            onClick: () => setPostSort("TopMonth"),
          },
          {
            text: "3 Months",
            value: "TopThreeMonths",
            onClick: () => setPostSort("TopThreeMonths"),
          },
          {
            text: "6 Months",
            value: "TopSixMonths",
            onClick: () => setPostSort("TopSixMonths"),
          },
          {
            text: "9 Months",
            value: "TopNineMonths",
            onClick: () => setPostSort("TopNineMonths"),
          },
          {
            text: "Year",
            value: "TopYear",
            onClick: () => setPostSort("TopYear"),
          },
          {
            text: "All Time",
            value: "TopAll",
            onClick: () => setPostSort("TopAll"),
          },
        ],
      },
      {
        text: "New",
        value: "New",
        onClick: () => setPostSort("New"),
      },
      {
        text: "Controversial",
        value: "Controversial",
        onClick: () => setPostSort("Controversial"),
      },
      {
        text: "Scaled",
        value: "Scaled",
        onClick: () => setPostSort("Scaled"),
      },
      {
        text: "Most Comments",
        value: "MostComments",
        onClick: () => setPostSort("MostComments"),
      },
      {
        text: "New Comments",
        value: "NewComments",
        onClick: () => setPostSort("NewComments"),
      },
      {
        text: "Old",
        value: "Old",
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
      selectedValue={postSort}
      triggerAsChild={variant === "button"}
      trigger={
        variant === "button" ? (
          <Button size="sm" variant="outline" className={className}>
            {postSort}
            {getIconForSort(postSort)}
          </Button>
        ) : (
          <div className={cn("text-xl", className)}>
            {getIconForSort(postSort)}
          </div>
        )
      }
    />
  );
}

export function HomeFilter({ children }: { children?: React.ReactNode }) {
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
        } as const,
        {
          label: `Local (${instance ? new URL(instance).host : ""})`,
          value: "Local",
        } as const,
        ...(isLoggedIn
          ? ([
              {
                label: "Subscribed",
                value: "Subscribed",
              },
              {
                label: "Moderating",
                value: "ModeratorView",
              },
            ] as const)
          : []),
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
      selectedValue={listingType}
      trigger={
        children ?? (
          <div className="flex flex-row items-center gap-0.5 text-lg">
            <span className="font-black capitalize">
              {listingType === "ModeratorView" ? "Moderating" : listingType}
            </span>
            <IoChevronDown className="text-muted-foreground" />
          </div>
        )
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
        } as const,
        {
          label: `Local (${instance ? new URL(instance).host : ""})`,
          value: "Local",
        } as const,
        ...(isLoggedIn
          ? ([
              {
                label: "Subscribed",
                value: "Subscribed",
              },

              {
                label: "Moderating",
                value: "ModeratorView",
              },
            ] as const)
          : []),
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
      selectedValue={listingType}
      trigger={
        <div className="flex flex-row items-center gap-0.5 text-lg">
          <span className="font-black capitalize">
            {listingType === "ModeratorView" ? "Moderating" : listingType}
          </span>
          <IoChevronDown className="text-muted-foreground" />
        </div>
      }
    />
  );
}
