import { IonActionSheet, IonButton } from "@ionic/react";
import { useId, useMemo } from "react";
import _ from "lodash";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/src/components/ui/dropdown-menu";
import { useMedia } from "../lib/hooks";

export interface ActionMenuProps
  extends Omit<
    React.ComponentProps<typeof IonActionSheet>,
    "buttons" | "trigger"
  > {
  actions: {
    text: string;
    onClick: () => any;
  }[];
  trigger: React.ReactNode;
  onOpen?: () => any;
  align?: "start" | "end";
}

export function ActionMenu({
  trigger,
  actions,
  onOpen,
  align,
  ...props
}: ActionMenuProps) {
  const media = useMedia();
  const id = useId();
  const buttons: React.ComponentProps<typeof IonActionSheet>["buttons"] =
    useMemo(
      () => [
        ...actions.map((a, index) => ({
          text: a.text,
          data: index,
        })),
        {
          text: "Cancel",
          role: "cancel",
        },
      ],
      [actions],
    );

  if (media.md) {
    return (
      <DropdownMenu onOpenChange={(open) => open && onOpen?.()}>
        <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          {actions.map((a, index) => (
            <DropdownMenuItem key={a.text + index} onClick={a.onClick}>
              {a.text}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <button id={id}>{trigger}</button>
      <IonActionSheet
        {...props}
        trigger={id}
        buttons={buttons}
        onDidDismiss={({ detail }) => {
          const index = _.isNumber(detail.data) ? detail.data : null;
          if (index !== null) {
            actions[index].onClick();
          }
        }}
        onWillPresent={(e) => {
          props.onWillPresent?.(e);
          onOpen?.();
        }}
      ></IonActionSheet>
    </>
  );
}
