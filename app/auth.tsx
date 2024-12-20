import { useRouter } from "one";
import { useEffect } from "react";
import { Auth } from "~/src/features/auth";
import { useAuth } from "~/src/stores/auth";
import * as routes from "~/src/lib/routes";

export default function Page() {
  const router = useRouter();
  const jwt = useAuth((s) => s.jwt);

  useEffect(() => {
    if (jwt) {
      router.canGoBack() ? router.back() : router.replace(routes.home);
    }
  }, [jwt]);

  return <Auth />;
}
