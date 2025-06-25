import debounce from "lodash/debounce";

export interface DebounceByKeyOptions {
  /** Time in milliseconds to wait before invoking the function */
  wait: number;
  /** Invoke on the leading edge of the timeout */
  leading?: boolean;
  /** Invoke on the trailing edge of the timeout */
  trailing?: boolean;
}

/**
 * A debounced function wrapper that batches calls per distinct key.
 */
export interface DebounceByKeyFn<Args extends any[]> {
  (...args: Args): void;
  /** Immediately invoke any pending calls for all keys */
  flushAll(): void;
  /** Cancel any pending calls for all keys */
  cancelAll(): void;
}

/**
 * Wraps any function in per-key debouncing using lodash.debounce.
 *
 * @param fn - The function to debounce
 * @param keyFn - Generates a string key from the function arguments
 * @param options - Debounce options (wait, leading, trailing)
 * @returns A debounced wrapper that batches calls per key
 */
export function debounceByKey<Args extends any[]>(
  fn: (...args: Args) => any,
  keyFn: (...args: Args) => string,
  options: DebounceByKeyOptions,
): DebounceByKeyFn<Args> {
  const debouncers = new Map<string, ReturnType<typeof debounce>>();

  const wrapper = ((...args: Args) => {
    const key = keyFn(...args);
    let debounced = debouncers.get(key);

    if (!debounced) {
      debounced = debounce(
        (...callArgs: Args) => fn(...callArgs),
        options.wait,
        { leading: options.leading, trailing: options.trailing },
      );
      debouncers.set(key, debounced);
    }

    debounced(...args);
  }) as DebounceByKeyFn<Args>;

  wrapper.flushAll = () => {
    for (const d of debouncers.values()) {
      if (typeof d.flush === "function") d.flush();
    }
  };

  wrapper.cancelAll = () => {
    for (const d of debouncers.values()) {
      if (typeof d.cancel === "function") d.cancel();
    }
  };

  return wrapper;
}
