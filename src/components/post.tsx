import { Text, View } from 'tamagui'
import { Image } from '@tamagui/image-next'
import { PostView } from 'lemmy-js-client';

export const POST_HEIGHT = 90;
export const EXPANDED_POST_HEIGHT = 200;

export function PostCompact({
  postView,
  toggleExpand,
  expanded
}: {
  postView: PostView,
  toggleExpand: () => any,
  expanded: boolean
}) {
  const { post, creator, community } = postView;
  const server = new URL(post.ap_id);
  return (
    <View h={expanded ? EXPANDED_POST_HEIGHT : POST_HEIGHT} dsp="flex" fd="row" gap="$3">
      <Image
        src={post.thumbnail_url}
        aspectRatio={1} h="100%"
        objectFit="cover"
        onPress={toggleExpand}
      />
      <View dsp="flex" fd="column" jc="space-between" py="$2">
        <Text color="grey">
          @{creator.name} to {community.title}@{server.host}
        </Text>
        <Text fontWeight="bold">
          {post.name}
        </Text>
      </View>
    </View>
  );
}
