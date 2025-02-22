import { useEffect } from "react";
import { usePostsStore } from "./posts";
import { useCommunitiesStore } from "./communities";

export function GarbageCollector() {
  const cleanupPosts = usePostsStore((s) => s.cleanup);
  const cleanupCommunities = useCommunitiesStore((s) => s.cleanup);

  useEffect(() => {
    cleanupPosts();
    cleanupCommunities();
  }, []);

  return null;
}
