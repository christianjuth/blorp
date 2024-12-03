import { Text, useTheme, View } from "tamagui";
import MarkdownRender from "markdown-to-jsx";
import disc from "@jsamr/counter-style/presets/disc";
import decimal from "@jsamr/counter-style/presets/decimal";
import MarkedList from "@jsamr/react-native-li";
import React from "react";
import _ from "lodash";

// Define reusable components with styles
function Div({ children }: { children?: React.ReactNode }) {
  return <Text>{children}</Text>;
}

function P({ children }: { children?: React.ReactNode }) {
  return <Text>{children}</Text>;
}

function H1({ children }: { children?: React.ReactNode }) {
  return (
    <Text
      fontSize="$6"
      fontWeight="bold"
      marginVertical="$2"
      tag="h1"
      width="100%"
    >
      {children}
    </Text>
  );
}

function Strong({ children }: { children?: React.ReactNode }) {
  return <Text fontWeight="bold">{children}</Text>;
}

function Italic({ children }: { children?: React.ReactNode }) {
  return <Text fontStyle="italic">{children}</Text>;
}

function Blockquote({ children }: { children?: React.ReactNode }) {
  return (
    <Text
      fontStyle="italic"
      fontSize="$4"
      marginLeft="$3"
      borderLeftWidth="$1.5"
      borderLeftColor="$gray9"
      paddingLeft="$2"
      py="$1"
    >
      {children}
    </Text>
  );
}

function Ul({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View py="$2.5">
      <MarkedList
        counterRenderer={disc}
        markerTextStyle={{ color: theme.gray12.val }}
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
  return (
    <View py="$2.5">
      <MarkedList
        counterRenderer={decimal}
        markerTextStyle={{ color: theme.gray12.val }}
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
  return <Text>{children}</Text>;
}

function Code({ children }: { children?: React.ReactNode }) {
  return (
    <Text
      fontFamily="monospace"
      fontSize="$2"
      backgroundColor="$gray4"
      padding="$1"
      borderRadius="$1"
    >
      {children}
    </Text>
  );
}

function Pre({ children }: { children?: React.ReactNode }) {
  return (
    <View
      backgroundColor="$gray3"
      padding="$3"
      borderRadius="$2"
      marginVertical="$2"
    >
      {children}
    </View>
  );
}

export function Markdown({ markdown }: { markdown: string }) {
  return (
    <View dsp="flex" fd="column" gap="$1.5">
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
            img: Div, // Handle images with a custom component if needed
            code: Code,
            pre: Pre,
            hr: Div,
            table: Div,
            thead: Div,
            tbody: Div,
            tr: Div,
            th: H1,
            td: Div,
            br: Div,
            text: Div,
          },
          wrapper: ({ children }: { children: React.ReactNode }) => {
            return (
              <>
                {React.Children.map(
                  React.Children.toArray(children),
                  (child) => {
                    if (_.isString(child) || _.isNumber(child)) {
                      return <Text key={child}>{child}</Text>;
                    }
                    return child;
                  },
                )}
              </>
            );
          },
          disableParsingRawHTML: true,
        }}
      >
        {markdown}
      </MarkdownRender>
    </View>
  );
}
