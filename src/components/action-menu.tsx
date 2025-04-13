import { IonActionSheet } from "@ionic/react";
import { useId, useMemo, useState } from "react";
import _ from "lodash";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useMedia } from "../lib/hooks";

export interface ActionMenuProps
  extends Omit<
    React.ComponentProps<typeof IonActionSheet>,
    "buttons" | "trigger"
  > {
  actions: (
    | {
        text: string;
        value?: string;
        onClick: () => any;
        actions?: undefined;
        danger?: boolean;
      }
    | {
        text: string;
        value?: string;
        onClick?: undefined;
        actions: {
          text: string;
          onClick: () => any;
          danger?: boolean;
        }[];
        danger?: undefined;
      }
  )[];
  trigger: React.ReactNode;
  onOpen?: () => any;
  align?: "start" | "end";
  showCancel?: boolean;
}

export function ActionMenu({
  trigger,
  actions,
  onOpen,
  align,
  showCancel,
  ...props
}: ActionMenuProps) {
  const media = useMedia();
  const id = useId();
  const [subActions, setSubActions] = useState<
    {
      text: string;
      onClick: () => any;
    }[]
  >();

  const buttons: React.ComponentProps<typeof IonActionSheet>["buttons"] =
    useMemo(
      () => [
        ...actions.map((a, index) => ({
          text: a.text,
          data: index,
        })),
        ...(showCancel
          ? [
              {
                text: "Cancel",
                role: "cancel",
              },
            ]
          : []),
      ],
      [actions, showCancel],
    );

  const subActionButtons:
    | React.ComponentProps<typeof IonActionSheet>["buttons"]
    | null = useMemo(
    () =>
      subActions
        ? [
            ...subActions.map((a, index) => ({
              text: a.text,
              data: index,
            })),
            ...(showCancel
              ? [
                  {
                    text: "Cancel",
                    role: "cancel",
                  },
                ]
              : []),
          ]
        : null,
    [actions, showCancel, subActions],
  );

  if (media.md) {
    return (
      <DropdownMenu onOpenChange={(open) => open && onOpen?.()}>
        <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          {props.header && (
            <>
              <DropdownMenuLabel>{props.header}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          {actions.map((a, index) =>
            a.actions ? (
              <DropdownMenuSub key={a.text + index}>
                <DropdownMenuSubTrigger>{a.text}</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {a.actions.map((sa) => (
                      <DropdownMenuItem
                        key={sa.text + index}
                        onClick={sa.onClick}
                        className={sa.danger ? "text-destructive!" : undefined}
                      >
                        {sa.text}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem
                key={a.text + index}
                onClick={a.onClick}
                className={a.danger ? "text-destructive!" : undefined}
              >
                {a.text}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <button id={id}>{trigger}</button>
      {subActionButtons && (
        <IonActionSheet
          {...props}
          isOpen
          buttons={subActionButtons}
          onWillDismiss={({ detail }) => {
            const selectedActions = actions.find(
              (a) => "actions" in a && a.actions === subActions,
            )?.actions;
            const index = _.isNumber(detail.data) ? detail.data : null;
            if (index !== null && selectedActions) {
              const action = selectedActions[index];
              if (action && action.onClick) {
                setSubActions(undefined);
                action.onClick();
              }
            }
          }}
          onDidDismiss={() => setSubActions(undefined)}
          onWillPresent={(e) => {
            props.onWillPresent?.(e);
            onOpen?.();
          }}
        />
      )}
      <IonActionSheet
        {...props}
        trigger={id}
        buttons={buttons}
        onWillDismiss={({ detail }) => {
          const index = _.isNumber(detail.data) ? detail.data : null;
          if (index !== null) {
            const action = actions[index];
            if (action.onClick) {
              action.onClick();
            } else {
              setSubActions(action.actions);
            }
          }
        }}
        onWillPresent={(e) => {
          props.onWillPresent?.(e);
          onOpen?.();
        }}
      />
    </>
  );
}
