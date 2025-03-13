import { useEffect } from "react";
import { usePostsStore } from "./posts";
import { useCommunitiesStore } from "./communities";
import { useCommentsStore } from "./comments";
import { clearCache } from "../components/image";

export function GarbageCollector() {
  const cleanupPosts = usePostsStore((s) => s.cleanup);
  const cleanupCommunities = useCommunitiesStore((s) => s.cleanup);
  const cleanupComments = useCommentsStore((s) => s.cleanup);

  useEffect(() => {
    cleanupPosts();
    cleanupCommunities();
    cleanupComments();
    clearCache();
  }, []);

  return null;
}
