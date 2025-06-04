import { isYouTubeVideoUrl } from "./youtube";
import { Schemas } from "./lemmy/adapters/api-blueprint";

export function getPostEmbed(
  post: Schemas.Post,
  imageMode: "optimized" | "full-resolution",
) {
  const urlContentType = post.urlContentType;

  let embedType: "image" | "video" | "article" | "youtube" | "loops" | "text" =
    "text";

  if (post.url?.startsWith("https://loops.video")) {
    embedType = "loops";
  } else if (
    (urlContentType && urlContentType.indexOf("image/") !== -1) ||
    post.url?.endsWith(".jpeg") ||
    post.url?.endsWith(".jpg") ||
    post.url?.endsWith(".png") ||
    post.url?.endsWith(".webp") ||
    post.url?.endsWith(".gif")
  ) {
    embedType = "image";
  } else if (
    (urlContentType && urlContentType.indexOf("video/") !== -1) ||
    post.url?.endsWith(".mp4") ||
    post.url?.endsWith(".gifv")
  ) {
    embedType = "video";
  } else if (post.url && isYouTubeVideoUrl(post.url)) {
    embedType = "youtube";
  } else if (post.url) {
    embedType = "article";
  }

  let thumbnail = post.thumbnailUrl;
  if (
    (!thumbnail || imageMode === "full-resolution") &&
    post.url &&
    embedType === "image"
  ) {
    thumbnail = post.url;
  }

  return {
    type: embedType,
    thumbnail,
  };
}
