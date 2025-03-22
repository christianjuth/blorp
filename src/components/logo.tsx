import LogoDark from "~/assets/logo-dark.svg";
import LogoLight from "~/assets/logo-light.svg";

export function Logo() {
  return (
    <>
      <img
        src={LogoDark}
        style={{ height: 38, width: 90 }}
        className="hidden dark:block"
      />
      <img
        src={LogoLight}
        style={{ height: 38, width: 90 }}
        className="dark:hidden"
      />
    </>
  );
}
