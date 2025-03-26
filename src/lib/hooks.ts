import { useMemo } from "react";
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
