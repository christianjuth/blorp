import { useState } from "react";
import {
  AnimatePresence,
  Button,
  H1,
  Paragraph,
  SizableText,
  Spinner,
  View,
  Form,
} from "tamagui";
import { Input } from "~/src/components/ui/input";
import { useLogin } from "../lib/lemmy";

/** ------ EXAMPLE ------ */
export function Auth() {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutate, status } = useLogin();
  return (
    <Form
      flexDirection="column"
      alignItems="stretch"
      width="100%"
      gap="$4"
      padding="$4"
      paddingVertical="$6"
      $gtSm={{
        paddingVertical: "$4",
        width: 400,
      }}
      mx="auto"
      onSubmit={() => {
        console.log("HERE");
        mutate({
          username_or_email: userName,
          password: password,
        });
      }}
    >
      <H1
        alignSelf="center"
        size="$8"
        $xs={{
          size: "$7",
        }}
      >
        Sign in to your account
      </H1>
      <View flexDirection="column" gap="$3">
        <View flexDirection="column" gap="$1">
          <Input size="$4">
            <Input.Label htmlFor="email">Email</Input.Label>
            <Input.Box>
              <Input.Area
                id="email"
                placeholder="email@example.com"
                value={userName}
                onChangeText={setUsername}
              />
            </Input.Box>
          </Input>
        </View>
        <View flexDirection="column" gap="$1">
          <Input size="$4">
            <View
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Input.Label htmlFor="password">Password</Input.Label>
              <ForgotPasswordLink />
            </View>
            <Input.Box>
              <Input.Area
                textContentType="password"
                secureTextEntry
                id="password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
              />
            </Input.Box>
          </Input>
        </View>
      </View>
      <Form.Trigger asChild>
        <Button
          disabled={status === "pending"}
          // onPress={signIn}
          width="100%"
          iconAfter={
            <AnimatePresence>
              {status === "pending" && (
                <Spinner
                  color="$color"
                  key="loading-spinner"
                  opacity={1}
                  scale={1}
                  animation="quick"
                  position="absolute"
                  left="60%"
                  enterStyle={{
                    opacity: 0,
                    scale: 0.5,
                  }}
                  exitStyle={{
                    opacity: 0,
                    scale: 0.5,
                  }}
                />
              )}
            </AnimatePresence>
          }
        >
          <Button.Text>Sign In</Button.Text>
        </Button>
      </Form.Trigger>
      <SignUpLink />
    </Form>
  );
}

// Swap for your own Link
const Link = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <View href={href} tag="a">
      {children}
    </View>
  );
};

const SignUpLink = () => {
  return (
    <Link href={`#`}>
      <Paragraph textDecorationStyle="unset" ta="center">
        Don&apos;t have an account?{" "}
        <SizableText
          hoverStyle={{
            color: "$colorHover",
          }}
          textDecorationLine="underline"
        >
          Sign up
        </SizableText>
      </Paragraph>
    </Link>
  );
};

const ForgotPasswordLink = () => {
  return (
    <Link href={`#`}>
      <Paragraph
        color="$gray11"
        hoverStyle={{
          color: "$gray12",
        }}
        size="$1"
        marginTop="$1"
      >
        Forgot your password?
      </Paragraph>
    </Link>
  );
};
