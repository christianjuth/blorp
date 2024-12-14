import { Button, GetThemeValueForKey, Text, useTheme, View } from "tamagui";
import disc from "@jsamr/counter-style/presets/disc";
import decimal from "@jsamr/counter-style/presets/decimal";
import MarkedList from "@jsamr/react-native-li";
import React, { useState, createContext, useContext, Fragment } from "react";
import _ from "lodash";
import { Image } from "./image";
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
  return <View h={1} w="100%" bg="$color7" my="$2" />;
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

interface SpoilerTokenMeta {
  title: string;
  content: string;
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
});
markdownItInstance.use(markdownItLemmySpoiler);

const renderRules: RenderRules = {
  // // when unknown elements are introduced, so it wont break
  // unknown: (node, children, parent, styles) => null,

  // // The main container
  // body: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_body}>
  //     {children}
  //   </View>
  // ),

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
  hr: (node, children, parent, styles) => <Hr />,

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
  //   <View key={node.key} style={styles._VIEW_SAFE_bullet_list}>
  //     {children}
  //   </View>
  // ),
  // ordered_list: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_ordered_list}>
  //     {children}
  //   </View>
  // ),
  // // this is a unique and quite annoying render rule because it has
  // // child items that can be styled (the list icon and the list content)
  // // outside of the AST tree so there are some work arounds in the
  // // AST renderer specifically to get the styling right here
  // // list_item: (node, children, parent, styles, inheritedStyles = {}) => {
  // //   // we need to grab any text specific stuff here that is applied on the list_item style
  // //   // and apply it onto bullet_list_icon. the AST renderer has some workaround code to make
  // //   // the content classes apply correctly to the child AST tree items as well
  // //   // as code that forces the creation of the inheritedStyles object for list_items
  // //   const refStyle = {
  // //     ...inheritedStyles,
  // //     ...StyleSheet.flatten(styles.list_item),
  // //   };

  // //   const arr = Object.keys(refStyle);

  // //   const modifiedInheritedStylesObj = {};

  // //   for (let b = 0; b < arr.length; b++) {
  // //     if (textStyleProps.includes(arr[b])) {
  // //       modifiedInheritedStylesObj[arr[b]] = refStyle[arr[b]];
  // //     }
  // //   }

  // //   if (hasParents(parent, "bullet_list")) {
  // //     return (
  // //       <View key={node.key} style={styles._VIEW_SAFE_list_item}>
  // //         <Text
  // //           style={[modifiedInheritedStylesObj, styles.bullet_list_icon]}
  // //           accessible={false}
  // //         >
  // //           {Platform.select({
  // //             android: "\u2022",
  // //             ios: "\u00B7",
  // //             default: "\u2022",
  // //           })}
  // //         </Text>
  // //         <View style={styles._VIEW_SAFE_bullet_list_content}>{children}</View>
  // //       </View>
  // //     );
  // //   }

  // //   if (hasParents(parent, "ordered_list")) {
  // //     const orderedListIndex = parent.findIndex(
  // //       (el) => el.type === "ordered_list",
  // //     );

  // //     const orderedList = parent[orderedListIndex];
  // //     let listItemNumber;

  // //     if (orderedList.attributes && orderedList.attributes.start) {
  // //       listItemNumber = orderedList.attributes.start + node.index;
  // //     } else {
  // //       listItemNumber = node.index + 1;
  // //     }

  // //     return (
  // //       <View key={node.key} style={styles._VIEW_SAFE_list_item}>
  // //         <Text style={[modifiedInheritedStylesObj, styles.ordered_list_icon]}>
  // //           {listItemNumber}
  // //           {node.markup}
  // //         </Text>
  // //         <View style={styles._VIEW_SAFE_ordered_list_content}>{children}</View>
  // //       </View>
  // //     );
  // //   }

  // //   // we should not need this, but just in case
  // //   return (
  // //     <View key={node.key} style={styles._VIEW_SAFE_list_item}>
  // //       {children}
  // //     </View>
  // //   );
  // // },

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
  // // image: (
  // //   node,
  // //   children,
  // //   parent,
  // //   styles,
  // //   allowedImageHandlers,
  // //   defaultImageHandler,
  // // ) => {
  // //   const { src, alt } = node.attributes;

  // //   // we check that the source starts with at least one of the elements in allowedImageHandlers
  // //   const show =
  // //     allowedImageHandlers.filter((value) => {
  // //       return src.toLowerCase().startsWith(value.toLowerCase());
  // //     }).length > 0;

  // //   if (show === false && defaultImageHandler === null) {
  // //     return null;
  // //   }

  // //   const imageProps = {
  // //     indicator: true,
  // //     key: node.key,
  // //     style: styles._VIEW_SAFE_image,
  // //     source: {
  // //       uri: show === true ? src : `${defaultImageHandler}${src}`,
  // //     },
  // //   };

  // //   if (alt) {
  // //     imageProps.accessible = true;
  // //     imageProps.accessibilityLabel = alt;
  // //   }

  // //   return <FitImage {...imageProps} />;
  // // },

  // // Text Output
  text: (node, children, parent, styles, inheritedStyles = {}) => (
    <Text key={node.key} style={inheritedStyles}>
      {node.content}
    </Text>
  ),
  // textgroup: (node, children, parent, styles) => (
  //   <Text key={node.key} style={styles.textgroup}>
  //     {children}
  //   </Text>
  // ),
  // paragraph: (node, children, parent, styles) => (
  //   <View key={node.key} style={styles._VIEW_SAFE_paragraph}>
  //     {children}
  //   </View>
  // ),
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
  lemmy_spoiler: (node) => (
    <Spoiler title={node.sourceMeta?.title}>
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
