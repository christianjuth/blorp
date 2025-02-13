import { useThemeName } from "tamagui";
import LogoDark from "~/assets/logo-dark.svg";
import LogoLight from "~/assets/logo-light.svg";
import { Image } from "./image";
import { scale } from "~/config/tamagui/scale";

export function Logo() {
  const themeName = useThemeName();
  return (
    <>
      {themeName === "dark" && (
        <Image
          imageUrl={LogoDark}
          style={{ height: 38 * scale, width: 90 * scale }}
        />
      )}
      {themeName === "light" && (
        <Image
          imageUrl={LogoLight}
          style={{ height: 38 * scale, width: 90 * scale }}
        />
      )}
    </>
  );
}
