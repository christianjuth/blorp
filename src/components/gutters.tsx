import * as React from "react";

export function ContentGutters({
  children,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>) {
  const [first, second] = React.Children.toArray(children);
  return (
    <div
      className="max-w-[900px] w-full flex flex-row mx-auto gap-4"
      // maxWidth={1050}
      // w="100%"
      // mx="auto"
      // gap="$4"
      // {...props}
      // $gtMd={{ px: "$4", ...props.$gtMd }}
      // $gtLg={{ px: "$5", gap: "$5", ...props.$gtLg }}
    >
      {second ? (
        <>
          {first}
          <div
            className="w-[230px]"
            // w={230} $gtLg={{ w: 270 }} $md={{ dsp: "none" }}
          >
            {second}
          </div>
        </>
      ) : (
        first
      )}
    </div>
  );
}
