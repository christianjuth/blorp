import {
  CommentSortType,
  CommunitySortType,
  ListingType,
  PostSortType,
} from "lemmy-js-client";
import { Option, Select } from "~/src/components/ui/select";
import {
  Flame,
  ArrowUpCircle,
  Clock3,
  Sword,
  Hourglass,
  ChevronDown,
  ArrowUpDown,
} from "@tamagui/lucide-icons";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useFiltersStore } from "~/src/stores/filters";
import { Text, useMedia, useTheme, View, XStack } from "tamagui";
import { ComponentProps, useMemo } from "react";
import { useAuth } from "../stores/auth";

function createIcon(defaultProps: ComponentProps<typeof FontAwesome6>) {
  return (
    props: Omit<ComponentProps<typeof FontAwesome6>, "name" | "iconStyle">,
  ) => {
    const theme = useTheme();
    return (
      <FontAwesome6
        {...defaultProps}
        {...props}
        color={props.color ?? theme.color.val}
      />
    );
  };
}

const PersonRunning = createIcon({
  name: "person-running",
  iconStyle: "solid",
  size: 18,
});

const COMMUNITY_SORT_OPTIONS: Option<CommunitySortType, string>[] = [
  {
    label: "Top All",
    value: "TopAll",
    icon: ArrowUpCircle,
  },
  {
    label: "Hot",
    value: "Hot",
    icon: Flame,
  },
  {
    label: "Active",
    value: "Active",
    icon: Flame,
  },
  // {
  //   label: "Scaled",
  //   value: "Scaled",
  //   // icon: Clock3,
  // },
  {
    label: "Controversial",
    value: "Controversial",
    icon: Sword,
  },
  {
    label: "New",
    value: "New",
    icon: Clock3,
  },
  {
    label: "Old",
    value: "Old",
    icon: Hourglass,
  },
];

export function CommunitySortSelect() {
  const communitySort = useFiltersStore((s) => s.communitySort);
  const setCommunitySort = useFiltersStore((s) => s.setCommunitySort);
  const theme = useTheme();

  function getIconForCommunitySort(sort: CommunitySortType) {
    const Icon = COMMUNITY_SORT_OPTIONS.find((s) => s.value === sort)?.icon;
    return Icon ? <Icon color={theme.accentColor.val} /> : undefined;
  }

  return (
    <Select
      options={COMMUNITY_SORT_OPTIONS}
      title="Sort Communities By"
      value={communitySort}
      onValueChange={setCommunitySort}
      trigger={getIconForCommunitySort(communitySort)}
    />
  );
}

const COMMENT_SORT_OPTIONS: Option<CommentSortType, CommentSortType>[] = [
  {
    label: "Hot",
    value: "Hot",
    icon: Flame,
  },
  {
    label: "Top",
    value: "Top",
    icon: ArrowUpCircle,
  },
  {
    label: "New",
    value: "New",
    icon: Clock3,
  },
  {
    label: "Controversial",
    value: "Controversial",
    icon: Sword,
  },
  {
    label: "Old",
    value: "Old",
    icon: Hourglass,
  },
];

export function CommentSortSelect() {
  const commentSort = useFiltersStore((s) => s.commentSort);
  const setCommentSort = useFiltersStore((s) => s.setCommentSort);
  return (
    <Select
      options={COMMENT_SORT_OPTIONS}
      title="Sort Comments By"
      value={commentSort}
      onValueChange={setCommentSort}
      trigger={
        <XStack
          gap="$1.5"
          ai="center"
          bw={1}
          bc="$color5"
          br={99999}
          py={7}
          px={13}
        >
          <Text fontWeight={500} fontSize="$3">
            {commentSort}
          </Text>
          <ArrowUpDown size={15} />
        </XStack>
      }
    />
  );
}

const POST_SORT_OPTIONS: Option<PostSortType, PostSortType>[] = [
  {
    label: "Active",
    value: "Active",
    icon: PersonRunning,
  },
  {
    label: "Hot",
    value: "Hot",
    icon: Flame,
  },
  {
    label: "TopDay",
    value: "TopDay",
    icon: ArrowUpCircle,
  },
  {
    label: "TopWeek",
    value: "TopWeek",
    icon: ArrowUpCircle,
  },
  {
    label: "New",
    value: "New",
    icon: Clock3,
  },
  {
    label: "Controversial",
    value: "Controversial",
    icon: Sword,
  },
  {
    label: "Old",
    value: "Old",
    icon: Hourglass,
  },
];

export function PostSortBar({ hideOnGtMd }: { hideOnGtMd?: boolean }) {
  const postSort = useFiltersStore((s) => s.postSort);
  const setPostSort = useFiltersStore((s) => s.setPostSort);

  const media = useMedia();

  if (hideOnGtMd && media.gtMd) {
    return null;
  }

  return (
    <Select
      options={POST_SORT_OPTIONS}
      title="Sort Posts By"
      value={postSort}
      onValueChange={setPostSort}
      trigger={
        <XStack
          gap="$1.5"
          ai="center"
          bw={1}
          bc="$color5"
          br={99999}
          py={7}
          px={13}
        >
          <Text fontWeight={500} color="$color11" fontSize="$3">
            {postSort}
          </Text>
          <ArrowUpDown size={15} col="$color10" />
        </XStack>
      }
    />
  );
}

export function HomeFilter() {
  const instance = useAuth((s) => s.getSelectedAccount().instance);
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const listingType = useFiltersStore((s) => s.listingType);
  const setListingType = useFiltersStore((s) => s.setListingType);

  const LISTING_TYPE_OPTIONS: Option<ListingType, string>[] = useMemo(
    () => [
      {
        label: "All",
        value: "All",
        // icon: Flame,
      },
      {
        label: `Local (${instance ? new URL(instance).host : ""})`,
        value: "Local",
        // icon: Flame,
      },
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
    ],
    [instance, isLoggedIn],
  );

  return (
    <Select
      options={LISTING_TYPE_OPTIONS}
      title="Explore posts..."
      value={listingType}
      onValueChange={setListingType}
      trigger={
        <XStack ai="center" gap="$1">
          <Text fontWeight={900} fontSize="$5">
            {
              LISTING_TYPE_OPTIONS.find(
                (option) => option.value === listingType,
              )?.value
            }
          </Text>
          <ChevronDown size="$1" col="$color10" />
        </XStack>
      }
    />
  );
}

export function CommunityFilter() {
  const instance = useAuth((s) => s.getSelectedAccount().instance);

  const listingType = useFiltersStore((s) => s.communitiesListingType);
  const setListingType = useFiltersStore((s) => s.setCommunitiesListingType);
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const LISTING_TYPE_OPTIONS: Option<ListingType, string>[] = useMemo(
    () => [
      {
        label: "All",
        value: "All",
        // icon: Flame,
      },
      {
        label: `Local (${instance ? new URL(instance).host : ""})`,
        value: "Local",
        // icon: Flame,
      },
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
    ],
    [instance, isLoggedIn],
  );

  return (
    <Select
      options={LISTING_TYPE_OPTIONS}
      title="Show posts..."
      value={listingType}
      onValueChange={setListingType}
      trigger={
        <XStack ai="center" gap="$1">
          <Text fontWeight={900} fontSize="$5">
            {
              LISTING_TYPE_OPTIONS.find(
                (option) => option.value === listingType,
              )?.value
            }
          </Text>
          <ChevronDown size="$1" col="$color10" />
        </XStack>
      }
    />
  );
}
