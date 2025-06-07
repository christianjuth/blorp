import { useIonRouter } from "@ionic/react";
import { useRouteMatch } from "react-router";
import { env } from "../env";

export function PageTitle({ children }: { children?: string | null }) {
  const router = useIonRouter();
  const match = useRouteMatch();

  if (router.routeInfo.pathname !== match.url) {
    return null;
  }

  if (!children) {
    return <title>{env.REACT_APP_NAME}</title>;
  }
  return <title>{`${env.REACT_APP_NAME} | ${children}`}</title>;
}
