import { Button as TButton, ButtonProps } from "tamagui";

export function Button({ children, ...props }: ButtonProps) {
  return (
    <TButton bg="$accentColor" color="white" br={9999} {...props}>
      {children}
    </TButton>
  );
}
