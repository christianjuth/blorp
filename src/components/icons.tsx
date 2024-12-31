import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useTheme } from "tamagui";
import { ComponentProps } from "react";

function createIcon(defaultProps: ComponentProps<typeof FontAwesome6>) {
  return (
    props: Omit<ComponentProps<typeof FontAwesome6>, "name" | "iconStyle">,
  ) => {
    const theme = useTheme();
    return (
      <FontAwesome6
        {...defaultProps}
        {...props}
        color={props.color ?? theme.color.val}
      />
    );
  };
}

export const MagnafineGlass = createIcon({
  name: "magnifying-glass",
  iconStyle: "solid",
  size: 18,
});
