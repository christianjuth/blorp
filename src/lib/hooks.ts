import { ToastOptions, useIonToast } from "@ionic/react";
import { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";

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
  const [present, dismiss] = useIonToast();

  return useCallback(async (options: ToastOptions) => {
    await dismiss();
    return present(options);
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
      ([entry]) => setIsVisible(entry.isIntersecting),
      options,
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options.root, options.rootMargin, options.threshold]);

  return isVisible;
}
