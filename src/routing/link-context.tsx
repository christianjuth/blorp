import { useIonRouter } from "@ionic/react";

type Root = "/home/" | "/communities/" | "/inbox/";

export function useLinkContext(): {
  root: Root;
} {
  try {
    const pathname = useIonRouter().routeInfo.pathname;

    let root: "/home/" | "/communities/" | "/inbox/" = "/home/";

    if (pathname.startsWith("/communities")) {
      root = "/communities/";
    } else if (pathname.startsWith("/inbox")) {
      root = "/inbox/";
    }

    return {
      root,
    };
  } catch {
    return {
      root: "/home/",
    };
  }
}
