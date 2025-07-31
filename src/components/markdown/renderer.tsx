import MarkdownIt from "markdown-it";
import markdownit from "markdown-it";
import markdownitContainer, { ContainerOpts } from "markdown-it-container";
import { useLinkContext } from "../../routing/link-context";
import parse, {
  DOMNode,
  domToReact,
  HTMLReactParserOptions,
} from "html-react-parser";
import { Link } from "@/src/routing/index";
import { CodeBlock } from "./code-block";
import { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import { useLongPress } from "use-long-press";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { shareImage } from "@/src/lib/share";
import { cn } from "@/src/lib/utils";
import DOMPurify from "dompurify";

const COMMUNITY_BANG =
  /^!([A-Za-z0-9_-]+)@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})$/;

function Image(
  props: DetailedHTMLProps<
    ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >,
) {
  const handlers = useLongPress(
    async () => {
      const src = props.src;
      if (src) {
        Haptics.impact({ style: ImpactStyle.Heavy });
        shareImage(src, src);
      }
    },
    {
      cancelOnMovement: 15,
      onStart: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      filterEvents: (event) => {
        if ("button" in event) {
          // Ignore mouse right click
          return event.button !== 2;
        }
        return true;
      },
    },
  );
  return <img {...props} {...handlers()} />;
}

const options: (
  root: "/home/" | "/communities/" | "/inbox/",
) => HTMLReactParserOptions = (root) => ({
  replace: (domNode) => {
    // Check if the node is an anchor element
    if (domNode.type === "tag" && domNode.name === "a" && domNode.attribs) {
      const href = domNode.attribs["href"] ?? "";
      const textContent =
        domNode.children[0] && "data" in domNode.children[0]
          ? domNode.children[0].data
          : null;

      // Replace "!community@server" with "/selected-tab/c/community"
      if (textContent && COMMUNITY_BANG.test(textContent)) {
        const href = `${root}c/${textContent.substring(1)}`;
        return (
          <Link to={href as never} params={{} as never}>
            {domToReact(domNode.children as DOMNode[], options(root))}
          </Link>
        );
      }

      // Replace "/c/community" with "/selected-tab/c/community"
      if (/^\/c\/[^/]+$/i.test(href)) {
        return (
          <Link to={(root + href.substring(1)) as never} params={{} as never}>
            {domToReact(domNode.children as DOMNode[], options(root))}
          </Link>
        );
      }

      // Replace "/u/community" with "/selected-tab/u/community"
      if (/^\/u\/[^/]+$/i.test(href)) {
        return (
          <Link to={(root + href.substring(1)) as never} params={{} as never}>
            {domToReact(domNode.children as DOMNode[], options(root))}
          </Link>
        );
      }

      if (href.startsWith("/")) {
        return (
          <Link to={href as never} params={{} as never}>
            {domToReact(domNode.children as DOMNode[], options(root))}
          </Link>
        );
      } else {
        return (
          <a href={href} target="_blank" rel="noreferrer noopener">
            {domToReact(domNode.children as DOMNode[], options(root))}
          </a>
        );
      }
    }

    if (domNode.type === "tag" && domNode.name === "code") {
      // Extract language from class, e.g., "language-js".
      const classAttr = domNode.attribs?.["class"] || "";
      const match = classAttr.match(/language-(\w+)/);
      const language = match && match[1] ? match[1] : "plaintext";
      // Assume the code is stored as text in the first child.
      const code =
        domNode.children[0] && "data" in domNode.children[0]
          ? domNode.children[0].data || ""
          : "";

      // Replace the node with our CodeBlock component.
      return <CodeBlock language={language} code={code} />;
    }

    if (domNode.type === "tag" && domNode.name === "img") {
      return <Image {...domNode.attribs} />;
    }
  },
});

function createMd(root: ReturnType<typeof useLinkContext>["root"]) {
  const md = markdownit({
    linkify: true,
    html: true,
  });

  // Extend linkify for lemmy links starting with "!"
  md.linkify.add("!", {
    // The validate function checks that the text starting at position pos
    // matches our desired lemmy link pattern.
    validate: function (text, pos) {
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

  md.linkify.add("@", {
    // The validate function checks that the text starting at position pos
    // matches our desired lemmy link pattern.
    validate: function (text, pos) {
      // Attempt to match the pattern: @user@host
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
      match.url = `${root}u/${match.raw.substring(1)}`;
    },
  });

  md.use(markdownitContainer, "spoiler", {
    validate: function (params) {
      return /^spoiler\s+(.*)$/.test(params.trim());
    },

    render: function (tokens, idx) {
      const m = tokens[idx]!.info.trim().match(/^spoiler\s+(.*)$/);
      const summary = m?.[1] ? md.utils.escapeHtml(m[1]) : "";

      if (tokens[idx]!.nesting === 1) {
        // opening tag
        return `<details><summary>${summary}</summary>\n`;
      } else {
        // closing tag
        return "</details>\n";
      }
    },
  } satisfies ContainerOpts);

  return md;
}

const RENDERERS: Record<ReturnType<typeof useLinkContext>["root"], MarkdownIt> =
  {
    "/home/": createMd("/home/"),
    "/inbox/": createMd("/inbox/"),
    "/communities/": createMd("/communities/"),
  };

export function MarkdownRenderer({
  markdown,
  className,
  dim,
}: {
  markdown: string;
  className?: string;
  dim?: boolean;
}) {
  const root = useLinkContext().root;
  return (
    <div
      className={cn("markdown-content", dim && "text-foreground/70", className)}
    >
      {parse(
        DOMPurify.sanitize(RENDERERS[root].render(markdown)),
        options(root),
      )}
    </div>
  );
}
