import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/c` | `/(tabs)/c/` | `/(tabs)/login` | `/_sitemap` | `/auth` | `/c` | `/c/` | `/login`
      DynamicRoutes: `/(tabs)/c/${OneRouter.SingleRoutePart<T>}` | `/c/${OneRouter.SingleRoutePart<T>}` | `/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/(tabs)/c/[communityName]` | `/c/[communityName]` | `/c/[communityName]/posts/[postId]`
      IsTyped: true
    }
  }
}