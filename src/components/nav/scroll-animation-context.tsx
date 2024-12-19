import { createContext, useContext, useEffect, useRef } from "react";
import {
  useSharedValue,
  useAnimatedScrollHandler,
  SharedValue,
  withTiming,
} from "react-native-reanimated";
import { useNavigation } from "one";
import { useCustomHeaderHeight } from "./hooks";

interface ScrollContextType {
  scrollY: SharedValue<number>;
  scrollHandler: (event: any) => void; // The scroll handler for your components
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

interface ScrollProviderProps {
  children: React.ReactNode;
}

export const ScrollProvider: React.FC<ScrollProviderProps> = ({ children }) => {
  const headerHeight = useCustomHeaderHeight().height;

  const scrollY = useSharedValue(0);
  const prevScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      let y = event.contentOffset.y + headerHeight;
      if (y < 0) {
        y = 0;
      }
      const diff = y - prevScrollY.value;
      prevScrollY.value = y;
      scrollY.value += diff * 0.03;
      if (scrollY.value > 1) {
        scrollY.value = 1;
      } else if (scrollY.value < 0) {
        scrollY.value = 0;
      }
    },
  });

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", (e) => {
      scrollY.value = withTiming(0, { duration: 200 });
    });

    // Cleanup the listener on unmount
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollContext.Provider value={{ scrollY, scrollHandler }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScrollContext = (): ScrollContextType => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScrollContext must be used within a ScrollProvider");
  }
  return context;
};
