// CodeBlock.tsx
import React, { useState } from "react";
import { common, createLowlight } from "lowlight";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Combobox } from "../adaptable/combox";

export const lowlight = createLowlight(common);

// Define a type for lowlight AST nodes.
export interface LowlightNode {
  type: string;
  value?: string;
  children?: LowlightNode[];
  properties?: {
    className?: string[];
  };
}

// Recursively render lowlight nodes as React elements.
function renderLowlightNodes(nodes: LowlightNode[]): React.ReactNode {
  return nodes.map((node, index) => {
    if (node.type === "text") {
      return node.value;
    }

    const className =
      node.properties && node.properties.className
        ? node.properties.className.join(" ")
        : "";

    return (
      <span key={index} className={className}>
        {node.children && renderLowlightNodes(node.children)}
      </span>
    );
  });
}

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  // lowlight.highlight returns an object with children as AST nodes.
  const highlighted = lowlight.highlight(language, code);
  return (
    <code className="font-mono text-[.75rem]">
      {renderLowlightNodes(highlighted.children as LowlightNode[])}
    </code>
  );
};

export function CodeBlockEditor({
  node: {
    attrs: { language: defaultLanguage },
  },
  updateAttributes,
  extension,
}: NodeViewProps) {
  const [lang, setLang] = useState(defaultLanguage);

  return (
    <NodeViewWrapper>
      <pre className="relative font-mono text-[.75rem]">
        <NodeViewContent as="code" />

        <Combobox
          triggerProps={{
            size: "sm",
            variant: "link",
            className: "absolute top-0 right-0 w-auto text-xs",
          }}
          value={lang}
          options={extension.options.lowlight
            .listLanguages()
            .map((lang: string) => ({
              label: lang,
              value: lang,
            }))}
          onChange={(opt) => {
            setLang(opt.value);
            updateAttributes({ language: opt.value });
          }}
          align="end"
        />
      </pre>
    </NodeViewWrapper>
  );
}
