import markdownit from "markdown-it";
import markdownitContainer from "markdown-it-container";

const md = markdownit();

md.use(markdownitContainer, "spoiler", {
  validate: function (params) {
    return params.trim().match(/^spoiler\s+(.*)$/);
  },

  render: function (tokens, idx) {
    var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);

    if (tokens[idx].nesting === 1) {
      // opening tag
      return "<details><summary>" + md.utils.escapeHtml(m[1]) + "</summary>\n";
    } else {
      // closing tag
      return "</details>\n";
    }
  },
});

export function MarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <div
      className="prose dark:prose-invert prose-sm leading-normal max-w-full"
      dangerouslySetInnerHTML={{ __html: md.render(markdown) }}
    />
  );
}
