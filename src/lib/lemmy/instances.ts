import z from "zod";

export const instanceSchema = z.object({
  name: z.string(),
  baseurl: z.string(),
  url: z.string(),
  score: z.number(),
  open: z.boolean().optional(),
  private: z.boolean().optional(),
  counts: z.object({
    users_active_month: z.number(),
    posts: z.number(),
  }),
  tags: z.array(z.string()),
  nsfw: z.boolean().optional(),
});

type Instance = z.infer<typeof instanceSchema>;

export const PIEFED_INSTANCES: Instance[] = [
  {
    name: "PieFed (preferred.social)",
    baseurl: "preferred.social",
    url: "https://preferred.social/",
    score: 0,
    open: true,
    private: false,
    counts: {
      users_active_month: 0,
      posts: 0,
    },
    tags: [],
    nsfw: false,
  },
  {
    name: "PieFed (pythag.net)",
    baseurl: "pythag.net",
    url: "https://pythag.net/",
    score: 0,
    open: true,
    private: false,
    counts: {
      users_active_month: 0,
      posts: 0,
    },
    tags: [],
    nsfw: false,
  },
];

const PIEFED_BASEURLS = PIEFED_INSTANCES.map((i) => i.baseurl);

export function isPieFed(instance: string) {
  if (instance.startsWith("https://") || instance.startsWith("http://")) {
    const url = new URL(instance);
    instance = url.host;
  }
  return PIEFED_BASEURLS.includes(instance);
}
