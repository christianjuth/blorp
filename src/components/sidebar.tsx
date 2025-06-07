import { cn } from "../lib/utils";

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col py-4 dark:py-0 absolute inset-x-0 max-h-[calc(100vh-60px)]">
      {children}
    </div>
  );
}

export function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-y-scroll md:pr-[6px] md:-mr-[14px]">
      <div
        className={cn(
          "bg-secondary/60 dark:bg-transparent rounded-xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
