import { useEffect, useState } from "react";
import { isWeb } from "tamagui";

export function useIsScreenReady() {
  const [wasFocused, setWasFocused] = useState(isWeb ? true : false);

  useEffect(() => {
    requestAnimationFrame(() => setWasFocused(true));
  }, []);

  return wasFocused;
}
