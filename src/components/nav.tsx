import { Link } from "@/src/routing/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { parseAccountInfo, useAuth } from "../stores/auth";
import { useLinkContext } from "../routing/link-context";
import { encodeApId } from "../lib/lemmy/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { useState } from "react";
import { useRequireAuth } from "./auth-context";
import { IonMenuButton, IonMenuToggle } from "@ionic/react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import { useLogout } from "../lib/lemmy";
import { LuMenu } from "react-icons/lu";
import { Button } from "./ui/button";
import { useMedia } from "../lib/hooks";
import { IoPersonOutline, IoBookmarksOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import { LEFT_SIDEBAR_MENU_ID, RIGHT_SIDEBAR_MENU_ID } from "../routing/config";

export function UserDropdown() {
  const media = useMedia();
  const linkCtx = useLinkContext();
  const logout = useLogout();
  const requireAuth = useRequireAuth();

  const selectedAccount = useAuth((s) => s.getSelectedAccount());
  const accounts = useAuth((s) => s.accounts);
  const setAccountIndex = useAuth((s) => s.setAccountIndex);

  const { person, instance } = parseAccountInfo(selectedAccount);

  const [accountSwitcher, setAccountSwitcher] = useState(false);

  if (!person && accounts.length <= 1) {
    return (
      <Button size="sm" onClick={() => requireAuth()}>
        Login
      </Button>
    );
  }

  const content = (
    <Avatar key={person ? 0 : 1}>
      {person && <AvatarImage src={person.avatar} />}
      <AvatarFallback>
        {person && person.name?.substring(0, 1).toUpperCase()}
        {!person && <IoPerson />}
      </AvatarFallback>
    </Avatar>
  );

  if (media.maxMd) {
    return (
      <IonMenuToggle menu={RIGHT_SIDEBAR_MENU_ID} autoHide={false}>
        {content}
      </IonMenuToggle>
    );
  }

  return (
    <DropdownMenu onOpenChange={() => setAccountSwitcher(false)}>
      <DropdownMenuTrigger>{content}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          className="flex flex-col items-start"
          onClick={(e) => {
            e.preventDefault();
            setAccountSwitcher((s) => !s);
          }}
        >
          <Avatar className="h-16 w-16" key={person?.id}>
            {person && <AvatarImage src={person.avatar} />}
            <AvatarFallback className="text-xl">
              {person && person.name?.substring(0, 1).toUpperCase()}
              {!person && <IoPerson />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-row gap-2 items-center">
            <div className="flex flex-col">
              <span className="text-md">{person?.name}</span>
              <span className="text-xs text-muted-foreground">@{instance}</span>
            </div>

            {accountSwitcher ? (
              <FaChevronUp className="text-brand" />
            ) : (
              <FaChevronDown className="text-brand" />
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {accountSwitcher ? (
          <>
            {accounts.map((a, index) => {
              const { person, instance } = parseAccountInfo(a);
              return (
                <DropdownMenuItem
                  onClick={() => {
                    close();
                    setAccountIndex(index);
                  }}
                  key={instance + index}
                >
                  <Avatar key={person?.id}>
                    {person && <AvatarImage src={person.avatar} />}
                    <AvatarFallback>
                      {person && person.name?.substring(0, 1).toUpperCase()}
                      {!person && <IoPerson />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span>{person?.display_name ?? person?.name}</span>
                    <span className="text-muted-foreground text-xs">
                      @{instance}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuItem
              onClick={() => {
                close();
                requireAuth({ addAccount: true });
              }}
            >
              Add account
            </DropdownMenuItem>
          </>
        ) : (
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
            <DropdownMenuItem onClick={() => logout.mutate(selectedAccount)}>
              <FiLogOut />
              Logout
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserSidebar() {
  const linkCtx = useLinkContext();
  const logout = useLogout();
  const requireAuth = useRequireAuth();

  const selectedAccount = useAuth((s) => s.getSelectedAccount());
  const accounts = useAuth((s) => s.accounts);
  const setAccountIndex = useAuth((s) => s.setAccountIndex);

  const { person, instance } = parseAccountInfo(selectedAccount);

  const [accountSwitcher, setAccountSwitcher] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Avatar className="h-24 w-24" key={person?.id}>
        {person && <AvatarImage src={person.avatar} />}
        <AvatarFallback className="text-2xl">
          {person && person.name?.substring(0, 1).toUpperCase()}
          {!person && <IoPerson />}
        </AvatarFallback>
      </Avatar>

      <button
        onClick={() => setAccountSwitcher((b) => !b)}
        className="flex flex-row gap-2 items-center text-left"
      >
        <div className="flex flex-col">
          <span className="text-lg leading-snug">{person?.name}</span>
          <span className="text-sm text-muted-foreground">@{instance}</span>
        </div>

        {accountSwitcher ? (
          <FaChevronUp className="text-brand" />
        ) : (
          <FaChevronDown className="text-brand" />
        )}
      </button>

      <div className="h-px bg-border" />

      {accountSwitcher ? (
        <>
          {accounts.map((a, index) => {
            const { person, instance } = parseAccountInfo(a);
            return (
              <IonMenuToggle key={instance + index}>
                <button
                  onClick={() => {
                    close();
                    setAccountIndex(index);
                    setAccountSwitcher(false);
                  }}
                  className="flex flex-row gap-2 items-center text-left"
                >
                  <Avatar key={person?.id}>
                    {person && <AvatarImage src={person.avatar} />}
                    <AvatarFallback>
                      {person && person.name?.substring(0, 1).toUpperCase()}
                      {!person && <IoPerson />}
                    </AvatarFallback>
                  </Avatar>
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
                close();
                requireAuth({ addAccount: true });
              }}
              className="text-lg"
            >
              Add account
            </button>
          </IonMenuToggle>
        </>
      ) : (
        <>
          {person && (
            <IonMenuToggle menu={RIGHT_SIDEBAR_MENU_ID} autoHide={false}>
              <Link
                to="/home/saved"
                className="flex flex-row items-center gap-2 text-lg"
              >
                <IoBookmarksOutline />
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
                className="flex flex-row items-center gap-2 text-lg"
              >
                <IoPersonOutline /> Profile
              </Link>
            </IonMenuToggle>
          )}
          <IonMenuToggle menu={RIGHT_SIDEBAR_MENU_ID} autoHide={false}>
            <button
              onClick={() => logout.mutate(selectedAccount)}
              className="flex flex-row items-center gap-2 text-lg"
            >
              <FiLogOut /> Logout
            </button>
          </IonMenuToggle>
        </>
      )}
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
