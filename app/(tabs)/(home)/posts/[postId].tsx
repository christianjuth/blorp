import { ScrollView, Text, View } from "tamagui";
import { useParams, useNavigation } from "one";

import { lemmy } from "~/src/lib/lemmy";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { GetComments, GetPost } from "lemmy-js-client";
import { Image } from "~/src/components/image";
import { Markdown } from "~/src/components/markdown";
import { Voting } from "~/src/components/posts/post-buttons";
import { PostComments } from "~/src/components/posts/post-comment";
import { useEffect, useMemo } from "react";
import { FlashList } from "@shopify/flash-list";

const EMPTY_ARR = [];

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
  return useInfiniteQuery({
    queryKey: ["getComments"],
    queryFn: async ({ pageParam }) => {
      const limit = form.limit ?? 50;
      const { comments } = await lemmy.getComments({
        ...form,
        limit,
        page: pageParam,
      });
      return {
        comments,
        page: comments.length < limit ? null : pageParam + 1,
      };
    },
    enabled: !!form.post_id,
    getNextPageParam: (data) => data.page,
    initialPageParam: 1,
  });
}

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
  console.log(comments);

  const postView = data?.post_view;
  const post = data?.post_view.post;
  const thumbnail = post?.thumbnail_url;
  const body = post?.body;

  const communityTitle = data?.community_view.community.title;
  useEffect(() => {
    nav.setOptions({ title: communityTitle ?? "" });
  }, [communityTitle]);

  const allComments = comments.data
    ? comments.data.pages.map((p) => p.comments).flat()
    : EMPTY_ARR;

  useEffect(() => {
    if (comments.hasNextPage && !comments.isFetchingNextPage) {
      comments.fetchNextPage();
    }
  }, [
    comments.hasNextPage,
    comments.fetchNextPage,
    comments.isFetchingNextPage,
  ]);

  return (
    <PostComments
      commentViews={allComments}
      header={() => (
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
        </View>
      )}
    />
  );
}
