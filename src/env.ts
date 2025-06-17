import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function parseBoolean(bool?: string) {
  switch (bool?.toLowerCase()) {
    case "true":
    case "1":
      return true;
  }
  return false;
}

export const env = createEnv({
  //server: {},
  clientPrefix: "REACT_APP_",
  client: {
    REACT_APP_NAME: z.string().min(1),
    REACT_APP_DEFAULT_INSTANCE: z
      .string()
      .url()
      .refine((input) => {
        return (
          (input.startsWith("http://") || input.startsWith("https://")) &&
          !input.endsWith("/")
        );
      }),
    REACT_APP_LOCK_TO_DEFAULT_INSTANCE: z.boolean(),
  },
  runtimeEnv: {
    REACT_APP_NAME: import.meta.env["REACT_APP_NAME"] || "Blorp",
    REACT_APP_DEFAULT_INSTANCE:
      import.meta.env["REACT_APP_DEFAULT_INSTANCE"] || "https://lemmy.zip",
    REACT_APP_LOCK_TO_DEFAULT_INSTANCE: parseBoolean(
      import.meta.env["REACT_APP_LOCK_TO_DEFAULT_INSTANCE"],
    ),
  },
  onValidationError: (issues) => {
    console.error("❌ Invalid environment variables:", issues);
    throw new Error("Invalid environment variables");
  },
});

console.log(import.meta.env["REACT_APP_LOCK_TO_DEFAULT_INSTANCE"]);
