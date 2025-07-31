import { useEffect } from "react";
import NotFound from "./not-found";
import { useHistory, useLocation } from "react-router";
import { useResolveObject } from "../lib/api";
import { resolveRoute } from "../routing";
import { encodeApId } from "../lib/api/utils";

const origin = (() => {
  try {
    // Blorp is often hosted on a sub comain,
    // so we extract the root domain.
    const host = location.host.split(".");
    return location.protocol + "//" + host.slice(-2).join(".");
  } catch {
    return "";
  }
})();

console.log(origin);

export default function ApResolver() {
  const location = useLocation();
  const history = useHistory();
  const apId = origin + location.pathname;

  const { data } = useResolveObject(apId);

  useEffect(() => {
    const { post, community, user } = data ?? {};

    if (post) {
      history.replace(
        resolveRoute("/home/c/:communityName/posts/:post", {
          post: encodeApId(post.apId),
          communityName: post.communitySlug,
        }),
      );
    } else if (community) {
      history.replace(
        resolveRoute("/home/c/:communityName", {
          communityName: community.slug,
        }),
      );
    } else if (user) {
      history.replace(
        resolveRoute("/home/u/:userId", {
          userId: encodeApId(user.apId),
        }),
      );
    }
  }, [data?.post, data?.community, data?.user]);

  return <NotFound />;
}
