import { useParams } from "one";
import { User } from "~/src/features/user";

export default function Page() {
  const { userId } = useParams<{ userId: string }>();

  return <User userId={userId} />;
}
