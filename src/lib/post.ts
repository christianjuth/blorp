import { Post } from "lemmy-js-client";
import { isYouTubeVideoUrl } from "./youtube";

export function getPostEmbed(post: Post) {
  const urlContentType = post.url_content_type;

  let embedType: "image" | "video" | "article" | "youtube" = "article";

  if (
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
    post.url?.endsWith(".mp4")
  ) {
    embedType = "video";
  } else if (post.url && isYouTubeVideoUrl(post.url)) {
    embedType = "youtube";
  }

  let thumbnail = post.thumbnail_url;
  if (!thumbnail && post.url && embedType === "image") {
    thumbnail = post.url;
  }

  return {
    type: embedType,
    thumbnail,
  };
}
