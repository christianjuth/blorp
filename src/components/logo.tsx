import LogoDark from "@/assets/logo-dark.svg";
import LogoLight from "@/assets/logo-light.svg";
import { env } from "../env";

export function Logo() {
  return (
    <>
      <img
        src={env.REACT_APP_LOGO_SRC ?? LogoDark}
        style={{ height: 38, width: 90 }}
        className="hidden dark:block object-contain object-left"
        alt={`${env.REACT_APP_NAME} logo`}
      />
      <img
        src={env.REACT_APP_LOGO_SRC ?? LogoLight}
        style={{ height: 38, width: 90 }}
        className="dark:hidden object-contain object-left"
        alt={`${env.REACT_APP_NAME} logo`}
      />
    </>
  );
}
