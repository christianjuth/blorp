import { Community } from "lemmy-js-client";
import { Link } from "one";
import { Avatar, XStack, Text } from "tamagui";
import { createCommunitySlug } from "~/src/lib/lemmy";

export function SmallCommunityCard({
  disableLink = false,
  community,
}: {
  disableLink?: boolean;
  community: Pick<Community, "icon" | "title" | "name" | "id" | "actor_id">;
}) {
  const slug = createCommunitySlug(community);

  const content = (
    <XStack ai="center" gap="$2.5" tag="a">
      <Avatar size="$2.5" borderRadius="$12">
        <Avatar.Image src={community.icon} />
        <Avatar.Fallback
          backgroundColor="$color8"
          borderRadius="$12"
          ai="center"
          jc="center"
        >
          <Text fontSize="$4">{community.title.substring(0, 1)}</Text>
        </Avatar.Fallback>
      </Avatar>
      <Text fontSize="$3">c/{slug}</Text>
    </XStack>
  );

  return disableLink ? (
    content
  ) : (
    <Link href={`/c/${slug}`} key={community.id} asChild replace>
      {content}
    </Link>
  );
}
