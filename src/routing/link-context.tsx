import { createContext } from "react";
import { useIonRouter } from "@ionic/react";

export const LinkContext = createContext<{
  root: "/home/" | "/communities/" | "/inbox/";
}>({
  root: "/home/",
});

export function useLinkContext() {
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
}
