const REGEX =
  /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
export function parseYouTubeVideoId(url: string) {
  const match = url.match(REGEX);
  return match && match[7].length == 11 ? match[7] : false;
}

export function isYouTubeVideoUrl(url: string) {
  return url.indexOf("youtu") > -1 && parseYouTubeVideoId(url);
}
