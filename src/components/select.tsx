import React from "react";
import { Check, ChevronDown, ChevronUp } from "@tamagui/lucide-icons";

import type { FontSizeTokens, SelectProps as TSelectProps } from "tamagui";
import {
  Adapt,
  Select as TSelect,
  Sheet,
  YStack,
  getFontSize,
  View,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { LinearGradient } from "tamagui/linear-gradient";

export type Option<V, L = string> = {
  label: L;
  value: V;
  icon?: React.ComponentType<IconProps>;
};

export interface SelectProps<V extends string> extends TSelectProps {
  options: Option<V>[];
  value: V;
  onValueChange?: (value: V) => void;
  title: string;
}

export function Select<V extends string>({
  options,
  title,
  ...props
}: SelectProps<V>) {
  const insets = useSafeAreaInsets();
  return (
    <TSelect disablePreventBodyScroll {...props}>
      <TSelect.Trigger width={220} iconAfter={ChevronDown}>
        <TSelect.Value placeholder="Something" />
      </TSelect.Trigger>

      <Adapt when="sm" platform="touch">
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
          >
            <Sheet.ScrollView
              // bg="$color1"
              // $theme-dark={{
              //   bg: "$color3",
              // }}
              pb={insets.bottom}
            >
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay
            // animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="black"
            opacity={0.4}
          />
        </Sheet>
      </Adapt>

      <TSelect.Content zIndex={200000}>
        {/* <TSelect.ScrollUpButton */}
        {/*   alignItems="center" */}
        {/*   justifyContent="center" */}
        {/*   position="relative" */}
        {/*   width="100%" */}
        {/*   height="$3" */}
        {/* > */}
        {/*   <YStack zIndex={10}> */}
        {/*     <ChevronUp size={20} /> */}
        {/*   </YStack> */}
        {/*   <LinearGradient */}
        {/*     start={[0, 0]} */}
        {/*     end={[0, 1]} */}
        {/*     fullscreen */}
        {/*     colors={["$background", "transparent"]} */}
        {/*     borderRadius="$4" */}
        {/*   /> */}
        {/* </TSelect.ScrollUpButton> */}

        <TSelect.Viewport
          // to do animations:
          // animation="quick"
          // animateOnly={['transform', 'opacity']}
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
              bbw={1}
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
                          <Icon size="$1" />
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

        {/* <TSelect.ScrollDownButton */}
        {/*   alignItems="center" */}
        {/*   justifyContent="center" */}
        {/*   position="relative" */}
        {/*   width="100%" */}
        {/*   height="$3" */}
        {/* > */}
        {/*   <YStack zIndex={10}> */}
        {/*     <ChevronDown size={20} /> */}
        {/*   </YStack> */}
        {/*   <LinearGradient */}
        {/*     start={[0, 0]} */}
        {/*     end={[0, 1]} */}
        {/*     fullscreen */}
        {/*     colors={["transparent", "$background"]} */}
        {/*     borderRadius="$4" */}
        {/*   /> */}
        {/* </TSelect.ScrollDownButton> */}
      </TSelect.Content>
    </TSelect>
  );
}
