import { describe, test, expect } from "vitest";
import { useAuth, DEFAULT_INSTANCES } from "./auth";
import _ from "lodash";
import { renderHook, act } from "@testing-library/react-hooks";
import { faker } from "@faker-js/faker";

describe("useAuthStore", () => {
  const { result } = renderHook(() => useAuth());

  const account1 = {
    instance: faker.internet.url(),
    jwt: faker.string.uuid(),
  };

  const account2 = {
    instance: faker.internet.url(),
    jwt: faker.string.uuid(),
  };

  const account3 = {
    instance: faker.internet.url(),
    jwt: faker.string.uuid(),
  };

  test("default instance", () => {
    expect(result.current.getSelectedAccount().instance).toBeOneOf(
      DEFAULT_INSTANCES as any,
    );
  });

  test("is logged in init false", () => {
    expect(result.current.isLoggedIn()).toBe(false);
  });

  test("login first account", () => {
    act(() => {
      result.current.updateAccount(account1);
    });
    expect(result.current.getSelectedAccount()).toEqual(account1);
  });

  test("add account single step", () => {
    act(() => {
      result.current.addAccount(account2);
    });
    expect(result.current.getSelectedAccount()).toEqual(account2);
  });

  test("add account two steps", () => {
    act(() => {
      result.current.addAccount();
      result.current.updateAccount(account3);
    });
    expect(result.current.getSelectedAccount()).toEqual(account3);
  });

  test("logout of account 3 of 3", () => {
    expect(result.current.accounts).toHaveLength(3);
    act(() => {
      result.current.logout();
    });
    expect(result.current.accounts).toHaveLength(2);
    expect(result.current.getSelectedAccount()).toEqual(account2);
  });

  test("change account selection", () => {
    let account: any;
    act(() => {
      account = result.current.setAccountIndex(0);
    });
    expect(account).toEqual(account1);
    expect(result.current.getSelectedAccount()).toEqual(account1);
  });

  test("setAccountIndex protects against invalid account index", () => {
    const newAccountIndex = result.current.accounts.length * 2;
    act(() => {
      result.current.setAccountIndex(newAccountIndex);
    });
    expect(result.current.accountIndex).not.toBe(newAccountIndex);
  });

  test("logout of account 1 of 2", () => {
    expect(result.current.accounts).toHaveLength(2);
    act(() => {
      result.current.logout();
    });
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.getSelectedAccount()).toEqual(account2);
  });

  test("logout of last account", () => {
    expect(result.current.accounts).toHaveLength(1);
    act(() => {
      result.current.logout();
    });
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.getSelectedAccount()).toEqual({
      instance: expect.toBeOneOf(DEFAULT_INSTANCES as any),
    });
  });
});
