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
} from "@tamagui/lucide-icons";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useFiltersStore } from "~/src/stores/filters";
import { Text, useTheme, XStack } from "tamagui";
import { ComponentProps } from "react";

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

function getIconForSort(sort: CommentSortType) {
  const Icon = COMMENT_SORT_OPTIONS.find((s) => s.value === sort)?.icon;
  return Icon ? <Icon color="$accentColor" /> : undefined;
}

export function ComentSortSelect() {
  const commentSort = useFiltersStore((s) => s.commentSort);
  const setCommentSort = useFiltersStore((s) => s.setCommentSort);
  return (
    <Select
      options={COMMENT_SORT_OPTIONS}
      title="Sort Comments By"
      value={commentSort}
      onValueChange={setCommentSort}
      trigger={getIconForSort(commentSort)}
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

export function PostSortSelect() {
  const postSort = useFiltersStore((s) => s.postSort);
  const setPostSort = useFiltersStore((s) => s.setPostSort);
  const theme = useTheme();

  function getIconForPostSort(sort: PostSortType) {
    const Icon = POST_SORT_OPTIONS.find((s) => s.value === sort)?.icon;
    return Icon ? <Icon color={theme.accentColor.val} /> : undefined;
  }

  return (
    <Select
      options={POST_SORT_OPTIONS}
      title="Sort Posts By"
      value={postSort}
      onValueChange={setPostSort}
      trigger={getIconForPostSort(postSort)}
    />
  );
}

const LISTING_TYPE_OPTIONS: Option<ListingType, ListingType>[] = [
  {
    label: "All",
    value: "All",
    // icon: Flame,
  },
  {
    label: "Local",
    value: "Local",
    // icon: Flame,
  },
  {
    label: "Subscribed",
    value: "Subscribed",
    // icon: ArrowUpCircle,
  },
  // {
  //   label: "ModeratorView",
  //   value: "ModeratorView",
  //   // icon: ArrowUpCircle,
  // },
];

export function HomeFilter() {
  const homeFilter = useFiltersStore((s) => s.homeFilter);
  const setHomeFilter = useFiltersStore((s) => s.setHomeFilter);
  return (
    <Select
      options={LISTING_TYPE_OPTIONS}
      title="Show posts..."
      value={homeFilter}
      onValueChange={setHomeFilter}
      trigger={
        <XStack ai="center" gap="$1">
          <Text fontWeight="bold">{homeFilter}</Text>
          <ChevronDown size="$1" />
        </XStack>
      }
    />
  );
}

export function CommunityFilter() {
  const communityFilter = useFiltersStore((s) => s.communityFilter);
  const setCommunityFilter = useFiltersStore((s) => s.setCommunityFilter);
  return (
    <Select
      options={LISTING_TYPE_OPTIONS}
      title="Show posts..."
      value={communityFilter}
      onValueChange={setCommunityFilter}
      trigger={
        <XStack ai="center" gap="$1">
          <Text fontWeight="bold">{communityFilter}</Text>
          <ChevronDown size="$1" />
        </XStack>
      }
    />
  );
}
