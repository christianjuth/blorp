import { useIonRouter } from "@ionic/react";
import { useRouteMatch } from "react-router";

export function Title({ children }: { children?: string }) {
  const router = useIonRouter();
  const match = useRouteMatch();

  if (router.routeInfo.pathname !== match.url) {
    return null;
  }

  if (!children) {
    <title>Blorp</title>;
  }
  return <title>{`Blorp | ${children}`}</title>;
}
