import React from "react";
import { Check, ChevronDown, ChevronUp } from "@tamagui/lucide-icons";

import type { FontSizeTokens, SelectProps as TSelectProps } from "tamagui";
import { Adapt, Select as TSelect, Sheet, YStack, getFontSize } from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

type Option<V> = {
  label: string;
  value: V;
};

export interface SelectProps<V extends string> extends TSelectProps {
  options: Option<V>[];
  value: V;
  onValueChange?: (value: V) => void;
}

export function Select<V extends string>({
  options,
  ...props
}: SelectProps<V>) {
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
        >
          <Sheet.Frame>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay
            // animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      <TSelect.Content zIndex={200000}>
        <TSelect.ScrollUpButton
          alignItems="center"
          justifyContent="center"
          position="relative"
          width="100%"
          height="$3"
        >
          <YStack zIndex={10}>
            <ChevronUp size={20} />
          </YStack>
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            fullscreen
            colors={["$background", "transparent"]}
            borderRadius="$4"
          />
        </TSelect.ScrollUpButton>

        <TSelect.Viewport
          // to do animations:
          // animation="quick"
          // animateOnly={['transform', 'opacity']}
          // enterStyle={{ o: 0, y: -10 }}
          // exitStyle={{ o: 0, y: 10 }}
          minWidth={200}
        >
          <TSelect.Group>
            <TSelect.Label>Fruits</TSelect.Label>
            {/* for longer lists memoizing these is useful */}
            {React.useMemo(
              () =>
                options.map((item, i) => {
                  return (
                    <TSelect.Item index={i} key={item.value} value={item.value}>
                      <TSelect.ItemText>{item.label}</TSelect.ItemText>
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

        <TSelect.ScrollDownButton
          alignItems="center"
          justifyContent="center"
          position="relative"
          width="100%"
          height="$3"
        >
          <YStack zIndex={10}>
            <ChevronDown size={20} />
          </YStack>
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            fullscreen
            colors={["transparent", "$background"]}
            borderRadius="$4"
          />
        </TSelect.ScrollDownButton>
      </TSelect.Content>
    </TSelect>
  );
}
