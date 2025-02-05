import { Link } from "one";
import { isWeb, ScrollView, Text, View, XStack, YStack } from "tamagui";
import { ContentGutters } from "~/src/components/gutters";
import { Markdown } from "~/src/components/markdown";

function Action({ children }: { children: React.ReactNode }) {
  return (
    <View bw={1} bc="$accentColor" br="$6" p="$5" pos="relative">
      <View
        pos="absolute"
        t={0}
        r={0}
        b={0}
        l={0}
        bg="$accentColor"
        o={0.2}
        br="$6"
      />
      <Text color="$accentColor" fontSize="$6">
        {children}
      </Text>
    </View>
  );
}

export default function Page() {
  const content = (
    <ContentGutters>
      <YStack flex={1} py="$10" gap="$7">
        <YStack gap="$3">
          <Link href="/" asChild>
            <Text tag="a" col="$accentColor">
              Return home
            </Text>
          </Link>

          <Text tag="h1" fontWeight="bold" fontSize="$9">
            Need Help? We're Here for You!
          </Text>

          <Text>
            If you have any questions, need assistance, or encounter issues with
            the app, please don't hesitate to contact us. Our support team is
            ready to help you—no account or login required.
          </Text>
        </YStack>

        <YStack gap="$3">
          <Text tag="h2" fontWeight="bold" fontSize="$6">
            Email Support (Recommended)
          </Text>

          <Text>
            For the fastest response, please email us directly using the link
            below:
          </Text>

          <Link href="mailto:support@https://blorpblorp.xyz/" asChild>
            <Text color="$accentColor" tag="a">
              Email support!
            </Text>
          </Link>
        </YStack>

        <YStack gap="$3">
          <Text tag="h2" fontWeight="bold" fontSize="$6">
            GitHub (optional)
          </Text>

          <Text>
            For those who use GitHub, you can also track the status of known
            issues or report bugs here:
          </Text>

          <XStack gap="$3">
            <Link
              href="https://github.com/christianjuth/blorp/issues"
              asChild
              target="_blank"
            >
              <Text color="$accentColor" tag="a">
                Known issues
              </Text>
            </Link>
            <Text col="$color7">|</Text>
            <Link
              href="https://github.com/christianjuth/blorp/issues/new"
              asChild
              target="_blank"
            >
              <Text color="$accentColor" tag="a">
                Report issue [1]
              </Text>
            </Link>
          </XStack>

          <Text fontStyle="italic" col="$color10">
            [1] Report issue requires GitHub account
          </Text>
        </YStack>
      </YStack>
    </ContentGutters>
  );

  return isWeb ? (
    <View bg="$background">{content}</View>
  ) : (
    <ScrollView bg="$background">{content}</ScrollView>
  );
}
