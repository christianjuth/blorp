import _ from "lodash";
import imageCompression from "browser-image-compression";
import isAnimated from "@frsource/is-animated";

/**
 * Returns true if the given file is an animated format we care about.
 */
export async function isAnimatedImage(file: File): Promise<boolean> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    return isAnimated(arrayBuffer);
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function compressImage(file: File) {
  try {
    if (await isAnimatedImage(file)) {
      return file;
    }
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
    });
  } catch (err) {
    console.error(err);
    return file;
  }
}
