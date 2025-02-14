// deno-lint-ignore-file
/* eslint-disable */
// biome-ignore: needed import
import type { OneRouter } from "one";

declare module "one" {
  export namespace OneRouter {
    export interface __routes<T extends string = string>
      extends Record<string, unknown> {
      StaticRoutes:
        | `/`
        | `/(home)`
        | `/(home)/`
        | `/(home)/saved`
        | `/(tabs)`
        | `/(tabs)/`
        | `/(tabs)/(home)`
        | `/(tabs)/(home)/`
        | `/(tabs)/(home)/saved`
        | `/(tabs)/communities`
        | `/(tabs)/communities/`
        | `/(tabs)/communities/saved`
        | `/(tabs)/create`
        | `/(tabs)/create/`
        | `/(tabs)/create/choose-community`
        | `/(tabs)/inbox`
        | `/(tabs)/inbox/`
        | `/(tabs)/inbox/saved`
        | `/(tabs)/saved`
        | `/(tabs)/settings`
        | `/(tabs)/settings/`
        | `/_sitemap`
        | `/communities`
        | `/communities/`
        | `/communities/saved`
        | `/create`
        | `/create/`
        | `/create/choose-community`
        | `/inbox`
        | `/inbox/`
        | `/inbox/saved`
        | `/privacy`
        | `/saved`
        | `/settings`
        | `/settings/`
        | `/support`;
      DynamicRoutes:
        | `/(home)/c/${OneRouter.SingleRoutePart<T>}`
        | `/(home)/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
        | `/(home)/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}/comments/${OneRouter.SingleRoutePart<T>}`
        | `/(home)/c/${OneRouter.SingleRoutePart<T>}/s/${OneRouter.SingleRoutePart<T>}`
        | `/(home)/c/${OneRouter.SingleRoutePart<T>}/sidebar`
        | `/(home)/s/${OneRouter.SingleRoutePart<T>}`
        | `/(home)/u/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/(home)/c/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/(home)/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/(home)/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}/comments/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/(home)/c/${OneRouter.SingleRoutePart<T>}/s/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/(home)/c/${OneRouter.SingleRoutePart<T>}/sidebar`
        | `/(tabs)/(home)/s/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/(home)/u/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/c/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}/comments/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/c/${OneRouter.SingleRoutePart<T>}/s/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/c/${OneRouter.SingleRoutePart<T>}/sidebar`
        | `/(tabs)/communities/c/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/communities/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/communities/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}/comments/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/communities/c/${OneRouter.SingleRoutePart<T>}/s/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/communities/c/${OneRouter.SingleRoutePart<T>}/sidebar`
        | `/(tabs)/communities/s/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/communities/u/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/inbox/c/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/inbox/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/inbox/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}/comments/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/inbox/c/${OneRouter.SingleRoutePart<T>}/s/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/inbox/c/${OneRouter.SingleRoutePart<T>}/sidebar`
        | `/(tabs)/inbox/u/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/s/${OneRouter.SingleRoutePart<T>}`
        | `/(tabs)/u/${OneRouter.SingleRoutePart<T>}`
        | `/c/${OneRouter.SingleRoutePart<T>}`
        | `/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
        | `/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}/comments/${OneRouter.SingleRoutePart<T>}`
        | `/c/${OneRouter.SingleRoutePart<T>}/s/${OneRouter.SingleRoutePart<T>}`
        | `/c/${OneRouter.SingleRoutePart<T>}/sidebar`
        | `/communities/c/${OneRouter.SingleRoutePart<T>}`
        | `/communities/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
        | `/communities/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}/comments/${OneRouter.SingleRoutePart<T>}`
        | `/communities/c/${OneRouter.SingleRoutePart<T>}/s/${OneRouter.SingleRoutePart<T>}`
        | `/communities/c/${OneRouter.SingleRoutePart<T>}/sidebar`
        | `/communities/s/${OneRouter.SingleRoutePart<T>}`
        | `/communities/u/${OneRouter.SingleRoutePart<T>}`
        | `/inbox/c/${OneRouter.SingleRoutePart<T>}`
        | `/inbox/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
        | `/inbox/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}/comments/${OneRouter.SingleRoutePart<T>}`
        | `/inbox/c/${OneRouter.SingleRoutePart<T>}/s/${OneRouter.SingleRoutePart<T>}`
        | `/inbox/c/${OneRouter.SingleRoutePart<T>}/sidebar`
        | `/inbox/u/${OneRouter.SingleRoutePart<T>}`
        | `/s/${OneRouter.SingleRoutePart<T>}`
        | `/u/${OneRouter.SingleRoutePart<T>}`;
      DynamicRouteTemplate:
        | `/(home)/c/[communityName]`
        | `/(home)/c/[communityName]/posts/[postId]`
        | `/(home)/c/[communityName]/posts/[postId]/comments/[commentPath]`
        | `/(home)/c/[communityName]/s/[search]`
        | `/(home)/c/[communityName]/sidebar`
        | `/(home)/s/[search]`
        | `/(home)/u/[userId]`
        | `/(tabs)/(home)/c/[communityName]`
        | `/(tabs)/(home)/c/[communityName]/posts/[postId]`
        | `/(tabs)/(home)/c/[communityName]/posts/[postId]/comments/[commentPath]`
        | `/(tabs)/(home)/c/[communityName]/s/[search]`
        | `/(tabs)/(home)/c/[communityName]/sidebar`
        | `/(tabs)/(home)/s/[search]`
        | `/(tabs)/(home)/u/[userId]`
        | `/(tabs)/c/[communityName]`
        | `/(tabs)/c/[communityName]/posts/[postId]`
        | `/(tabs)/c/[communityName]/posts/[postId]/comments/[commentPath]`
        | `/(tabs)/c/[communityName]/s/[search]`
        | `/(tabs)/c/[communityName]/sidebar`
        | `/(tabs)/communities/c/[communityName]`
        | `/(tabs)/communities/c/[communityName]/posts/[postId]`
        | `/(tabs)/communities/c/[communityName]/posts/[postId]/comments/[commentPath]`
        | `/(tabs)/communities/c/[communityName]/s/[search]`
        | `/(tabs)/communities/c/[communityName]/sidebar`
        | `/(tabs)/communities/s/[search]`
        | `/(tabs)/communities/u/[userId]`
        | `/(tabs)/inbox/c/[communityName]`
        | `/(tabs)/inbox/c/[communityName]/posts/[postId]`
        | `/(tabs)/inbox/c/[communityName]/posts/[postId]/comments/[commentPath]`
        | `/(tabs)/inbox/c/[communityName]/s/[search]`
        | `/(tabs)/inbox/c/[communityName]/sidebar`
        | `/(tabs)/inbox/u/[userId]`
        | `/(tabs)/s/[search]`
        | `/(tabs)/u/[userId]`
        | `/c/[communityName]`
        | `/c/[communityName]/posts/[postId]`
        | `/c/[communityName]/posts/[postId]/comments/[commentPath]`
        | `/c/[communityName]/s/[search]`
        | `/c/[communityName]/sidebar`
        | `/communities/c/[communityName]`
        | `/communities/c/[communityName]/posts/[postId]`
        | `/communities/c/[communityName]/posts/[postId]/comments/[commentPath]`
        | `/communities/c/[communityName]/s/[search]`
        | `/communities/c/[communityName]/sidebar`
        | `/communities/s/[search]`
        | `/communities/u/[userId]`
        | `/inbox/c/[communityName]`
        | `/inbox/c/[communityName]/posts/[postId]`
        | `/inbox/c/[communityName]/posts/[postId]/comments/[commentPath]`
        | `/inbox/c/[communityName]/s/[search]`
        | `/inbox/c/[communityName]/sidebar`
        | `/inbox/u/[userId]`
        | `/s/[search]`
        | `/u/[userId]`;
      IsTyped: true;
    }
  }
}
