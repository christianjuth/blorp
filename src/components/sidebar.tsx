import { cn } from "../lib/utils";

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col py-4 absolute inset-x-0 max-h-[calc(100vh-60px)]">
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
    <div className="overflow-auto md:pr-3 md:-mr-3">
      <div
        className={cn(
          "bg-secondary/60 dark:bg-background dark:border-[.5px] rounded-xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
