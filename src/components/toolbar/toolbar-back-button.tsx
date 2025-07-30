import { cn } from "@/src/lib/utils";
import { IonBackButton } from "@ionic/react";

export function ToolbarBackButton({ className }: { className?: string }) {
  return (
    <IonBackButton
      text=""
      className={cn("text-muted-foreground -ml-1.5", className)}
    />
  );
}
