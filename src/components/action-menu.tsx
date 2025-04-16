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
import { cn } from "../lib/utils";

export interface ActionMenuProps<V = string>
  extends Omit<
    React.ComponentProps<typeof IonActionSheet>,
    "buttons" | "trigger"
  > {
  actions: (
    | {
        text: string;
        value?: V;
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
          value?: V;
          danger?: boolean;
        }[];
        danger?: undefined;
      }
  )[];
  selectedValue?: V;
  trigger: React.ReactNode;
  onOpen?: () => any;
  align?: "start" | "end";
  showCancel?: boolean;
}

export function ActionMenu<V extends string>({
  trigger,
  actions,
  onOpen,
  align,
  showCancel,
  selectedValue,
  ...props
}: ActionMenuProps<V>) {
  const media = useMedia();
  const id = useId();
  const [subActionsTitle, setSubActionsTitle] = useState<string>();
  const [subActions, setSubActions] = useState<
    {
      text: string;
      onClick: () => any;
      value?: string;
      danger?: boolean;
    }[]
  >();

  const buttons: React.ComponentProps<typeof IonActionSheet>["buttons"] =
    useMemo(
      () => [
        ...actions.map((a, index) => ({
          text: a.text,
          data: index,
          role: a.danger
            ? "destructive"
            : _.isString(a.value) && a.value === selectedValue
              ? "selected"
              : undefined,
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
      [actions, showCancel, selectedValue],
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
              role: a.danger
                ? "destructive"
                : _.isString(a.value) && a.value === selectedValue
                  ? "selected"
                  : undefined,
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
                        className={cn(
                          _.isString(a.value) &&
                            sa.value === selectedValue &&
                            "font-bold",
                          sa.danger && "text-destructive!",
                        )}
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
                className={cn(
                  _.isString(a.value) &&
                    a.value === selectedValue &&
                    "font-bold",
                  a.danger && "text-destructive!",
                )}
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
          subHeader={subActionsTitle}
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
                setSubActionsTitle(undefined);
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
              setSubActionsTitle(action.text);
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
