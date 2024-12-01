import { Text, View } from "tamagui";
import MarkdownRender from "markdown-to-jsx";

function Div({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
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
            strong: Strong,
            s: Strong,
            i: Italic,
            em: Italic,
            div: Div,
            view: Div,
          },
          wrapper: ({ children }: { children: React.ReactNode }) => {
            return <>{children}</>;
          },
        }}
      >
        {markdown}
      </MarkdownRender>
    </View>
  );
}
