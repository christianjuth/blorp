import {
  CommentSortType,
  CommunitySortType,
  ListingType,
  PostSortType,
} from "lemmy-js-client";
import { Option, Select } from "~/src/components/select";
import {
  Flame,
  ArrowUpCircle,
  Clock3,
  Sword,
  Hourglass,
  ChevronDown,
} from "@tamagui/lucide-icons";
import { useFiltersStore } from "~/src/stores/filters";
import { Text, XStack } from "tamagui";

const COMMUNITY_SORT_OPTIONS: Option<CommunitySortType, CommunitySortType>[] = [
  {
    label: "Hot",
    value: "Hot",
    icon: ArrowUpCircle,
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

function getIconForCommunitySort(sort: CommunitySortType) {
  const Icon = COMMUNITY_SORT_OPTIONS.find((s) => s.value === sort)?.icon;
  return Icon ? <Icon color="$accentColor" /> : undefined;
}

export function CommunitySortSelect() {
  const communitySort = useFiltersStore((s) => s.communitySort);
  const setCommunitySort = useFiltersStore((s) => s.setCommunitySort);
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
    icon: Flame,
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

function getIconForPostSort(sort: PostSortType) {
  const Icon = POST_SORT_OPTIONS.find((s) => s.value === sort)?.icon;
  return Icon ? <Icon color="$accentColor" /> : undefined;
}

export function PostSortSelect() {
  const postSort = useFiltersStore((s) => s.postSort);
  const setPostSort = useFiltersStore((s) => s.setPostSort);
  return (
    <Select
      options={POST_SORT_OPTIONS}
      title="Sort Comments By"
      value={postSort}
      onValueChange={setPostSort}
      trigger={getIconForPostSort(postSort)}
    />
  );
}

const HOME_FILTER: Option<ListingType, ListingType>[] = [
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
      options={HOME_FILTER}
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
