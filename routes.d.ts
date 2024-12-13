import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(stack)` | `/(stack)/communities` | `/(tabs)` | `/(tabs)/` | `/(tabs)/(stack)` | `/(tabs)/(stack)/communities` | `/(tabs)/chat` | `/(tabs)/communities` | `/(tabs)/create` | `/(tabs)/inbox` | `/_sitemap` | `/auth` | `/chat` | `/communities` | `/create` | `/inbox`
      DynamicRoutes: `/(stack)/c/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/(stack)/c/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/c/${OneRouter.SingleRoutePart<T>}` | `/c/${OneRouter.SingleRoutePart<T>}` | `/c/${OneRouter.SingleRoutePart<T>}/posts/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/(stack)/c/[communityName]` | `/(tabs)/(stack)/c/[communityName]` | `/(tabs)/c/[communityName]` | `/c/[communityName]` | `/c/[communityName]/posts/[postId]`
      IsTyped: true
    }
  }
}