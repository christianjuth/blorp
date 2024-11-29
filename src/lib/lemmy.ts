import { LemmyHttp, Login } from "lemmy-js-client";

// Build the client
const baseUrl = "https://lemmy.world";
export const lemmy: LemmyHttp = new LemmyHttp(baseUrl);
