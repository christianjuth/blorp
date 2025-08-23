import { create } from "zustand";

type CommentKey = string | number;

interface BearState {
  replies: Record<CommentKey, string | null>;
  editing: Record<CommentKey, boolean>;
  setComment: (key: CommentKey, value: string | null) => void;
  getComment: (key: CommentKey) => string | undefined;
  isEditing: (key: CommentKey) => boolean;
  setIsEditing: (key: CommentKey, isEditing: boolean) => void;
}

export const useCommentRepliesStore = create<BearState>()((set, get) => ({
  replies: {},
  editing: {},
  setComment: (key, value) => {
    return set((prev) => ({
      ...prev,
      replies: {
        ...prev.replies,
        [key]: value,
      },
    }));
  },
  getComment: (key) => {
    return get().replies[key] ?? undefined;
  },
  setIsEditing: (key, isEditing) => {
    return set((prev) => ({
      ...prev,
      editing: {
        ...prev.editing,
        [key]: isEditing,
      },
    }));
  },
  isEditing: (key) => {
    return get().editing[key] ?? false;
  },
}));
