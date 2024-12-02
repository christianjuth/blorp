import { ScrollView, Text, View } from "tamagui";
import { useParams, useNavigation } from "one";

import { lemmy } from "~/src/lib/lemmy";
import { useQuery } from "@tanstack/react-query";
import { GetComments, GetPost } from "lemmy-js-client";
import { Image } from "~/src/components/image";
import { Markdown } from "~/src/components/markdown";
import { Voting } from "~/src/components/posts/post-buttons";
import { PostComments } from "~/src/components/posts/post-comment";

function usePost(form: GetPost) {
  return useQuery({
    queryKey: ["getPost"],
    queryFn: () => {
      return lemmy.getPost(form);
    },
    enabled: !!form.id,
  });
}

function usePostComments(form: GetComments) {
  return useQuery({
    queryKey: ["getComments"],
    queryFn: () => {
      return lemmy.getComments(form);
    },
    enabled: !!form.post_id,
  });
}

export default function Post() {
  const nav = useNavigation();

  const { postId } = useParams<{ postId: string }>();

  const { data } = usePost({
    id: postId ? parseInt(postId) : undefined,
  });

  const { data: commentsData } = usePostComments({
    post_id: postId ? parseInt(postId) : undefined,
    sort: "Hot",
    limit: 50,
  });

  const postView = data?.post_view;
  const post = data?.post_view.post;
  const thumbnail = post?.thumbnail_url;
  const body = post?.body;

  const communityTitle = data?.community_view.community.title;
  if (communityTitle) {
    nav.setOptions({ title: communityTitle });
  }

  return (
    <ScrollView bg="$gray5">
      <View maxWidth={800} mx="auto" w="100%">
        {thumbnail && <Image imageUrl={thumbnail} />}
        <View p="$3" bg="$gray1" gap="$2">
          <Text fontWeight={500} fontSize="$8" lineHeight="$7">
            {data?.post_view.post.name}
          </Text>
          {body && <Markdown markdown={body} />}

          <View dsp="flex" fd="row" ai="flex-start">
            {postView && <Voting postView={postView} />}
          </View>
        </View>

        {commentsData?.comments && (
          <PostComments commentViews={commentsData?.comments} />
        )}
      </View>
    </ScrollView>
  );
}
