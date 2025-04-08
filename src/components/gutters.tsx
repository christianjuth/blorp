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
        "max-w-[1050px] w-full grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_230px] lg:grid-cols-[minmax(0,1fr)_270px] mx-auto gap-6 px-2.5 md:px-6",
        props.className,
      )}
    >
      {second ? (
        <>
          {first}
          <div className="max-md:hidden relative">{second}</div>
        </>
      ) : (
        first
      )}
    </div>
  );
}
