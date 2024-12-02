import { Text, View } from "tamagui";
import MarkdownRender from "markdown-to-jsx";

function Div({ children }: { children?: React.ReactNode }) {
  return <Text>{children}</Text>;
}

function H1({ children }: { children?: React.ReactNode }) {
  return <Text>{children}</Text>;
}

function Strong({ children }: { children?: React.ReactNode }) {
  return <Text fontWeight="bold">{children}</Text>;
}

function Italic({ children }: { children?: React.ReactNode }) {
  return <Text fontStyle="italic">{children}</Text>;
}

export function Markdown({ markdown }: { markdown: string }) {
  return (
    <View dsp="flex" fd="column" gap="$3">
      <MarkdownRender
        options={{
          overrides: {
            h1: H1,
            h2: H1,
            h3: H1,
            h4: H1,
            h5: H1,
            h6: H1,
            p: H1,
            span: H1,
            a: H1,
            link: H1,
            strong: Strong,
            s: Strong,
            i: Italic,
            em: Italic,
            div: Div,
            view: Div,
            blockquote: H1,
            del: H1,
            ul: Div,
            ol: Div,
            li: Div,
            img: Div,
            code: H1,
            pre: H1,
            hr: Div,
            table: Div,
            thead: Div,
            tbody: Div,
            tr: Div,
            th: H1,
            td: H1,
            br: Div,
          },
          wrapper: ({ children }: { children: React.ReactNode }) => {
            return <>{children}</>;
          },
          createElement: (Tag, props, children) => {
            if (typeof Tag === "string") {
              console.warn("Failed to render tag '", Tag, "'");
              return <></>;
            }

            const { key, ...rest } = props;
            return (
              <Tag key={key} {...rest}>
                {children}
              </Tag>
            );
          },
        }}
      >
        {markdown}
      </MarkdownRender>
    </View>
  );
}
