import { CommentSortType } from "lemmy-js-client";
import { useState } from "react";
import { Select, SelectProps } from "~/src/components/select";

const COMMENT_SORT_OPTIONS: {
  label: CommentSortType;
  value: CommentSortType;
}[] = [
  {
    label: "Hot",
    value: "Hot",
  },
  {
    label: "Top",
    value: "Top",
  },
  {
    label: "New",
    value: "New",
  },
  {
    label: "Controversial",
    value: "Controversial",
  },
  {
    label: "Old",
    value: "Old",
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
  return <Select {...props} options={COMMENT_SORT_OPTIONS} native />;
}
