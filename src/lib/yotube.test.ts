import { describe, test, expect } from "vitest";
import { parseYouTubeVideoId, isYouTubeVideoUrl } from "./youtube";
import _ from "lodash";

const VIDEO_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-";
const VIDEO_ID = _.sampleSize(VIDEO_ID_CHARS, 11).join("");

describe("parseYouTubeVideoId", () => {
  test.each([
    [`https://youtu.be/${VIDEO_ID}?123`],
    [`https://www.youtube.com/embed/${VIDEO_ID}?123`],
    [`https://www.youtube.com/watch?v=${VIDEO_ID}?asd`],
    [`https://youtu.be/${VIDEO_ID}&123`],
    [`https://www.youtube.com/embed/${VIDEO_ID}&123`],
    [`https://www.youtube.com/watch?v=${VIDEO_ID}&asd`],
    [`https://youtu.be/${VIDEO_ID}/123`],
    [`https://www.youtube.com/embed/${VIDEO_ID}/123`],
    [`https://www.youtube.com/watch?v=${VIDEO_ID}/asd`],
    [`https://youtube.com/shorts/${VIDEO_ID}?feature=share`],
  ])(`parseYouTubeVideoId("%s") == "${VIDEO_ID}"`, (url) => {
    expect(parseYouTubeVideoId(url)).toBe(VIDEO_ID);
  });
});

describe("isYouTubeVideoUrl", () => {
  test.each([
    [`https://youtu.be/${VIDEO_ID}?123`],
    [`https://www.youtube.com/embed/${VIDEO_ID}?123`],
    [`https://www.youtube.com/watch?v=${VIDEO_ID}?asd`],
    [`https://youtu.be/${VIDEO_ID}&123`],
    [`https://www.youtube.com/embed/${VIDEO_ID}&123`],
    [`https://www.youtube.com/watch?v=${VIDEO_ID}&asd`],
    [`https://youtu.be/${VIDEO_ID}/123`],
    [`https://www.youtube.com/embed/${VIDEO_ID}/123`],
    [`https://www.youtube.com/watch?v=${VIDEO_ID}/asd`],
    [`https://youtube.com/shorts/${VIDEO_ID}?feature=share`],
  ])(`isYouTubeVideoUrl("%s")"`, (url) => {
    expect(isYouTubeVideoUrl(url)).toBe(true);
  });
});
