import { cn } from "@/src/lib/utils";
import { useLinkContext } from "@/src/routing/link-context";
import { IonBackButton } from "@ionic/react";

export function ToolbarBackButton({ className }: { className?: string }) {
  const root = useLinkContext().root;
  return (
    <IonBackButton
      text=""
      className={cn("text-muted-foreground -ml-1 focus:ring", className)}
      defaultHref={root}
    />
  );
}
