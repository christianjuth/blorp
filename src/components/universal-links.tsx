import React, { useEffect } from "react";
import { useHistory } from "@/src/routing/index";
import { App, URLOpenListenerEvent } from "@capacitor/app";

export const AppUrlListener: React.FC<any> = () => {
  const { push } = useHistory();
  useEffect(() => {
    App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      try {
        const url = new URL(event.url);
        push(url.pathname as never, {} as never);
      } catch {}
    });
  }, [push]);

  return null;
};
