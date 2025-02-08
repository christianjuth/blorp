import { Image } from "react-native";

const imageAspectRatioCache = new Map<
  string,
  Promise<{ width: number; height: number }>
>();

export const imageSizeCache = new Map<
  string,
  { width: number; height: number }
>();

export async function measureImage(src: string) {
  if (imageAspectRatioCache.has(src)) {
    return await imageAspectRatioCache.get(src);
  }

  const p = new Promise<{
    width: number;
    height: number;
  }>((resolve, reject) => {
    if (src.endsWith(".gif")) {
      reject();
      return;
    }

    try {
      Image.getSize(
        src,
        (width, height) => {
          imageSizeCache.set(src, { width, height });
          resolve({ width, height });
        },
        reject,
      );
    } catch (err) {
      reject();
    }
  });

  imageAspectRatioCache.set(src, p);

  p.catch(() => {
    imageAspectRatioCache.delete(src);
  });

  return await p;
}
