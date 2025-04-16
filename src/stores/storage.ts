import { PersistStorage } from "zustand/middleware";
import { createDb } from "@/src/lib/create-storage";
import pRetry from "p-retry";
import * as Sentry from "@sentry/react";
import { BroadcastChannel } from "broadcast-channel";
import { UseBoundStore } from "zustand";
import z from "zod";

const rehydrateMsg = z.object({
  rehydrate: z.literal("zustand"),
});

const channel = new BroadcastChannel("zustand");

export function createStorage<S>(): PersistStorage<S> {
  const db = createDb("zustand");
  return {
    getItem: async (key) => {
      try {
        const value = await pRetry(() => db.getItem(key), {
          retries: 5,
          onFailedAttempt: (err) => {
            Sentry.captureException(err);
          },
        });
        return value ? JSON.parse(value) : null;
      } catch (err) {
        Sentry.captureException(err);
        window.location.reload();
      }
    },
    setItem: async (key, value) => {
      await db.setItem(key, JSON.stringify(value));
      channel.postMessage({
        rehydrate: "zustand",
      });
    },
    removeItem: async (key) => {
      await db.removeItem(key);
    },
  };
}

export function sync(store: UseBoundStore<any>) {
  channel.addEventListener("message", (msg) => {
    const { success } = rehydrateMsg.safeParse(msg);
    if (success) {
      store.persist.rehydrate();
    }
  });
}
