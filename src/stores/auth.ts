import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";
import { GetSiteResponse } from "lemmy-js-client";
import _ from "lodash";

const DEFAULT_INSTANCES = [
  "https://lemmy.world",
  "https://lemm.ee",
  "https://sh.itjust.works",
  "https://lemmy.ml",
  "https://lemmy.zip",
  "https://lemmy.ca",
] as const;

type Account = {
  instance: string;
  jwt?: string;
  site?: GetSiteResponse;
};

type AuthStore = {
  accounts: Account[];
  getSelectedAccount: () => Account;
  isLoggedIn: () => boolean;
  accountIndex: 0;
  updateAccount: (patch: Partial<Account>) => any;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      accounts: [
        {
          instance: _.sample(DEFAULT_INSTANCES),
        },
      ],
      getSelectedAccount: () => {
        const state = get();
        return state.accounts[state.accountIndex];
      },
      isLoggedIn: () => {
        const state = get();
        const account = state.accounts[state.accountIndex];
        return account && !!account.jwt;
      },
      accountIndex: 0,
      updateAccount: (patch) => {
        let { accounts, accountIndex } = get();
        accounts = accounts.map((a, i) =>
          i === accountIndex
            ? {
                ...a,
                ...patch,
              }
            : a,
        );
        set({
          accounts,
        });
      },
    }),
    {
      name: "auth",
      storage: createStorage<AuthStore>(),
      version: 1,
    },
  ),
);
