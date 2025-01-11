import { Button, ButtonProps } from "tamagui";

export function CommunityJoinButton(props: ButtonProps) {
  return (
    <Button bg="$accentColor" br="$12" fontWeight="bold" size="$3" {...props}>
      Join
    </Button>
  );
}
