import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMediaQuery } from "react-responsive";
import { InAppBrowser } from "@capacitor/inappbrowser";
import { useHistory, useLocation } from "react-router-dom";
import type z from "zod";
import { useIonAlert } from "@ionic/react";
import { Deferred } from "./deferred";

export function useTheme() {
  const prefersDark = useMediaQuery({ query: "(prefers-color-scheme: dark)" });
  return prefersDark ? "dark" : "light";
}

export function useMedia() {
  const sm = useMediaQuery({
    minWidth: "40rem",
  });

  const md = useMediaQuery({
    minWidth: "48rem",
  });

  const lg = useMediaQuery({
    minWidth: "64rem",
  });

  const xl = useMediaQuery({
    minWidth: "80rem",
  });

  const xxl = useMediaQuery({
    minWidth: "96rem",
  });

  return useMemo(
    () => ({
      sm,
      md,
      lg,
      xl,
      xxl,
      maxSm: !sm,
      maxMd: !md,
      maxLg: !lg,
      maxXl: !xl,
      maxXxl: !xxl,
    }),
    [sm, md, lg, xl, xxl],
  );
}

interface ObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export function useElementHadFocus<T extends HTMLElement | null>(
  ref: RefObject<T>,
  options: ObserverOptions = { root: null, rootMargin: "0px", threshold: 0.1 },
): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry && setIsVisible(entry.isIntersecting),
      options,
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options.root, options.rootMargin, options.threshold]);

  return isVisible;
}

export function useIsInAppBrowserOpen() {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const p1 = InAppBrowser.addListener("browserPageLoaded", () => {
      setIsOpen(true);
    });
    const p2 = InAppBrowser.addListener("browserClosed", () => {
      setIsOpen(false);
    });
    return () => {
      p1.then(({ remove }) => remove());
      p2.then(({ remove }) => remove());
    };
  }, []);
  return isOpen;
}

type SetUrlSearchParam<V> = (
  next: V | ((prev: V) => V),
  opts?: { replace?: boolean },
) => void;

/**
 * Similar to useState but stores it's state in the url.
 * Only works with strings for now.
 *
 * @example
 *   const [search, setSearch] = useUrlSearchState("q", "default_search", z.string());
 */
export function useUrlSearchState<S extends z.ZodSchema>(
  key: string,
  defaultValue: z.infer<S>,
  schema: S,
): [z.infer<S>, SetUrlSearchParam<z.infer<S>>] {
  const history = useHistory();
  const location = useLocation();

  const frozenDefaultValue = useRef(defaultValue);

  // parse & validate the raw URL param, fallback to default
  const value = useMemo<z.infer<S>>(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get(key);
    if (raw == null) return frozenDefaultValue.current;

    if (!schema) {
      return raw ?? defaultValue;
    }

    const parsed = schema.safeParse(raw);
    return parsed.success ? parsed.data : frozenDefaultValue.current;
  }, [location.search, key, frozenDefaultValue.current, schema]);

  // setter that validates and pushes/replaces the URL
  const setValue = useCallback<SetUrlSearchParam<z.infer<S>>>(
    (next, { replace = true } = {}) => {
      const newVal =
        typeof next === "function"
          ? (next as (p: z.infer<S>) => z.infer<S>)(value)
          : next;

      // ensure it’s valid
      if (schema) {
        schema.parse(newVal);
      }

      const params = new URLSearchParams(location.search);
      params.set(key, newVal);
      const newSearch = params.toString();
      const to = { ...location, search: newSearch ? `?${newSearch}` : "" };
      replace ? history.replace(to) : history.push(to);

      frozenDefaultValue.current = defaultValue;
    },
    [history, location, key, schema, value, defaultValue],
  );

  return [value, setValue];
}

export function useConfirmationAlert() {
  const [alrt] = useIonAlert();

  return async ({
    header,
    message,
    cancelText = "Cancel",
    confirmText = "OK",
    danger,
  }: {
    header?: string;
    message: string;
    cancelText?: string;
    confirmText?: string;
    danger?: boolean;
  }) => {
    const deferred = new Deferred();
    alrt({
      header,
      message,
      buttons: [
        {
          text: cancelText,
          role: "cancel",
          handler: () => deferred.reject(),
        },
        {
          text: confirmText,
          role: danger ? "destructive" : "confirm",
          handler: () => deferred.resolve(),
        },
      ],
    });
    return await deferred.promise;
  };
}

/**
 * To be used to extract the page element from an
 * IonPage and passed to an IonModal.
 *
 * See https://ionicframework.com/docs/api/modal#setting-a-boolean-value
 */
export function useIonPageElement() {
  const ref = useRef<HTMLElement>(undefined);
  const [element, setElement] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      setElement(ref.current);
    }
  }, []);
  return {
    ref,
    element: element ?? undefined,
  };
}
