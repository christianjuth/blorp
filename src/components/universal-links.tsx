import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { App, URLOpenListenerEvent } from "@capacitor/app";

export const AppUrlListener: React.FC<any> = () => {
  let history = useHistory();
  useEffect(() => {
    App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      try {
        const url = new URL(event.url);
        history.push(url.pathname);
      } catch {}
    });
  }, []);

  return null;
};
