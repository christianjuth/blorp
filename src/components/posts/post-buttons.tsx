// import { ArrowBigUp, ArrowBigDown, MessageCircle } from "@tamagui/lucide-icons";
import { useLikePost } from "~/src/lib/lemmy/index";
// import { voteHaptics } from "~/src/lib/voting";
import { useRequireAuth } from "../auth-context";

import { arrowUp, arrowDown, chatbubbleOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import { twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";

export function Voting({
  apId,
  myVote,
  score,
}: {
  apId: string;
  myVote: number;
  score: number;
}) {
  const requireAuth = useRequireAuth();

  const vote = useLikePost(apId);

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

  return (
    <div
      className="flex flex-row border-zinc-200 dark:border-zinc-700 border rounded-full items-center h-7"
      // dsp="flex"
      // fd="row"
      // ai="center"
      // borderRadius="$12"
      // bw={1}
      // bc="$color5"
    >
      <button
        // h="$2"
        // borderRadius="$12"
        // p={0}
        // pl={7}
        // bg="transparent"
        onClick={async () => {
          const newVote = isUpvoted ? 0 : 1;
          // voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate(newVote);
          });
        }}
        disabled={vote.isPending}
        className="pl-2 flex items-center space-x-1"
      >
        <>
          <IonIcon icon={arrowUp} />
          {/* <ArrowBigUp */}
          {/*   // Not sure why this is nessesary, but */}
          {/*   // it wasn't clearning the color without */}
          {/*   // this when you undo your vote */}
          {/*   key={isUpvoted ? 0 : 1} */}
          {/*   fill={isUpvoted ? theme.accentBackground.val : theme.background.val} */}
          {/*   color={isUpvoted ? "$accentBackground" : undefined} */}
          {/*   size="$1" */}
          {/*   mr="$1" */}
          {/* /> */}
          <span
          // color={isUpvoted ? "$accentBackground" : undefined}
          >
            {score}
          </span>
        </>
      </button>
      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 ml-2.5 mr-1" />
      <button
        // h="$2"
        // borderRadius="$12"
        // p={0}
        // pr={7}
        // bg="transparent"
        onClick={async () => {
          const newVote = isDownvoted ? 0 : -1;
          // voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate(newVote);
          });
        }}
        disabled={vote.isPending}
        className="pr-2 flex items-center"
      >
        <IonIcon
          icon={arrowDown}
          className={twMerge(isDownvoted && "text-red-500")}
        />
      </button>
    </div>
  );
}

export function PostCommentsButton({
  commentsCount,
  href,
}: {
  commentsCount: number;
  href?: string;
}) {
  if (!href) {
    return null;
  }
  return (
    <Link
      to={href}
      className="h-7 flex items-center gap-1 border px-2.5 rounded-full border-zinc-200 dark:border-zinc-700"
    >
      <IonIcon icon={chatbubbleOutline} />
      <span>{commentsCount}</span>
    </Link>
  );
}
