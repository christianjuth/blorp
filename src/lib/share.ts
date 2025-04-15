// Copied from
// https://github.com/aeharding/voyager/blob/f123ad405d61e79e52c99241bda4cac349f92695/src/features/share/asImage/ShareAsImageModal.tsx#L19

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function blobToString(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = btoa(reader.result as string);
      resolve(base64String);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(blob);
  });
}

export async function shareImage(name: string, imageUrl: string) {
  // Fetch the image as a blob.
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${imageUrl}`);
  }
  const blob = await response.blob();

  if (!blob) return;

  const filename = `${name
    .replace(/^https:\/\//, "")
    .replaceAll(/\//g, "-")}.png`;

  const file = new File([blob], filename, {
    type: "image/png",
  });

  const webSharePayload: ShareData = { files: [file] };

  if (Capacitor.isNativePlatform()) {
    const data = await blobToString(blob);
    const file = await Filesystem.writeFile({
      data,
      directory: Directory.Cache,
      path: filename,
    });
    await Share.share({ files: [file.uri] });
    await Filesystem.deleteFile({ path: file.uri });
  } else if ("canShare" in navigator && navigator.canShare(webSharePayload)) {
    navigator.share(webSharePayload);
  } else {
    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(file);
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
