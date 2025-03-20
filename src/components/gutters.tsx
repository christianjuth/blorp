import * as React from "react";

import { twMerge } from "tailwind-merge";

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
      {...props}
      className={twMerge(
        "max-w-[1050px] w-full flex flex-row mx-auto gap-5 md:px-6",
        props.className,
      )}
      // {...props}
      // $gtMd={{ px: "$4", ...props.$gtMd }}
      // $gtLg={{ px: "$5", gap: "$5", ...props.$gtLg }}
    >
      {second ? (
        <>
          {first}
          <div
            className="w-[230px] lg:w-[270px] max-md:hidden flex-shrink-0 relative"
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
