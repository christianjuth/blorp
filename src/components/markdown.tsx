import {
  Button,
  GetThemeValueForKey,
  Text,
  useTheme,
  View,
  YStack,
} from "tamagui";
import React, {
  useState,
  createContext,
  useContext,
  Fragment,
  useMemo,
} from "react";
import _ from "lodash";
import { Image, shareImage } from "./image";
import Md, {
  MarkdownIt,
  tokensToAST,
  stringToTokens,
  RenderRules,
} from "react-native-markdown-display";
import { Link as OneLink, LinkProps } from "one";
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import MarkedList from "@jsamr/react-native-li";
import decimal from "@jsamr/counter-style/presets/decimal";
import { shouldOpenInNewTab } from "../lib/linking";
import { openUrl } from "~/src/lib/linking";
import CounterStyle from "@jsamr/counter-style";

const customDisc = CounterStyle.cyclic("\u2022").withSuffix("\u2009");

function Link(props: LinkProps) {
  const href = props.href;

  if (_.isString(href) && shouldOpenInNewTab(href)) {
    return (
      <Text
        cur="pointer"
        {..._.pick(props, ["style", "className"])}
        onPress={() => {
          try {
            openUrl(href);
          } catch {
            // TODO: handle error
          }
        }}
      >
        {props.children}
      </Text>
    );
  }

  return <OneLink {...props} />;
}

const Context = createContext<{
  color: GetThemeValueForKey<"color">;
}>({
  color: "$color",
});

function useContextColor() {
  const { color } = useContext(Context);
  return color;
}

function Hr() {
  return <View h={1} w="100%" bg="$color7" />;
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
        <Text
          fontSize="$5"
          textAlign="left"
          color={color}
          minWidth={12}
          maxWidth={12}
        >
          {isVisible ? "\u25BC" : "\u25B6"}
        </Text>
        <Text fontSize="$5" textAlign="left" color={color}>
          {title}
        </Text>
      </Button>
      {isVisible && children}
    </YStack>
  );
}

export function markdownItLemmySpoiler(md: MarkdownIt) {
  // Add a block-level rule for spoilers
  md.block.ruler.before("fence", "lemmy_spoiler", tokenizeLemmySpoiler, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
}

const tokenizeLemmySpoiler: RuleBlock = (
  state,
  startLine,
  endLine,
  silent,
): boolean => {
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const endPos = state.eMarks[startLine];
  const line = state.src.slice(startPos, endPos).trim();

  // Check if the line starts with the spoiler syntax
  if (!line.startsWith(":::") || !/^:::\s*spoiler/.test(line)) return false;

  // Parse the spoiler title
  const title = line.replace(/^:::\s*spoiler/, "").trim();
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
  // commenting this out since closing isn't actualy required
  // if (nextLine >= endLine) return false;

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
};

const markdownItInstance = MarkdownIt({
  typographer: true,
  linkify: true,
});

// Access the linkify instance
const linkify = markdownItInstance.linkify;

// Add a custom rule for Lemmy links
linkify.add("!", {
  validate: (text, pos, self) => {
    // Define the pattern: !username@instance
    const tail = text.slice(pos);
    const match = tail.match(/^[a-zA-Z0-9_]+@[a-zA-Z0-9.-]+/); // e.g., !linuxmemes@lemmy.world
    if (match) {
      return match[0].length;
    }
    return 0;
  },
  normalize: (match) => {
    const url = match.url.substring(1);
    match.url = `/c/${url}`;
  },
});

markdownItInstance.use(markdownItLemmySpoiler);

function getRenderRules(config: { color: string }): RenderRules {
  return {
    // // when unknown elements are introduced, so it wont break
    // unknown: (node, children, parent, styles) => null,

    // // The main container
    body: (node, children, parent, styles) => (
      <YStack
        key={node.key}
        style={styles._VIEW_SAFE_body}
        gap="$2.5"
        data-body
      >
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
    blockquote: function Blockquote(node, children, parent, styles) {
      return (
        <View
          key={node.key}
          style={_.omit(styles._VIEW_SAFE_blockquote, [
            "backgroundColor",
            "borderColor",
            "marginLeft",
          ])}
          borderLeftColor="$gray9"
          bg="$gray3"
          paddingLeft="$2.5"
          py="$1.5"
          data-blockquote
        >
          {children}
        </View>
      );
    },

    // // Lists
    bullet_list: function Ul(node, children, parent, styles) {
      return (
        <MarkedList
          key={node.key}
          counterRenderer={customDisc}
          markerTextStyle={{
            color: config.color,
            maxHeight: 21,
          }}
          computeMarkerBoxWidth={(chars, fontSize) => chars * fontSize * 0.75}
          renderMarker={(props) => {
            const fontSize = (props.markerTextStyle.fontSize ?? 14) / 2.25;

            return (
              <YStack
                w={props.markerTextWidth || undefined}
                jc="center"
                ai="flex-end"
                pr={6}
                maxHeight={21}
              >
                <View h={fontSize} w={fontSize} bg="$color" br="$12" />
              </YStack>
            );
          }}
        >
          {children}
        </MarkedList>
      );
    },
    ordered_list: function Ol(node, children, parent, styles) {
      return (
        <View style={styles._VIEW_SAFE_ordered_list} data-ol>
          <MarkedList
            key={node.key}
            counterRenderer={decimal}
            markerTextStyle={{
              color: config.color,
              maxHeight: 19,
              lineHeight: 21,
              userSelect: "none",
            }}
            computeMarkerBoxWidth={(chars, fontSize) => chars * fontSize * 0.5}
          >
            {children}
          </MarkedList>
        </View>
      );
    },
    list_item: (node, children, parent, styles, inheritedStyles = {}) => {
      return (
        <View
          key={node.key}
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            flex: 1,
          }}
          data-list-item
        >
          {children}
        </View>
      );
    },

    // // Code
    code_inline: (node, children, parent, styles, inheritedStyles = {}) => (
      <Text
        key={node.key}
        style={inheritedStyles}
        p="$1"
        px="$1.5"
        bg="$color6"
        fontSize="$3"
        br="$1"
        data-code-inline
      >
        {node.content}
      </Text>
    ),
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
    link: (node, children, parent, styles, onLinkPress) => (
      <Link
        key={node.key}
        style={styles.link}
        href={node.attributes.href}
        data-link
      >
        {children}
      </Link>
    ),

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
            if (typeof src === "string") {
              shareImage(src);
            }
          }}
          data-image
        >
          <Image maxWidth={250} imageUrl={src} />
        </View>
      );
    },

    // // Text Output
    text: (node, children, parent, styles, inheritedStyles = {}) => {
      const fontSize = inheritedStyles.fontSize ?? 15;
      return (
        <Text
          key={node.key}
          lineHeight={fontSize * 1.4}
          style={{
            ...inheritedStyles,
            fontSize,
          }}
          data-text
        >
          {node.content}
        </Text>
      );
    },
    // textgroup: (node, children, parent, styles) => (
    //   <Text key={node.key} style={styles.textgroup}>
    //     {children}
    //   </Text>
    // ),
    paragraph: (node, children, parent, styles) => (
      <View key={node.key} my="$0" data-paragraph>
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
      <Text key={node.key} style={styles.inline} data-inline>
        {children}
      </Text>
    ),
    span: (node, children, parent, styles) => (
      <Text key={node.key} style={styles.span} data-span>
        {children}
      </Text>
    ),
    lemmy_spoiler: (node: any) => (
      <Spoiler title={node.sourceMeta?.title} key={node.key}>
        <Markdown markdown={node.content} />
      </Spoiler>
    ),
  };
}

export function Markdown({
  markdown,
  color,
}: {
  markdown: string;
  color?: GetThemeValueForKey<"color">;
}) {
  const theme = useTheme();

  const rules = useMemo(
    () =>
      getRenderRules({
        color: theme.color.val,
      }),
    [theme.color.val],
  );

  const ast = useMemo(
    () => tokensToAST(stringToTokens(markdown, markdownItInstance)),
    [markdown],
  );

  return (
    <Context.Provider
      value={{
        color: color ?? "$color",
      }}
    >
      <Md rules={rules}>{ast as any}</Md>
    </Context.Provider>
  );
}
