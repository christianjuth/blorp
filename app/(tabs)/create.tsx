import { View, Text } from "tamagui";
import { Link } from "one";
import { useAuth } from "~/src/stores/auth";
import * as routes from "~/src/lib/routes";

export default function HomePage() {
  const jwt = useAuth((s) => s.jwt);

  return (
    <View height="100%" bg="$color1">
      <Text>Create</Text>

      {!jwt && (
        <Link href={routes.auth}>
          <Text>Login to create</Text>
        </Link>
      )}
    </View>
  );
}
