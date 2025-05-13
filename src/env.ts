import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  //server: {},
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
  runtimeEnv: {
    REACT_APP_NAME: import.meta.env["REACT_APP_NAME"] || "Blorp",
    REACT_APP_LOGO_SRC: import.meta.env["REACT_APP_LOGO_SRC"],
    REACT_APP_DEFAULT_INSTANCE:
      import.meta.env["REACT_APP_NAME"] || "https://lemm.ee",
  },
});
