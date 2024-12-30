import {
  Button,
  GetThemeValueForKey,
  Text,
  useTheme,
  View,
  YStack,
} from "tamagui";
import disc from "@jsamr/counter-style/presets/disc";
import decimal from "@jsamr/counter-style/presets/decimal";
import MarkedList from "@jsamr/react-native-li";
import React, { useState, createContext, useContext, Fragment } from "react";
import _ from "lodash";
import { Image, shareImage } from "./image";
import Md, {
  MarkdownIt,
  tokensToAST,
  stringToTokens,
  RenderRules,
} from "react-native-markdown-display";

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
  return <Image imageUrl={src} maxWidth={250} />;
}

// Define reusable components with styles
function Div({ children }: { children?: React.ReactNode }) {
  const color = useContextColor();
  return <Text color={color}>{children}</Text>;
}

function Hr() {
  return <View h={1} w="100%" bg="$color7" />;
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
        // renderMarker={(t) => <Text>{console.log(t)}</Text>}
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
    <YStack gap="$2.5">
      <Button
        onPress={() => setIsVisible(!isVisible)}
        unstyled
        bg="transparent"
        bc="none"
        bw={0}
        p={0}
        py="$1"
        ai="flex-start"
        dsp="flex"
        fd="row"
      >
        <Text fontSize="$5" textAlign="left" color={color} w={10}>
          {isVisible ? "\u25BC" : "\u25B6"}
        </Text>
        <Text fontSize="$5" textAlign="left" color={color}>
          {title}
        </Text>
      </Button>
      {isVisible &&
        React.Children.toArray(children).map((child, index) => (
          <Text key={index} color={color}>
            {child}
          </Text>
        ))}
    </YStack>
  );
}

export function markdownItLemmySpoiler(md: MarkdownIt) {
  // Add a block-level rule for spoilers
  md.block.ruler.before("fence", "lemmy_spoiler", tokenizeLemmySpoiler, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
}

function tokenizeLemmySpoiler(
  state: MarkdownIt.StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const endPos = state.eMarks[startLine];
  const line = state.src.slice(startPos, endPos).trim();

  // Check if the line starts with the spoiler syntax
  if (!line.startsWith("::: spoiler")) return false;

  // Parse the spoiler title
  const title = line.slice("::: spoiler".length).trim();
  if (!title) return false;

  // Find the ending `:::`
  let nextLine = startLine + 1;
  let content = "";
  while (nextLine < endLine) {
    const nextPos = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextLineText = state.src
      .slice(nextPos, state.eMarks[nextLine])
      .trim();

    if (nextLineText === ":::") break;

    content +=
      state.getLines(nextLine, nextLine + 1, state.tShift[nextLine], false) +
      "\n";
    nextLine++;
  }

  // If we didn’t find the closing `:::`, this isn’t valid
  if (nextLine >= endLine) return false;

  // Silent mode is for validation only
  if (silent) return true;

  // Create the token
  const token = state.push("lemmy_spoiler", "div", 0);
  token.block = true;
  token.meta = { title };
  token.content = content;
  token.map = [startLine, nextLine + 1];

  // Update state position
  state.line = nextLine + 1;

  return true;
}

const markdownItInstance = MarkdownIt({
  tyographer: true,
  linkify: true,
});
markdownItInstance.use(markdownItLemmySpoiler);

const renderRules: RenderRules = {
  // // when unknown elements are introduced, so it wont break
  // unknown: (node, children, parent, styles) => null,

  // // The main container
  body: (node, children, parent, styles) => (
    <YStack key={node.key} style={styles._VIEW_SAFE_body} gap="$2.5">
      {children}
    </YStack>
  ),

  // // Headings
  // heading1: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_heading1}>
  //     {children}
  //   </View>
  // ),
  // heading2: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_heading2}>
  //     {children}
  //   </View>
  // ),
  // heading3: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_heading3}>
  //     {children}
  //   </View>
  // ),
  // heading4: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_heading4}>
  //     {children}
  //   </View>
  // ),
  // heading5: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_heading5}>
  //     {children}
  //   </View>
  // ),
  // heading6: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_heading6}>
  //     {children}
  //   </View>
  // ),

  // // Horizontal Rule
  hr: (node, children, parent, styles) => <Hr key={node.key} />,

  // // Emphasis
  // strong: (node, children, parent, styles) => (
  //   <Text key={node.key} style={styles.strong}>
  //     {children}
  //   </Text>
  // ),
  // em: (node, children, parent, styles) => (
  //   <Text key={node.key} style={styles.em}>
  //     {children}
  //   </Text>
  // ),
  // s: (node, children, parent, styles) => (
  //   <Text key={node.key} style={styles.s}>
  //     {children}
  //   </Text>
  // ),

  // Blockquotes
  blockquote: (node, children, parent, styles) => (
    <Blockquote key={node.key}>{children}</Blockquote>
  ),

  // // Lists
  // bullet_list: (node, children, parent, styles) => (
  //   <Ul key={node.key}>{children}</Ul>
  // ),
  // ordered_list: (node, children, parent, styles) => (
  //   <Ol key={node.key}>{children}</Ol>
  // ),
  // list_item: (node, children, parent, styles, inheritedStyles = {}) => {
  //   return <Li key={node.key}>{children}</Li>;
  // },

  // // Code
  // code_inline: (node, children, parent, styles, inheritedStyles = {}) => (
  //   <Text key={node.key} style={[inheritedStyles, styles.code_inline]}>
  //     {node.content}
  //   </Text>
  // ),
  // code_block: (node, children, parent, styles, inheritedStyles = {}) => {
  //   // we trim new lines off the end of code blocks because the parser sends an extra one.
  //   let { content } = node;

  //   if (
  //     typeof node.content === "string" &&
  //     node.content.charAt(node.content.length - 1) === "\n"
  //   ) {
  //     content = node.content.substring(0, node.content.length - 1);
  //   }

  //   return (
  //     <Text key={node.key} style={[inheritedStyles, styles.code_block]}>
  //       {content}
  //     </Text>
  //   );
  // },
  // fence: (node, children, parent, styles, inheritedStyles = {}) => {
  //   // we trim new lines off the end of code blocks because the parser sends an extra one.
  //   let { content } = node;

  //   if (
  //     typeof node.content === "string" &&
  //     node.content.charAt(node.content.length - 1) === "\n"
  //   ) {
  //     content = node.content.substring(0, node.content.length - 1);
  //   }

  //   return (
  //     <Text key={node.key} style={[inheritedStyles, styles.fence]}>
  //       {content}
  //     </Text>
  //   );
  // },

  // // Tables
  // table: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_table}>
  //     {children}
  //   </View>
  // ),
  // thead: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_thead}>
  //     {children}
  //   </View>
  // ),
  // tbody: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_tbody}>
  //     {children}
  //   </View>
  // ),
  // th: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_th}>
  //     {children}
  //   </View>
  // ),
  // tr: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_tr}>
  //     {children}
  //   </View>
  // ),
  // td: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_td}>
  //     {children}
  //   </View>
  // ),

  // // Links
  // link: (node, children, parent, styles, onLinkPress) => (
  //   <Text
  //     key={node.key}
  //     style={styles.link}
  //     // onPress={() => openUrl(node.attributes.href, onLinkPress)}
  //   >
  //     {children}
  //   </Text>
  // ),
  // // blocklink: (node, children, parent, styles, onLinkPress) => (
  // //   <TouchableWithoutFeedback
  // //     key={node.key}
  // //     onPress={() => openUrl(node.attributes.href, onLinkPress)}
  // //     style={styles.blocklink}
  // //   >
  // //     <View style={styles.image}>{children}</View>
  // //   </TouchableWithoutFeedback>
  // // ),

  // // Images
  image: (node) => {
    const { src, alt } = node.attributes;
    return (
      <View
        key={node.key}
        w="100%"
        dsp="flex"
        fd="row"
        jc="flex-start"
        onLongPress={() => {
          console.log(src);
          if (typeof src === "string") {
            shareImage(src);
          }
        }}
      >
        <Image maxWidth={250} imageUrl={src} />
      </View>
    );
  },

  // // Text Output
  text: (node, children, parent, styles, inheritedStyles = {}) => (
    <Text key={node.key} fontSize={14} style={inheritedStyles}>
      {node.content}
    </Text>
  ),
  // textgroup: (node, children, parent, styles) => (
  //   <Text key={node.key} style={styles.textgroup}>
  //     {children}
  //   </Text>
  // ),
  paragraph: (node, children, parent, styles) => (
    <View key={node.key} my="$0">
      {children}
    </View>
  ),
  // hardbreak: (node, children, parent, styles) => (
  //   <Text key={node.key} style={styles.hardbreak}>
  //     {"\n"}
  //   </Text>
  // ),
  // softbreak: (node, children, parent, styles) => (
  //   <Text key={node.key} style={styles.softbreak}>
  //     {"\n"}
  //   </Text>
  // ),

  // // Believe these are never used but retained for completeness
  // pre: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_pre}>
  //     {children}
  //   </View>
  // ),
  inline: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.inline}>
      {children}
    </Text>
  ),
  span: (node, children, parent, styles) => (
    <Text key={node.key} style={styles.span}>
      {children}
    </Text>
  ),
  lemmy_spoiler: (node: any) => (
    <Spoiler title={node.sourceMeta?.title} key={node.key}>
      <Markdown markdown={node.content} />
    </Spoiler>
  ),
};

export function Markdown({
  markdown,
  color,
}: {
  markdown: string;
  color?: GetThemeValueForKey<"color">;
}) {
  const ast = tokensToAST(stringToTokens(markdown, markdownItInstance));

  return (
    <Context.Provider
      value={{
        color: color ?? "$color",
      }}
    >
      <Md rules={renderRules}>{ast as any}</Md>
    </Context.Provider>
  );
}
