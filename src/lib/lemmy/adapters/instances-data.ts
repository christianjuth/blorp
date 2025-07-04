const PIE_FED_INSTANCES = [
  "https://piefed.social",
  "https://feddit.online",
  "https://preferred.social",
  "https://pythag.net",
].map((url) => ({
  url,
  baseUrl: new URL(url).host,
  score: -1,
  software: "piefed",
}));

const LEMMY_INSTANCES = ["https://lemmy.world"].map((url) => ({
  url,
  baseUrl: new URL(url).host,
  score: -1,
  software: "lemmy",
}));

export const INSTANCES = [...PIE_FED_INSTANCES, ...LEMMY_INSTANCES];
