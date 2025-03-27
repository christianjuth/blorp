import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/src/components/ui/dropdown-menu";
import { parseAccountInfo, useAuth } from "../stores/auth";
import { useLinkContext } from "./nav/link-context";
import { encodeApId } from "../lib/lemmy/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/src/components/ui/avatar";
import { useState } from "react";
import { useRequireAuth } from "./auth-context";
import { IonButton } from "@ionic/react";

export function UserDropdown() {
  const linkCtx = useLinkContext();
  // const logout = useLogout();
  const requireAuth = useRequireAuth();

  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const selectedAccount = useAuth((s) => s.getSelectedAccount());
  const accounts = useAuth((s) => s.accounts);
  const setAccountIndex = useAuth((s) => s.setAccountIndex);

  const { person, instance } = parseAccountInfo(selectedAccount);

  const [accountSwitcher, setAccountSwitcher] = useState(false);

  if (!person) {
    return <IonButton onClick={() => requireAuth()}>Login</IonButton>;
  }

  return (
    <DropdownMenu onOpenChange={() => setAccountSwitcher(false)}>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={person.avatar} />
          <AvatarFallback>
            {person.name?.substring(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem
          className="flex flex-col"
          onClick={(e) => {
            e.preventDefault();
            setAccountSwitcher((s) => !s);
          }}
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={person.avatar} />
            <AvatarFallback>
              {person.name?.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <span className="text-md">
              {person?.display_name ?? person?.name}
            </span>
            <span className="text-sm">{instance}</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {accountSwitcher ? (
          <>
            {accounts.map((a, index) => {
              const { person, instance } = parseAccountInfo(a);
              return (
                <DropdownMenuItem
                  // py="$1.5"
                  // tag="button"
                  // ai="center"
                  // px="$2.5"
                  // gap="$2.5"
                  onClick={() => {
                    close();
                    setAccountIndex(index);
                  }}
                  key={instance + index}
                >
                  {person && (
                    <Avatar>
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback>
                        {person.name?.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col">
                    <span>{person?.display_name ?? person?.name}</span>
                    <span className="text-zinc-500">{instance}</span>
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
              {/* <PlusCircle size="$2" px="$1" col="$color9" /> */}
              Add account
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <Link to="/home/saved">
              <DropdownMenuItem>Saved</DropdownMenuItem>
            </Link>
            <Link to={`${linkCtx.root}u/${encodeApId(person.actor_id)}`}>
              <DropdownMenuItem>Profile</DropdownMenuItem>
            </Link>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
