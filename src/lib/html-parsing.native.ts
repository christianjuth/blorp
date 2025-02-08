import { parseHTML } from "linkedom";

export const extractLoopsVideoSrc = (html: string) => {
  try {
    const { document } = parseHTML(html);
    const videoPlayer = document.querySelector("video-player");
    return videoPlayer?.getAttribute("video-src") || undefined;
  } catch (err) {
    return undefined;
  }
};

export const parseOgData = (html: string) => {
  const { document } = parseHTML(html);

  const title = document.querySelector("title")?.textContent || "";

  // Try to find the og:image meta tag
  const ogImage = document
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content");

  // Fallback to twitter:image if og:image is not found
  const twitterImage = document
    .querySelector('meta[name="twitter:image"]')
    ?.getAttribute("content");

  const image = ogImage ?? twitterImage;

  return {
    title,
    image,
  };
};
