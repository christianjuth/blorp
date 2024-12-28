import { createContext, useContext } from "react";

export const LinkContext = createContext<{
  root: "/" | "/communities/" | "/inbox/";
}>({
  root: "/",
});

export function useLinkContext() {
  return useContext(LinkContext);
}
