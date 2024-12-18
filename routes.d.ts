import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(communities)` | `/(communities)/communities` | `/(tabs)` | `/(tabs)/` | `/(tabs)/(communities)` | `/(tabs)/(communities)/communities` | `/(tabs)/chat` | `/(tabs)/communities` | `/(tabs)/create` | `/(tabs)/inbox` | `/_sitemap` | `/auth` | `/chat` | `/communities` | `/create` | `/inbox` | `/md`
      DynamicRoutes: `/(communities)/c/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/(communities)/c/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/c/${OneRouter.SingleRoutePart<T>}` | `/c/${OneRouter.SingleRoutePart<T>}` | `/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/(communities)/c/[communityName]` | `/(tabs)/(communities)/c/[communityName]` | `/(tabs)/c/[communityName]` | `/c/[communityName]` | `/c/[communityName]/posts/[postId]`
      IsTyped: true
    }
  }
}