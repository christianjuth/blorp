import { CommentSortType } from "lemmy-js-client";
import { Option, Select } from "~/src/components/select";
import {
  Flame,
  ArrowUpCircle,
  Clock3,
  Sword,
  Hourglass,
} from "@tamagui/lucide-icons";
import { useSettings } from "~/src/stores/settings";

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
  const commentSort = useSettings((s) => s.commentSort);
  const setCommentSort = useSettings((s) => s.setCommentSort);
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
