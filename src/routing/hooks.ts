import { useIonRouter } from "@ionic/react";
import { RoutePath } from "./routes";

export function usePathname() {
  const pathname = useIonRouter().routeInfo.pathname;
  return pathname as RoutePath;
}
