import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import { GetSiteResponse } from "lemmy-js-client";
import _ from "lodash";

export const DEFAULT_INSTANCES = ["https://lemm.ee"] as const;

export type CacheKey = `cache_${string}`;
export type CachePrefixer = (cacheKey: string) => CacheKey;

export function getCachePrefixer(account: Account): CachePrefixer {
  let prefix = `${account.instance}_`;
  if (account.jwt) {
    prefix += "authed_";
  }
  return (cacheKey) => {
    return (prefix + cacheKey) as CacheKey;
  };
}

type Account = {
  instance: string;
  jwt?: string;
  site?: GetSiteResponse;
};

type AuthStore = {
  accounts: Account[];
  getSelectedAccount: () => Account;
  isLoggedIn: () => boolean;
  accountIndex: number;
  updateAccount: (patch: Partial<Account>) => any;
  addAccount: (patch?: Partial<Account>) => any;
  setAccountIndex: (index: number) => Account | null;
  logout: (index?: number) => any;
  getCachePrefixer: () => CachePrefixer;
};

export function parseAccountInfo(account: Account) {
  const url = new URL(account.instance);
  return {
    person: account.site?.my_user?.local_user_view.person,
    instance: url.host,
  };
}

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
      addAccount: (patch) => {
        const accounts = [
          ...get().accounts,
          {
            instance: _.sample(DEFAULT_INSTANCES),
            ...patch,
          },
        ];
        set({
          accounts,
          accountIndex: accounts.length - 1,
        });
      },
      logout: (index) => {
        const { accounts, accountIndex } = get();
        const account = accounts[index ?? accountIndex];
        if (account) {
          delete accounts[index ?? accountIndex];
          const newAccounts = accounts.filter(Boolean);
          if (newAccounts.length === 0) {
            set({
              accounts: [
                {
                  instance: _.sample(DEFAULT_INSTANCES),
                },
              ],
              accountIndex: 0,
            });
          } else {
            set({
              accounts: newAccounts,
              accountIndex: _.clamp(accountIndex, 0, newAccounts.length - 1),
            });
          }
        }
      },
      setAccountIndex: (index) => {
        const account = get().accounts[index];
        if (!account) {
          return null;
        }
        set({
          accountIndex: index,
        });
        return account;
      },
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
      getCachePrefixer: () => {
        let { accounts, accountIndex } = get();
        const selectedAccount = accounts[accountIndex];
        return getCachePrefixer(selectedAccount);
      },
    }),
    {
      name: "auth",
      storage: createStorage<AuthStore>(),
      version: 1,
    },
  ),
);

sync(useAuth);
