export function useNavigation() {
  return {
    addListener: () => {},
  };
}

export function useRouter() {
  return {
    back: () => {},
    canGoBack: () => false,
    push: () => {},
    navigate: () => {},
    replace: () => {},
    dismiss: () => {},
    dismissAll: () => {},
    setParams: () => {},
    subscribe: () => {},
    onLoadState: () => {},
  };
}

export function usePathname() {
  return "";
}

export function Link({ children }) {
  return children;
}

export function SafeAreaView({ children }) {
  return children;
}

export function useFocusEffect() {}
