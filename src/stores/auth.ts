import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import { GetSiteResponse } from "lemmy-js-client";
import _ from "lodash";

export const DEFAULT_INSTANCES = ["https://preferred.social/"] as const;

export type CacheKey = `cache_${string}`;
export type CachePrefixer = (cacheKey: string) => CacheKey;

export function getCachePrefixer(account?: Account): CachePrefixer {
  let prefix = "";
  if (account?.instance) {
    prefix += `${account.instance}_`;
  }
  if (account?.jwt) {
    prefix += "authed_";
  }
  return (cacheKey) => {
    return (prefix + cacheKey) as CacheKey;
  };
}

export type Account = {
  instance: string;
  jwt?: string;
  site?: GetSiteResponse;
};

type AuthStore = {
  accounts: Account[];
  getSelectedAccount: () => Account;
  isLoggedIn: () => boolean;
  accountIndex: number;
  updateSelectedAccount: (patch: Partial<Account>) => any;
  updateAccount: (index: number | Account, patch: Partial<Account>) => any;
  addAccount: (patch?: Partial<Account>) => any;
  setAccountIndex: (index: number) => Account | null;
  logout: (index?: number | Account) => any;
  getCachePrefixer: () => CachePrefixer;
};

export function getAccountActorId(account: Account) {
  return account?.site?.my_user?.local_user_view.person.actor_id;
}

export function parseAccountInfo(account: Account) {
  const url = new URL(account.instance);
  return {
    person: account.site?.my_user?.local_user_view.person,
    instance: url.host,
  };
}

function getNewAccount() {
  return {
    instance: _.sample(DEFAULT_INSTANCES),
  };
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      accounts: [getNewAccount()],
      getSelectedAccount: () => {
        const state = get();
        const account = state.accounts[state.accountIndex];
        // We shouldn't ever hit this case,
        // but just to be save, this function can
        // recover from an account that isn't found
        if (!account) {
          const newAccount = getNewAccount();
          set((prev) => {
            const newAccounts = prev.accounts;
            newAccounts[state.accountIndex] = newAccount;
            return {
              ...prev,
              accounts: newAccounts,
            };
          });
          return newAccount;
        }
        return account;
      },
      isLoggedIn: () => {
        const state = get();
        const account = state.accounts[state.accountIndex];
        return !!account && !!account.jwt;
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
      logout: (accountSelector) => {
        const { accounts, accountIndex } = get();
        const index = _.isObject(accountSelector)
          ? accounts.findIndex(({ jwt }) => jwt && jwt === accountSelector.jwt)
          : accountSelector;
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
      updateAccount: (accountSelector, patch) => {
        let { accounts } = get();
        const index = _.isObject(accountSelector)
          ? accounts.findIndex(({ jwt }) => jwt && jwt === accountSelector.jwt)
          : accountSelector;
        accounts = accounts.map((a, i) =>
          i === index
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
      updateSelectedAccount: (patch) => {
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
