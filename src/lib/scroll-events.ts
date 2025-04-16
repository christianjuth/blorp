const eventListeners: [string, () => any][] = [];

export function subscribeToScrollEvent(path: string, listener: () => any) {
  path = path.replace(/\/$/, "");

  eventListeners.push([path, listener]);

  // unsubscribe
  return () => {
    const index = eventListeners.findIndex(([, fn]) => fn === listener);
    eventListeners.splice(index, 1);
  };
}

export function dispatchScrollEvent(path: string) {
  path = path.replace(/\/$/, "");

  for (const [listenerPath, fn] of eventListeners) {
    if (listenerPath === path) {
      fn();
    }
  }
}
