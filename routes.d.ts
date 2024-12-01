import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(home)` | `/(home)/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/(home)` | `/(tabs)/(home)/` | `/_sitemap`
      DynamicRoutes: `/(home)/posts/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/(home)/posts/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/posts/${OneRouter.SingleRoutePart<T>}` | `/posts/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/(home)/posts/[postId]` | `/(tabs)/(home)/posts/[postId]` | `/(tabs)/posts/[postId]` | `/posts/[postId]`
      IsTyped: true
    }
  }
}