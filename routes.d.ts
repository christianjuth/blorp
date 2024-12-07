import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/communities` | `/(tabs)/communities/` | `/(tabs)/login` | `/_sitemap` | `/auth` | `/communities` | `/communities/` | `/login`
      DynamicRoutes: `/(tabs)/communities/${OneRouter.SingleRoutePart<T>}` | `/communities/${OneRouter.SingleRoutePart<T>}` | `/communities/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/(tabs)/communities/[communityId]` | `/communities/[communityId]` | `/communities/[communityId]/posts/[postId]`
      IsTyped: true
    }
  }
}