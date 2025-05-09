import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  //server: {},
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  clientPrefix: "REACT_APP_",
  client: {
    REACT_APP_NAME: z.string().min(1),
    REACT_APP_LOGO_SRC: z.string().optional(),
    REACT_APP_DEFAULT_INSTANCE: z
      .string()
      .url()
      .refine((input) => {
        return (
          (input.startsWith("http://") || input.startsWith("https://")) &&
          !input.endsWith("/")
        );
      }),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    REACT_APP_NAME: import.meta.env["REACT_APP_NAME"] ?? "Blorp",
    REACT_APP_LOGO_SRC: import.meta.env["REACT_APP_LOGO_SRC"],
    REACT_APP_DEFAULT_INSTANCE:
      import.meta.env["REACT_APP_NAME"] ?? "https://lemm.ee",
  },
});
