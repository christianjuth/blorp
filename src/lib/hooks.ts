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
import { toast } from "sonner";
import { useHistory, useLocation } from "react-router-dom";
import type z from "zod";

/**
 * @deprecated
 */
export function useWindowDimensions() {
  return {
    window: {
      height: 0,
      width: 0,
    },
    screen: {
      height: 0,
      width: 0,
    },
  };
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

export function useToast() {
  return useCallback(async (options: { message: string }) => {
    return toast(options.message);
  }, []);
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
    (next, { replace = false } = {}) => {
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
