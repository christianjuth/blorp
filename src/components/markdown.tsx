import { Button, GetThemeValueForKey, Text, useTheme, View } from "tamagui";
import MarkdownRender from "markdown-to-jsx";
import disc from "@jsamr/counter-style/presets/disc";
import decimal from "@jsamr/counter-style/presets/decimal";
import MarkedList from "@jsamr/react-native-li";
import React, { useState, createContext, useContext } from "react";
import _ from "lodash";
import { Image } from "./image";

const Context = createContext<{
  color: GetThemeValueForKey<"color">;
}>({
  color: "$color",
});

function useContextColor() {
  const { color } = useContext(Context);
  return color;
}

function Img({ alt, src }: { alt?: string; src?: string }) {
  if (!src) {
    return null;
  }
  return (
    <View maxWidth={250} w="100%">
      <Image imageUrl={src} />
    </View>
  );
}

// Define reusable components with styles
function Div({ children }: { children?: React.ReactNode }) {
  const color = useContextColor();
  return <Text color={color}>{children}</Text>;
}

function Hr() {
  return <View h={1} w="100%" bg="$color0" />;
}

function P({ children }: { children?: React.ReactNode }) {
  const color = useContextColor();
  return (
    <Text tag="p" mb="$2" color={color} dsp="block">
      {children}
    </Text>
  );
}

function H1({ children }: { children?: React.ReactNode }) {
  const color = useContextColor();
  return (
    <Text
      fontSize="$6"
      fontWeight="bold"
      marginVertical="$2"
      tag="h1"
      width="100%"
      color={color}
    >
      {children}
    </Text>
  );
}

function Strong({ children }: { children?: React.ReactNode }) {
  const color = useContextColor();
  return (
    <Text fontWeight="bold" color={color}>
      {children}
    </Text>
  );
}

function Italic({ children }: { children?: React.ReactNode }) {
  const color = useContextColor();
  return (
    <Text fontStyle="italic" color={color}>
      {children}
    </Text>
  );
}

function Blockquote({ children }: { children?: React.ReactNode }) {
  const color = useContextColor();
  return (
    <Text
      fontStyle="italic"
      fontSize="$4"
      marginLeft="$1.5"
      borderLeftWidth="$1.5"
      borderLeftColor="$gray9"
      paddingLeft="$2"
      py="$1"
      mb="$2"
      color={color}
      opacity={0.6}
      tag="blockquote"
      dsp="flex"
      fd="column"
    >
      {children}
    </Text>
  );
}

function Ul({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  // const color = useContextColor();
  return (
    <View py="$2.5">
      <MarkedList
        counterRenderer={disc}
        markerTextStyle={{ color: theme.color11.val }}
        lineStyle={{
          marginTop: 2,
          marginBottom: 2,
        }}
      >
        {children}
      </MarkedList>
    </View>
  );
}

function Ol({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  // const color = useContextColor();
  return (
    <View py="$2.5">
      <MarkedList
        counterRenderer={decimal}
        markerTextStyle={{ color: theme.color11.val }}
        lineStyle={{
          marginTop: 2,
          marginBottom: 2,
        }}
      >
        {children}
      </MarkedList>
    </View>
  );
}

function Li({ children }: { children?: React.ReactNode }) {
  const color = useContextColor();
  return <Text color={color}>{children}</Text>;
}

function Code({ children }: { children?: React.ReactNode }) {
  const color = useContextColor();
  return (
    <Text
      fontFamily="monospace"
      fontSize="$2"
      backgroundColor="$gray4"
      borderRadius="$1"
      padding="$3"
      tag="code"
      color={color}
    >
      {children}
    </Text>
  );
}

function Pre({ children }: { children?: React.ReactNode }) {
  return (
    <View borderRadius="$2" mb="$2">
      {children}
    </View>
  );
}

function Spoiler({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const color = useContextColor();

  return (
    <View dsp="flex" fd="column">
      <Button
        onPress={() => setIsVisible(!isVisible)}
        unstyled
        bg="transparent"
        bc="none"
        bw={0}
        p={0}
        py="$1"
        ai="flex-start"
      >
        <Text fontSize="$5" textAlign="left" color={color}>
          {isVisible ? "\u25BC" : "\u25B6"} {title}
        </Text>
      </Button>
      {isVisible &&
        React.Children.toArray(children).map((child, index) => (
          <Text key={index} color={color}>
            {child}
          </Text>
        ))}
    </View>
  );
}

function preprocessMarkdown(markdown: string): string {
  // Define regex for code blocks and spoilers
  const codeBlockRegex = /```[\s\S]*?```/g;
  const spoilerRegex = /(^|\n)\s*::: spoiler (.+?)\n([\s\S]+?)\n:::/g;

  // Array to store code blocks
  const codeBlocks: string[] = [];

  // Extract code blocks and replace them with placeholders
  const markdownWithoutCodeBlocks = markdown.replace(
    codeBlockRegex,
    (match) => {
      codeBlocks.push(match);
      return `PLACEHOLDER_CODE_BLOCK_${codeBlocks.length - 1}`;
    },
  );

  // Replace spoilers outside of code blocks
  const processedMarkdown = markdownWithoutCodeBlocks.replace(
    spoilerRegex,
    (_, newline: string, title: string, hiddenText: string) =>
      `${newline}\n<Spoiler title="${title}">${hiddenText}</Spoiler>\n`,
  );

  // Restore code blocks from placeholders
  return processedMarkdown.replace(
    /PLACEHOLDER_CODE_BLOCK_(\d+)/g,
    (_, index: string) => codeBlocks[parseInt(index, 10)],
  );
}

export function Markdown({
  markdown,
  color,
}: {
  markdown: string;
  color?: GetThemeValueForKey<"color">;
}) {
  return (
    <Context.Provider
      value={{
        color: color ?? "$color",
      }}
    >
      <View dsp="flex" fd="column" gap="$2.5">
        <MarkdownRender
          options={{
            overrides: {
              h1: H1,
              h2: H1,
              h3: H1,
              h4: H1,
              h5: H1,
              h6: H1,
              p: P,
              span: Div,
              a: Strong, // Add link handling if necessary
              link: Strong,
              strong: Strong,
              s: Strong,
              i: Italic,
              em: Italic,
              div: Div,
              view: Div,
              blockquote: Blockquote,
              del: Div,
              ul: Ul,
              ol: Ol,
              li: Li,
              img: Img, // Handle images with a custom component if needed
              code: Code,
              pre: Pre,
              hr: Hr,
              table: Div,
              thead: Div,
              tbody: Div,
              tr: Div,
              th: H1,
              td: Div,
              br: Div,
              text: Div,
              Spoiler: Spoiler,
            },
            wrapper: ({ children }: { children: React.ReactNode }) => {
              return (
                <>
                  {React.Children.map(
                    React.Children.toArray(children),
                    (child) => {
                      if (_.isString(child)) {
                        if (child.trim() === "") {
                          return null;
                        }
                        return <Text key={child}>{child}</Text>;
                      }
                      if (_.isNumber(child)) {
                        return <Text key={child}>{child}</Text>;
                      }
                      return child;
                    },
                  )}
                </>
              );
            },
          }}
        >
          {preprocessMarkdown(markdown)}
        </MarkdownRender>
      </View>
    </Context.Provider>
  );
}
