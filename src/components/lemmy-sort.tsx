import { CommentSortType } from "lemmy-js-client";
import { useState } from "react";
import { Option, Select, SelectProps } from "~/src/components/select";
import {
  Flame,
  ArrowUpCircle,
  Clock3,
  Sword,
  Hourglass,
} from "@tamagui/lucide-icons";
import type { IconProps } from "@tamagui/helpers-icon";

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

export function useCommentSort() {
  const [sort, setSort] = useState<CommentSortType>("Hot");
  return {
    sort,
    setSort,
  };
}

export function ComentSortSelect(
  props: Omit<SelectProps<CommentSortType>, "options">,
) {
  return (
    <Select
      {...props}
      options={COMMENT_SORT_OPTIONS}
      title="Sort Comments By"
    />
  );
}
