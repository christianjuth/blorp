import { LemmyV3Api } from "./lemmy-v3";
import { LemmyV4Api } from "./lemmy-v4";
import { ApiBlueprint } from "./api-blueprint";
import z from "zod";
import _ from "lodash";
import { PieFedApi } from "./piefed";

const nodeInfoSchema = z.object({
  software: z.object({
    name: z.enum(["lemmy", "piefed"]),
    version: z.string(),
  }),
});

export const apiClient = _.memoize(
  async ({
    instance,
    jwt,
  }: {
    instance: string;
    jwt?: string;
  }): Promise<ApiBlueprint<any>> => {
    instance = instance.replace(/\/$/, "");

    const res = await fetch(`${instance}/nodeinfo/2.1`);
    const json = await res.json();

    const nodeInfo = nodeInfoSchema.parse(json);

    switch (nodeInfo.software.name) {
      case "lemmy": {
        if (nodeInfo.software.version.startsWith("1.")) {
          return new LemmyV4Api({ instance, jwt });
        } else {
          return new LemmyV3Api({ instance, jwt });
        }
      }
      case "piefed": {
        return new PieFedApi({ instance, jwt });
      }
    }

    // throw new Error("no compatable api for instance");
  },
  (params) => {
    return params.instance + params.jwt;
  },
);
