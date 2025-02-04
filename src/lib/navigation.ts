import { useIsFocused } from "one";
import { useRef } from "react";

export function useIsScreenReady() {
  const focused = useIsFocused();
  const wasFocused = useRef(focused);
  if (focused) {
    wasFocused.current = true;
  }
  return wasFocused.current || focused;
}
