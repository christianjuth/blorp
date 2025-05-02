type SimpleTab = "/create" | "/settings";
type ComplexTab = "/home" | "/communities" | "/inbox";

type ParimaryTabRoute<S extends string = string> =
  | `/c/${S}`
  | `/c/${S}/sidebar`
  | `/c/${S}/s`
  | `/c/${S}/posts/${S}`
  | `/c/${S}/posts/${S}/comments/${S}`
  | `/u/${S}`
  | "/s"
  | "/saved";

export type Route<S extends string = string> =
  | `/download`
  | `/support`
  | `/privacy`
  | `/terms`
  | `/csae`
  | `${SimpleTab}`
  | `${ComplexTab}`
  | `${ComplexTab}${ParimaryTabRoute<S>}`;

export type Redirect<S extends string = string> = "/" | `/c/${S}` | `/u/${S}`;

export type NotFound = `${SimpleTab}/*` | `${ComplexTab}/*`;
