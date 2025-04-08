import MarkdownIt from "markdown-it";
import markdownit from "markdown-it";
import markdownitContainer from "markdown-it-container";
import { useLinkContext } from "../nav/link-context";
import parse, {
  DOMNode,
  domToReact,
  HTMLReactParserOptions,
} from "html-react-parser";
import { Link } from "react-router-dom";
import { CodeBlock } from "./code-block";

const options: HTMLReactParserOptions = {
  replace: (domNode) => {
    // Check if the node is an anchor element
    if (domNode.type === "tag" && domNode.name === "a" && domNode.attribs) {
      const href = domNode.attribs.href ?? "";
      if (href.startsWith("/")) {
        return (
          <Link to={domNode.attribs.href}>
            {domToReact(domNode.children as DOMNode[], options)}
          </Link>
        );
      } else {
        return (
          <a href={href} target="_blank">
            {domToReact(domNode.children as DOMNode[], options)}
          </a>
        );
      }
    }

    if (domNode.type === "tag" && domNode.name === "code") {
      // Extract language from class, e.g., "language-js".
      const classAttr = domNode.attribs?.class || "";
      const match = classAttr.match(/language-(\w+)/);
      const language = match ? match[1] : "plaintext";
      // Assume the code is stored as text in the first child.
      const code =
        domNode.children[0] && "data" in domNode.children[0]
          ? domNode.children[0].data || ""
          : "";

      console.log(language);

      // Replace the node with our CodeBlock component.
      return <CodeBlock language={language} code={code} />;
    }
  },
};

function createMd(root: ReturnType<typeof useLinkContext>["root"]) {
  const md = markdownit({
    linkify: true,
  });

  // Extend linkify for lemmy links starting with "!"
  md.linkify.add("!", {
    // The validate function checks that the text starting at position pos
    // matches our desired lemmy link pattern.
    validate: function (text, pos, self) {
      // Attempt to match the pattern: !community@host
      const tail = text.slice(pos);
      const match = tail.match(/^([\w-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (match) {
        // Return the length of the matched text.
        return match[0].length;
      }
      return 0;
    },
    // The normalize function lets us customize how the matched text becomes a URL.
    normalize: function (match) {
      match.url = `${root}c/${match.raw.substring(1)}`;
    },
  });

  md.use(markdownitContainer, "spoiler", {
    validate: function (params) {
      return params.trim().match(/^spoiler\s+(.*)$/);
    },

    render: function (tokens, idx) {
      var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);

      if (tokens[idx].nesting === 1) {
        // opening tag
        return (
          "<details><summary>" + md.utils.escapeHtml(m[1]) + "</summary>\n"
        );
      } else {
        // closing tag
        return "</details>\n";
      }
    },
  });

  return md;
}

const RENDERERS: Record<ReturnType<typeof useLinkContext>["root"], MarkdownIt> =
  {
    "/home/": createMd("/home/"),
    "/inbox/": createMd("/inbox/"),
    "/communities/": createMd("/communities/"),
  };

export function MarkdownRenderer({ markdown }: { markdown: string }) {
  const root = useLinkContext().root;
  return (
    <div className="prose dark:prose-invert prose-sm leading-normal max-w-full">
      {parse(RENDERERS[root].render(markdown), options)}
    </div>
  );
}
