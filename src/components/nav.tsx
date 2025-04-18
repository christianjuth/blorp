import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { parseAccountInfo, useAuth } from "../stores/auth";
import { useLinkContext } from "./nav/link-context";
import { encodeApId } from "../lib/lemmy/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { useState } from "react";
import { useRequireAuth } from "./auth-context";
import { IonButton, IonMenuButton } from "@ionic/react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import { useLogout } from "../lib/lemmy";
import { LuMenu } from "react-icons/lu";

export function UserDropdown() {
  const linkCtx = useLinkContext();
  const logout = useLogout();
  const requireAuth = useRequireAuth();

  const selectedAccount = useAuth((s) => s.getSelectedAccount());
  const accounts = useAuth((s) => s.accounts);
  const setAccountIndex = useAuth((s) => s.setAccountIndex);

  const { person, instance } = parseAccountInfo(selectedAccount);

  const [accountSwitcher, setAccountSwitcher] = useState(false);

  if (!person && accounts.length <= 1) {
    return <IonButton onClick={() => requireAuth()}>Login</IonButton>;
  }

  return (
    <DropdownMenu onOpenChange={() => setAccountSwitcher(false)}>
      <DropdownMenuTrigger>
        <Avatar key={person ? 0 : 1}>
          {person && <AvatarImage src={person.avatar} />}
          <AvatarFallback>
            {person && person.name?.substring(0, 1).toUpperCase()}
            {!person && <IoPerson />}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          className="flex flex-col items-start"
          onClick={(e) => {
            e.preventDefault();
            setAccountSwitcher((s) => !s);
          }}
        >
          <Avatar className="h-16 w-16">
            {person && <AvatarImage src={person.avatar} />}
            <AvatarFallback>
              {person && person.name?.substring(0, 1).toUpperCase()}
              {!person && <IoPerson />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-row gap-2 items-center">
            <div className="flex flex-col">
              <span className="text-md">
                {person?.display_name ?? person?.name}
              </span>
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
                  <Avatar>
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
                <DropdownMenuItem>Saved</DropdownMenuItem>
              </Link>
            )}
            {person && (
              <Link to={`${linkCtx.root}u/${encodeApId(person.actor_id)}`}>
                <DropdownMenuItem>Profile</DropdownMenuItem>
              </Link>
            )}
            <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MenuButton() {
  return (
    <IonMenuButton>
      <LuMenu className="text-[1.4rem]" />
    </IonMenuButton>
  );
}
