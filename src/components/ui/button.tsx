import { ArrowUp } from "@tamagui/lucide-icons";
import { Button as TButton, ButtonProps, XStack, Text } from "tamagui";

export function Button({ children, ...props }: ButtonProps) {
  return (
    <TButton bg="$accentColor" color="white" br={9999} {...props}>
      {children}
    </TButton>
  );
}

interface RefreshButtonProps extends ButtonProps {
  hideOnGtMd?: boolean;
}

export function RefreshButton({ hideOnGtMd, ...props }: RefreshButtonProps) {
  return (
    <XStack
      tag="button"
      gap="$1.5"
      ai="center"
      bw={1}
      bc="$accentColor"
      br={99999}
      py={7}
      px={13}
      $gtMd={{
        display: hideOnGtMd ? "none" : "flex",
      }}
      {...props}
    >
      <Text col="$accentColor" fontSize="$3">
        New posts
      </Text>
      <ArrowUp size={15} col="$accentColor" />
    </XStack>
  );
}
