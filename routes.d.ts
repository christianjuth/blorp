import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/_sitemap` | `/auth`
      DynamicRoutes: `/posts/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/posts/[postId]`
      IsTyped: true
    }
  }
}