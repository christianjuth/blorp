import React from "react";
import { Check, ChevronDown } from "@tamagui/lucide-icons";

import type { FontSizeTokens, SelectProps as TSelectProps } from "tamagui";
import {
  Adapt,
  Select as TSelect,
  Sheet,
  YStack,
  getFontSize,
  Popover,
  View,
  XStack,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type Option<V, L = string> = {
  label: L;
  value: V;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
};

export interface SelectProps<V extends string> extends TSelectProps {
  options: Option<V>[];
  value: V;
  onValueChange?: (value: V) => void;
  title: string;
  trigger?: React.ReactNode;
}

export function Select<V extends string>({
  options,
  title,
  trigger,
  ...props
}: SelectProps<V>) {
  const insets = useSafeAreaInsets();
  return (
    <TSelect disablePreventBodyScroll {...props}>
      {trigger ? (
        <TSelect.Trigger
          unstyled
          bw={0}
          w="auto"
          p={0}
          minHeight={0}
          bg="transparent"
        >
          {trigger}
        </TSelect.Trigger>
      ) : (
        <TSelect.Trigger width={220} iconAfter={ChevronDown} br={999999}>
          <TSelect.Value placeholder="Something" />
        </TSelect.Trigger>
      )}

      <Adapt platform="touch">
        <Sheet
          native={!!props.native}
          modal
          dismissOnSnapToBottom
          animationConfig={{
            type: "spring",
            damping: 20,
            mass: 1.2,
            stiffness: 250,
          }}
          snapPointsMode="fit"
        >
          <Sheet.Frame
            bg="$color1"
            $theme-dark={{
              bg: "$color3",
            }}
            $gtMd={{
              w: "50%",
              transform: [
                {
                  translateX: "50%",
                },
              ],
            }}
          >
            <Sheet.ScrollView pb={insets.bottom}>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay
            animation="quick"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="rgba(0,0,0,0.4)"
          />
        </Sheet>
      </Adapt>

      <TSelect.Content zIndex={200000}>
        <TSelect.Viewport
          // to do animations:
          // animation="quick"
          // animateOnly={["transform", "opacity"]}
          // enterStyle={{ o: 0, y: -10 }}
          // exitStyle={{ o: 0, y: 10 }}
          minWidth={200}
          bg="$color1"
          $theme-dark={{
            bg: "$color3",
          }}
        >
          <TSelect.Group>
            <TSelect.Label
              bbw={1}
              fontWeight="500"
              color="$color10"
              bbc="$color4"
              backgroundColor="transparent"
            >
              {title}
            </TSelect.Label>
            {/* for longer lists memoizing these is useful */}
            {React.useMemo(
              () =>
                options.map(({ icon: Icon, ...item }, i) => {
                  return (
                    <TSelect.Item
                      index={i}
                      key={item.value}
                      value={item.value}
                      backgroundColor="transparent"
                      hoverStyle={{
                        bg: "$color5",
                      }}
                    >
                      {Icon && (
                        <TSelect.Icon mr="$2.5">
                          <Icon size={18} />
                        </TSelect.Icon>
                      )}
                      <TSelect.ItemText mr="auto">
                        {item.label}
                      </TSelect.ItemText>
                      <TSelect.ItemIndicator marginLeft="auto">
                        <Check size={16} />
                      </TSelect.ItemIndicator>
                    </TSelect.Item>
                  );
                }),
              [options],
            )}
          </TSelect.Group>
          {/* Native gets an extra icon */}
          {props.native && (
            <YStack
              position="absolute"
              right={0}
              top={0}
              bottom={0}
              alignItems="center"
              justifyContent="center"
              width={"$4"}
              pointerEvents="none"
            >
              <ChevronDown
                size={getFontSize((props.size as FontSizeTokens) ?? "$true")}
              />
            </YStack>
          )}
        </TSelect.Viewport>
      </TSelect.Content>
    </TSelect>
  );
}
