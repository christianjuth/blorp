import { Text, View } from "tamagui";
import { useParams, useNavigation } from "one";
import { Image } from "~/src/components/image";
import { Markdown } from "~/src/components/markdown";
import { Voting } from "~/src/components/posts/post-buttons";
import { PostComments } from "~/src/components/posts/post-comment";
import { useEffect } from "react";
import { usePost, usePostComments } from "~/src/lib/lemmy";

const EMPTY_ARR = [];

export default function Post() {
  const nav = useNavigation();

  const { postId } = useParams<{ postId: string }>();

  const { data } = usePost({
    id: postId ? parseInt(postId) : undefined,
  });

  const comments = usePostComments({
    post_id: postId ? parseInt(postId) : undefined,
    sort: "Hot",
    limit: 50,
  });

  const postView = data?.post_view;
  const post = postView?.post;
  const thumbnail = post?.thumbnail_url;
  const body = post?.body;

  const communityTitle = postView?.community.title;

  useEffect(() => {
    nav.setOptions({ title: communityTitle ?? "" });
  }, [communityTitle]);

  const allComments = comments.data
    ? comments.data.pages.map((p) => p.comments).flat()
    : EMPTY_ARR;

  return (
    <PostComments
      commentViews={allComments}
      header={
        <View maxWidth={800} mx="auto" w="100%">
          {thumbnail && <Image imageUrl={thumbnail} priority />}
          <View p="$3" bg="$gray1" gap="$2">
            <Text fontWeight={500} fontSize="$8" lineHeight="$7">
              {data?.post_view?.post.name}
            </Text>
            {body && <Markdown markdown={body} />}

            <View dsp="flex" fd="row" ai="flex-start">
              {postView && <Voting postView={postView} />}
            </View>
          </View>
        </View>
      }
      loadMore={() => {
        if (comments.hasNextPage && !comments.isFetchingNextPage) {
          comments.fetchNextPage();
        }
      }}
    />
  );
}
export async function generateStaticParams() {
  return [];
}
