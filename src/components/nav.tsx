import { Link } from "@/src/routing/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/src/components/ui/dropdown-menu";
import { parseAccountInfo, useAuth } from "../stores/auth";
import { useLinkContext } from "../routing/link-context";
import { createSlug, encodeApId } from "../lib/lemmy/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { useRequireAuth } from "./auth-context";
import { IonMenuButton, IonMenuToggle } from "@ionic/react";
import { IoPerson } from "react-icons/io5";
import { useLogout, useNotificationCount } from "../lib/lemmy";
import { LuMenu } from "react-icons/lu";
import { Button } from "./ui/button";
import { useConfirmationAlert, useMedia } from "../lib/hooks";
import {
  IoPersonOutline,
  IoBookmarksOutline,
  IoPersonAddOutline,
} from "react-icons/io5";
import { LEFT_SIDEBAR_MENU_ID, RIGHT_SIDEBAR_MENU_ID } from "../routing/config";
import { LogOut } from "./icons";
import { BadgeCount } from "./badge-count";
import _ from "lodash";
import { Separator } from "./ui/separator";

function AccountNotificationBadge({
  accountIndex,
  children,
}: {
  accountIndex: number;
  children: React.ReactNode;
}) {
  const count = useNotificationCount()[accountIndex];
  return <BadgeCount showBadge={!!count}>{children}</BadgeCount>;
}

export function UserDropdown() {
  const getConfirmation = useConfirmationAlert();
  const media = useMedia();
  const linkCtx = useLinkContext();
  const logout = useLogout();
  const requireAuth = useRequireAuth();

  const selectedAccountIndex = useAuth((s) => s.accountIndex);
  const selectedAccount = useAuth((s) => s.getSelectedAccount());
  const accounts = useAuth((s) => s.accounts);
  const setAccountIndex = useAuth((s) => s.setAccountIndex);

  const counts = useNotificationCount();
  const count = _.sum(counts.filter((_, i) => i !== selectedAccountIndex));

  const { person, instance } = parseAccountInfo(selectedAccount);

  if (!person && accounts.length <= 1) {
    return (
      <Button size="sm" onClick={() => requireAuth()}>
        Login
      </Button>
    );
  }

  const content = (
    <BadgeCount showBadge={!!count}>
      <Avatar key={person ? 0 : 1}>
        {person && <AvatarImage src={person.avatar} />}
        <AvatarFallback>
          {person && person.name?.substring(0, 1).toUpperCase()}
          {!person && <IoPerson />}
        </AvatarFallback>
      </Avatar>
    </BadgeCount>
  );

  if (media.maxMd) {
    return (
      <IonMenuToggle menu={RIGHT_SIDEBAR_MENU_ID} autoHide={false}>
        {content}
      </IonMenuToggle>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{content}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="h-12 w-12" key={person?.id}>
            <AvatarImage src={person?.avatar} />
            <AvatarFallback className="text-xl">
              {person && person.name?.substring(0, 1).toUpperCase()}
              {!person && <IoPerson />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-row gap-2 items-center">
            <div className="flex flex-col">
              <span className="text-md line-clamp-1">{person?.name}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">
                @{instance}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <>
          {person && (
            <Link to="/home/saved">
              <DropdownMenuItem>
                <IoBookmarksOutline /> Saved
              </DropdownMenuItem>
            </Link>
          )}
          {person && (
            <Link
              to={`${linkCtx.root}u/:userId`}
              params={{
                userId: encodeApId(person.actor_id),
              }}
            >
              <DropdownMenuItem>
                <IoPersonOutline /> Profile
              </DropdownMenuItem>
            </Link>
          )}
          {person && (
            <DropdownMenuItem
              onClick={() =>
                getConfirmation({
                  message: `Are you sure you want to logout of ${createSlug(person)?.slug ?? "this account"}`,
                }).then(() => logout.mutate(selectedAccount))
              }
            >
              <LogOut />
              Logout
            </DropdownMenuItem>
          )}
        </>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Other accounts</DropdownMenuLabel>

        <>
          {accounts.map((a, index) => {
            if (a.jwt && a.jwt === selectedAccount.jwt) {
              return null;
            }

            const { person, instance } = parseAccountInfo(a);
            return (
              <DropdownMenuItem
                onClick={() => {
                  setAccountIndex(index);
                }}
                key={instance + index}
                className="relative"
              >
                <AccountNotificationBadge accountIndex={index}>
                  <Avatar key={person?.id} className="h-7 w-7">
                    <AvatarImage src={person?.avatar} />
                    <AvatarFallback>
                      {person && person.name?.substring(0, 1).toUpperCase()}
                      {!person && <IoPerson />}
                    </AvatarFallback>
                  </Avatar>
                </AccountNotificationBadge>
                <div className="flex flex-col text-xs leading-4">
                  <span>{person?.display_name ?? person?.name}</span>
                  <span className="text-muted-foreground">@{instance}</span>
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuItem
            onClick={() => {
              requireAuth({ addAccount: true });
            }}
          >
            <IoPersonAddOutline />
            Add account
          </DropdownMenuItem>
        </>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserSidebar() {
  const getConfirmation = useConfirmationAlert();
  const linkCtx = useLinkContext();
  const logout = useLogout();
  const requireAuth = useRequireAuth();

  const selectedAccount = useAuth((s) => s.getSelectedAccount());
  const accounts = useAuth((s) => s.accounts);
  const setAccountIndex = useAuth((s) => s.setAccountIndex);
  const counts = useNotificationCount();

  const { person, instance } = parseAccountInfo(selectedAccount);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12" key={person?.id}>
          {person && <AvatarImage src={person.avatar} />}
          <AvatarFallback className="text-xl">
            {person && person.name?.substring(0, 1).toUpperCase()}
            {!person && <IoPerson />}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <span className="leading-snug line-clamp-1">{person?.name}</span>
          <span className="text-sm text-muted-foreground line-clamp-1">
            @{instance}
          </span>
        </div>
      </div>

      <Separator />

      <>
        {person && (
          <IonMenuToggle menu={RIGHT_SIDEBAR_MENU_ID} autoHide={false}>
            <Link to="/home/saved" className="flex flex-row items-center gap-2">
              <IoBookmarksOutline className="text-muted-foreground" />
              Saved
            </Link>
          </IonMenuToggle>
        )}
        {person && (
          <IonMenuToggle menu={RIGHT_SIDEBAR_MENU_ID} autoHide={false}>
            <Link
              to={`${linkCtx.root}u/:userId`}
              params={{
                userId: encodeApId(person.actor_id),
              }}
              className="flex flex-row items-center gap-2"
            >
              <IoPersonOutline className="text-muted-foreground" /> Profile
            </Link>
          </IonMenuToggle>
        )}

        {person && (
          <IonMenuToggle menu={RIGHT_SIDEBAR_MENU_ID} autoHide={false}>
            <button
              onClick={() =>
                getConfirmation({
                  message: `Are you sure you want to logout of ${createSlug(person)?.slug ?? "this account"}`,
                }).then(() => logout.mutate(selectedAccount))
              }
              className="flex flex-row items-center gap-2"
            >
              <LogOut className="text-muted-foreground" /> Logout
            </button>
          </IonMenuToggle>
        )}
      </>

      <Separator />

      <span>Other accounts</span>

      {accounts.map((a, index) => {
        if (a.jwt && a.jwt === selectedAccount.jwt) {
          return null;
        }

        const { person, instance } = parseAccountInfo(a);
        return (
          <IonMenuToggle key={instance + index}>
            <button
              onClick={() => {
                setAccountIndex(index);
              }}
              className="flex flex-row gap-2 items-center text-left"
            >
              <BadgeCount showBadge={!!counts[index]}>
                <Avatar key={person?.id}>
                  {person && <AvatarImage src={person.avatar} />}
                  <AvatarFallback>
                    {person && person.name?.substring(0, 1).toUpperCase()}
                    {!person && <IoPerson />}
                  </AvatarFallback>
                </Avatar>
              </BadgeCount>
              <div className="flex flex-col">
                <span>{person?.display_name ?? person?.name}</span>
                <span className="text-muted-foreground text-xs">
                  @{instance}
                </span>
              </div>
            </button>
          </IonMenuToggle>
        );
      })}

      <IonMenuToggle menu={RIGHT_SIDEBAR_MENU_ID} autoHide={false}>
        <button
          onClick={() => {
            requireAuth({ addAccount: true });
          }}
          className="flex flex-row items-center gap-2"
        >
          <IoPersonAddOutline className="text-muted-foreground" />
          Add account
        </button>
      </IonMenuToggle>
    </div>
  );
}

export function MenuButton() {
  // Negative margin aligns icon left side with button left side
  return (
    <IonMenuButton
      menu={LEFT_SIDEBAR_MENU_ID}
      autoHide={false}
      className="lg:hidden"
    >
      <LuMenu className="text-[1.4rem] -ml-[7px]" />
    </IonMenuButton>
  );
}
