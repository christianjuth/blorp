import { CommentSortType, PostSortType } from "lemmy-js-client";
import { Option, Select } from "~/src/components/select";
import {
  Flame,
  ArrowUpCircle,
  Clock3,
  Sword,
  Hourglass,
} from "@tamagui/lucide-icons";
import { useSorts } from "~/src/stores/sorts";

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
  return Icon ? <Icon /> : undefined;
}

export function ComentSortSelect() {
  const commentSort = useSorts((s) => s.commentSort);
  const setCommentSort = useSorts((s) => s.setCommentSort);
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
  return Icon ? <Icon /> : undefined;
}

export function PostSortSelect() {
  const postSort = useSorts((s) => s.postSort);
  const setPostSort = useSorts((s) => s.setPostSort);
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
