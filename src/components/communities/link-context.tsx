import { createContext, useContext } from "react";

export const LinkContext = createContext<{
  root: "/" | "/communities/";
}>({
  root: "/",
});

export function useLinkContext() {
  return useContext(LinkContext);
}
