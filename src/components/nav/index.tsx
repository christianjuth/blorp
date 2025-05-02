import {
  Link as DefaultLink,
  LinkProps as DefaultLinkProps,
  useParams as useParamsDefault,
  useHistory as useHistoryDefault,
  Route as RouteDefault,
  RouteProps as RoutPropsDefault,
  Redirect as RedirectDefault,
  RedirectProps as RedirectPropsDefault,
} from "react-router-dom";
import z from "zod";
import type {
  Route as RouteType,
  Redirect as RedirectType,
  NotFound,
} from "./routes.d";

interface HistoryReturnValue
  extends Omit<ReturnType<typeof useHistoryDefault>, "push"> {
  push: (route: RouteType) => void;
}

export function useHistory(): HistoryReturnValue {
  return useHistoryDefault();
}

export function useParams<Z extends z.ZodObject<any>>(schema: Z): z.infer<Z> {
  const params = useParamsDefault();
  return schema.parse(params);
}

export interface LinkProps extends Omit<DefaultLinkProps, "to"> {
  searchParams?: `?${string}`;
  to: RouteType;
}

export function Link({ searchParams, to, ...rest }: LinkProps) {
  return <DefaultLink to={to + (searchParams ?? "")} {...rest} />;
}

interface RouteProps extends Omit<RoutPropsDefault, "path"> {
  path?: RouteType<`:${string}`> | NotFound;
}

export function Route(props: RouteProps) {
  return <RouteDefault {...props} />;
}

interface RedirectProps
  extends Omit<RedirectPropsDefault, "to" | "path" | "from"> {
  path?: RouteType<`:${string}`> | RedirectType<`:${string}`>;
  from?: RouteType<`:${string}`> | RedirectType<`:${string}`>;
  to: RouteType<`:${string}`>;
}

export function Redirect(props: RedirectProps) {
  return <RedirectDefault {...props} />;
}
