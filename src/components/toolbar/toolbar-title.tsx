import { cn } from "@/src/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const titleVariants = cva(
  "font-bold max-w-[calc(100vw-180px)] overflow-hidden overflow-ellipsis",
  {
    variants: {
      size: {
        default: "text-lg",
        sm: "",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);
export function ToolbarTitle({
  size,
  children,
  className,
}: { children: string; className?: string } & VariantProps<
  typeof titleVariants
>) {
  return (
    <span
      data-tauri-drag-region
      className={cn(titleVariants({ size }), className)}
    >
      {children}
    </span>
  );
}
